import { randomUUID } from "node:crypto";
import { chatPrompt as prompt } from "#prompt-content";
import { prepareAnalysis, knowledge } from "./analysis.mjs";
import { validateAIReport, AnalysisError } from "../src/ai-contract.js";
import { CHAT_LIMITS, validateChatReply } from "../src/chat-contract.js";
import { DEEPSEEK_URL } from "./deepseek.mjs";
export function prepareChat(input) {
  const reject = (code, message) => {
    throw new AnalysisError(code, message, 422);
  };
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).some(
      (k) =>
        !["assessment", "report", "inputHash", "history", "question"].includes(
          k,
        ),
    )
  )
    reject("INVALID_CHAT_REQUEST", "追问资料格式不正确。");
  const prepared = prepareAnalysis(input.assessment);
  if (input.inputHash !== prepared.inputHash)
    reject("STALE_MEMORY", "答卷或背景已变化，请重新生成报告后继续问。");
  let report;
  try {
    report = validateAIReport(input.report, {
      evidence: prepared.evidence,
      knowledge: knowledge.entries,
      disabledSections: prepared.disabledSections,
      allowHealth: prepared.allowHealth,
    });
  } catch {
    reject("INVALID_CHAT_MEMORY", "报告记忆与本次资料不匹配，请重新生成报告。");
  }
  if (
    typeof input.question !== "string" ||
    !input.question.trim() ||
    input.question.length > CHAT_LIMITS.question
  )
    reject("INVALID_QUESTION", "问题不能为空，最多1500字。");
  const history = input.history;
  if (
    !Array.isArray(history) ||
    history.length > 2 * (CHAT_LIMITS.turns - 1) ||
    history.length % 2 !== 0
  )
    reject(
      "INVALID_CHAT_HISTORY",
      "对话轮次不完整或已达上限，请下载后清空对话继续。",
    );
  let total = 0;
  for (let i = 0; i < history.length; i++) {
    const m = history[i],
      role = i % 2 ? "assistant" : "user";
    if (
      !m ||
      m.role !== role ||
      typeof m.content !== "string" ||
      !m.content.trim() ||
      m.content.length >
        (role === "user" ? CHAT_LIMITS.question : CHAT_LIMITS.answer) ||
      Object.keys(m).some((k) => !["role", "content"].includes(k))
    )
      reject("INVALID_CHAT_HISTORY", "对话内容不完整，未发送。");
    total += m.content.length;
  }
  if (total > CHAT_LIMITS.historyCharacters)
    reject(
      "CHAT_MEMORY_LIMIT",
      "对话已较长，请下载记录、清空对话后继续；测试资料会保留。",
    );
  return { prepared, report, question: input.question.trim(), history };
}
export async function generateChat(
  input,
  {
    apiKey,
    model = "deepseek-flash",
    fetchImpl = fetch,
    signal,
    timeoutMs = 180000,
  } = {},
) {
  if (!apiKey)
    throw new AnalysisError("AI_NOT_CONFIGURED", "DeepSeek后端尚未配置。", 503);
  if (!["deepseek-flash", "deepseek-v4-pro"].includes(model))
    throw new AnalysisError("MODEL_NOT_CONFIGURED", "后端模型配置无效。", 503);
  const { prepared, report, question, history } = prepareChat(input);
  const memory = {
    overall: report.overall,
    themes: report.themes,
    sections: report.sections.map(({ id, status, summary, alternative }) => ({
      id,
      status,
      summary,
      alternative,
    })),
    perspectives: report.perspectives,
    formulations: report.formulations,
    priorities: report.priorities,
    uncertainties: report.uncertainties,
  };
  let response;
  try {
    response = await fetchImpl(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)])
        : AbortSignal.timeout(timeoutMs),
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: prompt },
          {
            role: "user",
            content: JSON.stringify({
              assessment_packet: prepared.packet,
              prior_report: memory,
              knowledge_base: knowledge.entries,
              conversation: history,
              current_question: question,
            }),
          },
        ],
        thinking: { type: "enabled" },
        reasoning_effort: "high",
        response_format: { type: "json_object" },
        max_tokens: 8192,
        stream: false,
      }),
    });
  } catch {
    throw new AnalysisError(
      signal?.aborted ? "CANCELLED" : "PROVIDER_UNAVAILABLE",
      signal?.aborted
        ? "追问已取消。"
        : "追问超时或DeepSeek暂不可用，请稍后重试。",
      504,
    );
  }
  if (!response.ok)
    throw new AnalysisError(
      "PROVIDER_UNAVAILABLE",
      response.status === 401 || response.status === 402
        ? "站点密钥或余额需要维护者检查。"
        : "DeepSeek暂时无法回答，请稍后重试。",
      502,
    );
  let raw, reply;
  try {
    const body = await response.text();
    if (body.length > 500000) throw Error();
    raw = JSON.parse(body);
    const choice = raw.choices?.[0];
    if (
      choice?.finish_reason !== "stop" ||
      typeof choice?.message?.content !== "string"
    )
      throw Error();
    reply = JSON.parse(choice.message.content);
  } catch {
    throw new AnalysisError(
      "INCOMPLETE_CHAT",
      "AI未返回完整答复，本次未展示截断内容。",
      502,
    );
  }
  const result = validateChatReply(reply, prepared.evidence, knowledge.entries);
  return {
    requestId: randomUUID(),
    provider: "DeepSeek",
    model,
    inputHash: prepared.inputHash,
    ...result,
    evidence: result.evidenceIds.map((id) =>
      id === "chat:question"
        ? { id, label: "本次追问的新信息" }
        : { id, label: prepared.evidence.find((e) => e.id === id).label },
    ),
    knowledge: result.knowledgeIds.map((id) => ({
      id,
      title: knowledge.entries.find((k) => k.id === id).title,
    })),
    usage: {
      prompt_tokens: Number(raw.usage?.prompt_tokens) || 0,
      completion_tokens: Number(raw.usage?.completion_tokens) || 0,
      requests: 1,
    },
  };
}

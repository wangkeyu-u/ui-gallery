import { randomUUID } from "node:crypto";
import {
  prepareAnalysis,
  buildMessages,
  buildReviewMessages,
  knowledge,
  PROMPT_VERSION,
} from "./analysis.mjs";
import { validateAIReport, AnalysisError } from "../src/ai-contract.js";
export const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const REVISION_CATEGORIES = [
  "grounding",
  "counterexamples",
  "context",
  "relationship_scope",
  "redundancy",
  "clinical_boundary",
  "actionability",
];
export async function generateAnalysis(
  input,
  {
    apiKey,
    model = "deepseek-flash",
    review = true,
    fetchImpl = fetch,
    signal,
    timeoutMs = 240000,
  } = {},
) {
  if (!apiKey)
    throw new AnalysisError(
      "AI_NOT_CONFIGURED",
      "站点尚未配置 DeepSeek 后端密钥，普通结果仍可使用。",
      503,
    );
  if (!["deepseek-flash", "deepseek-v4-pro"].includes(model))
    throw new AnalysisError("MODEL_NOT_CONFIGURED", "后端模型配置无效。", 503);
  const prepared = prepareAnalysis(input),
    deadline = AbortSignal.timeout(timeoutMs),
    sharedSignal = signal ? AbortSignal.any([signal, deadline]) : deadline;
  const validation = {
    evidence: prepared.evidence,
    knowledge: knowledge.entries,
    disabledSections: prepared.disabledSections,
    allowHealth: prepared.allowHealth,
  };
  const usage = { prompt_tokens: 0, completion_tokens: 0 };
  let calls = 0;
  async function call(messages, stage) {
    let response;
    try {
      sharedSignal.throwIfAborted();
      calls++;
      response = await fetchImpl(DEEPSEEK_URL, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          thinking: { type: "enabled" },
          reasoning_effort: "high",
          response_format: { type: "json_object" },
          max_tokens: 24576,
          stream: false,
        }),
        signal: sharedSignal,
      });
    } catch {
      throw new AnalysisError(
        signal?.aborted ? "CANCELLED" : "PROVIDER_UNAVAILABLE",
        signal?.aborted
          ? "分析请求已取消。"
          : stage === "review"
            ? "综合复核超时或暂不可用，请稍后重试。"
            : "DeepSeek 请求超时或暂不可用，请稍后再试。",
        504,
      );
    }
    if (!response.ok)
      throw new AnalysisError(
        response.status === 401 || response.status === 402
          ? "PROVIDER_CONFIGURATION"
          : "PROVIDER_UNAVAILABLE",
        response.status === 401 || response.status === 402
          ? "站点的 DeepSeek 密钥或余额需要维护者检查。"
          : "DeepSeek 服务暂不可用，请稍后重试。",
        502,
      );
    let raw;
    try {
      const body = await response.text();
      if (body.length > 1200000) throw Error();
      raw = JSON.parse(body);
    } catch {
      throw new AnalysisError(
        "INVALID_PROVIDER_RESPONSE",
        "DeepSeek 返回格式异常，未生成有效报告。",
        502,
      );
    }
    const choice = raw.choices?.[0],
      content = choice?.message?.content;
    if (
      choice?.finish_reason !== "stop" ||
      typeof content !== "string" ||
      !content.trim() ||
      content.length > 120000
    )
      throw new AnalysisError(
        "INCOMPLETE_REPORT",
        stage === "review"
          ? "DeepSeek 未返回完整复核，本次报告未完成。"
          : "DeepSeek 未返回完整报告，本次不展示截断或空白内容。",
        502,
      );
    for (const key of Object.keys(usage)) {
      const value = Number(raw.usage?.[key]);
      if (Number.isFinite(value) && value > 0) usage[key] += value;
    }
    try {
      return JSON.parse(content);
    } catch {
      throw new AnalysisError(
        "INVALID_MODEL_REPORT",
        "DeepSeek 返回的 JSON 不完整，请重试。",
        502,
      );
    }
  }
  let report = validateAIReport(
    await call(buildMessages(prepared), "synthesis"),
    validation,
  );
  let reviewInfo = {
    status: "not_requested",
    revisionCategories: [],
    passes: 1,
  };
  if (review) {
    const result = await call(buildReviewMessages(prepared, report), "review");
    const valid =
      result &&
      ["accept", "revise"].includes(result.decision) &&
      Array.isArray(result.revisions) &&
      result.revisions.length <= REVISION_CATEGORIES.length &&
      new Set(result.revisions).size === result.revisions.length &&
      result.revisions.every((code) => REVISION_CATEGORIES.includes(code));
    if (
      !valid ||
      (result.decision === "accept" &&
        (result.report !== null || result.revisions.length !== 0)) ||
      (result.decision === "revise" && result.revisions.length === 0)
    )
      throw new AnalysisError(
        "INVALID_REVIEW",
        "AI 复核结果不完整，本次不展示未经完整复核的报告。",
        502,
      );
    if (result.decision === "revise")
      report = validateAIReport(result.report, validation);
    reviewInfo = {
      status: result.decision === "revise" ? "revised" : "accepted",
      revisionCategories: result.revisions,
      passes: 2,
    };
  }
  return {
    requestId: randomUUID(),
    provider: "DeepSeek",
    model,
    promptVersion: PROMPT_VERSION,
    knowledgeVersion: knowledge.version,
    generatedAt: new Date().toISOString(),
    inputHash: prepared.inputHash,
    safetySignal: prepared.packet.safety_signal,
    allowHealth: prepared.allowHealth,
    report,
    review: reviewInfo,
    evidence: prepared.evidence,
    knowledge: knowledge.entries.map(({ id, title, sourceIds }) => ({
      id,
      title,
      sourceIds,
    })),
    usage: { ...usage, requests: calls },
  };
}

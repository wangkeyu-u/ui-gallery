import { AnalysisError } from "./ai-contract.js";
export const CHAT_LIMITS = {
  turns: 12,
  question: 1500,
  answer: 6000,
  historyCharacters: 36000,
};
export function chatEndpoint(analysisURL) {
  const u = new URL(analysisURL);
  if (!/\/analyze\/?$/.test(u.pathname))
    throw Error("分析服务地址不支持续聊。");
  u.pathname = u.pathname.replace(/\/analyze\/?$/, "/chat");
  return u.href;
}
export function validateChatReply(value, evidence, knowledge) {
  const fail = () => {
    throw new AnalysisError(
      "INVALID_CHAT_REPLY",
      "AI答复未通过资料与内容检查，本次未展示。",
      502,
    );
  };
  if (
    !value ||
    typeof value.answer !== "string" ||
    !value.answer.trim() ||
    value.answer.length > CHAT_LIMITS.answer
  )
    fail();
  function refs(v, allowed) {
    if (
      !Array.isArray(v) ||
      v.length > 12 ||
      new Set(v).size !== v.length ||
      v.some((id) => typeof id !== "string" || !allowed.has(id))
    )
      fail();
    return v;
  }
  const evidenceIds = refs(
    value.evidenceIds,
    new Set([...evidence.map((e) => e.id), "chat:question"]),
  );
  const knowledgeIds = refs(
    value.knowledgeIds,
    new Set(knowledge.map((k) => k.id)),
  );
  if (!evidenceIds.length && !knowledgeIds.length) fail();
  const answer = value.answer.trim();
  const banned = [
    /(?:患病|确诊|自杀|诊断)(?:概率|可能性|风险)(?:为|是|达到)?\s*\d+\s*%/g,
    /(?:你的童年|你小时候)(?:一定|必然|肯定|说明你).{0,30}(?:创伤|虐待|忽视)/g,
    /(?:你|您)(?:确诊|患有|患上|就是|一定是|肯定是|属于).{0,10}(?:抑郁症|双相|精神分裂|人格障碍|强迫症|ADHD|PTSD|自闭症)/gi,
    /(?:建议|应该|需要)(?:你|您)?(?:服用|停用|减量|加量|换用).{0,12}(?:药|片|胶囊)/g,
    /(?:你|您)(?:就是|属于|的类型是|的MBTI是|是一个?|是)\s*(?:[IE][NS][TF][JP]\b|(?:Ni|Ne|Si|Se|Ti|Te|Fi|Fe)主导)/gi,
  ];
  for (const re of banned)
    for (const m of answer.matchAll(re)) {
      const prefix = answer.slice(Math.max(0, m.index - 24), m.index);
      if (
        !/(?:不能|无法|不代表|不等于|不足以|没有依据|不要|并非).{0,16}$/.test(
          prefix,
        )
      )
        fail();
    }
  return { answer, evidenceIds, knowledgeIds };
}

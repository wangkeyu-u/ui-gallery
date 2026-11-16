// Shared, public output contract. Server recomputes inputs and validates every reference.
export const AI_CONTRACT_VERSION = "1.0";
export const AI_CONSENT_VERSION = "2026-11-15-v1";
export const AI_SECTIONS = [
  ["self", "整体人格与内在动力"],
  ["needs", "关系中的核心需要"],
  ["romance", "你如何对待恋人"],
  ["friendship", "你如何对待朋友"],
  ["family", "你与家庭／照顾者"],
  ["conflict", "冲突、边界与修复"],
  ["emotion", "情绪与自我关系"],
  ["strengths", "你的优势与可用资源"],
  ["blindspots", "容易付出的代价与盲点"],
  ["mental_health", "近期状态与专业评估方向"],
  ["change", "改变的切入点"],
  ["uncertainty", "目前无法确定的部分"],
];
export function analysisIdentity(session) {
  return JSON.stringify({
    version: session.version,
    config: Object.fromEntries(
      Object.entries(session.config)
        .filter(([k]) => k !== "remember")
        .sort(),
    ),
    answers: Object.fromEntries(Object.entries(session.answers).sort()),
  });
}
export class AnalysisError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
export function validateAIReport(
  value,
  {
    evidence = [],
    knowledge = [],
    disabledSections = [],
    allowHealth = false,
  } = {},
) {
  const fail = (message, validationIssue) => {
    const error = new AnalysisError(
      "INVALID_MODEL_REPORT",
      "AI 返回的报告未通过证据和结构检查：" + message,
      502,
    );
    if (validationIssue) error.validationIssue = validationIssue;
    throw error;
  };
  const text = (s, max = 3000) => {
    if (typeof s !== "string" || !s.trim() || s.length > max)
      fail("文字缺失或过长");
    return s.trim();
  };
  const list = (v, min, max, fn) => {
    if (!Array.isArray(v) || v.length < min || v.length > max)
      fail("列表数量不符合约定");
    try {
      return v.map(fn);
    } catch (error) {
      if (error instanceof AnalysisError) throw error;
      fail("列表条目格式错误");
    }
  };
  const evidenceMap = new Map(evidence.map((e) => [e.id, e]));
  const knowledgeMap = new Map(knowledge.map((k) => [k.id, k]));
  const refs = (v, kind, min = 1) => {
    if (Array.isArray(v) && new Set(v).size !== v.length) fail("引用ID重复");
    return list(v, min, 16, (id) => {
      const map = kind === "evidence" ? evidenceMap : knowledgeMap;
      if (typeof id !== "string" || !map.has(id))
        fail("引用了不存在或未完成的证据");
      return id;
    });
  };
  const cited = (x, multi = true) => {
    const evidenceIds = refs(x.evidenceIds, "evidence", multi ? 2 : 1);
    if (
      multi &&
      new Set(evidenceIds.map((id) => evidenceMap.get(id).group)).size < 2
    )
      fail("综合结论需要不同领域的证据", "CROSS_DOMAIN_EVIDENCE");
    return { evidenceIds, knowledgeIds: refs(x.knowledgeIds, "knowledge") };
  };
  if (!value || value.schemaVersion !== AI_CONTRACT_VERSION) fail("版本不匹配");
  const report = {
    schemaVersion: AI_CONTRACT_VERSION,
    overall: {
      summary: text(value.overall?.summary),
      ...cited(value.overall || {}),
    },
    themes: list(value.themes, 2, 5, (t) => ({
      title: text(t.title, 100),
      claim: text(t.claim, 1600),
      alternatives: list(t.alternatives, 1, 3, (s) => text(s, 700)),
      question: text(t.question, 500),
      ...cited(t),
    })),
  };
  report.sections = list(
    value.sections,
    AI_SECTIONS.length,
    AI_SECTIONS.length,
    (s) => {
      if (
        !AI_SECTIONS.some(([id]) => id === s.id) ||
        !["supported", "insufficient"].includes(s.status)
      )
        fail("章节标识无效");
      if (disabledSections.includes(s.id) && s.status !== "insufficient")
        fail("对未施测的关系或健康模块作了判断");
      return {
        id: s.id,
        status: s.status,
        summary: text(s.summary, 2000),
        implications: text(s.implications, 1400),
        alternative: text(s.alternative, 900),
        question: text(s.question, 500),
        ...(s.status === "supported"
          ? cited(s)
          : {
              evidenceIds: refs(s.evidenceIds, "evidence", 0),
              knowledgeIds: refs(s.knowledgeIds, "knowledge"),
            }),
      };
    },
  );
  if (new Set(report.sections.map((s) => s.id)).size !== AI_SECTIONS.length)
    fail("章节重复或遗漏");
  for (const [section, prefix] of [
    ["self", "trait:"],
    ["romance", "attachment:partner:"],
    ["friendship", "attachment:friend:"],
    ["family", "attachment:family:"],
    ["mental_health", "health:"],
  ]) {
    const value = report.sections.find((s) => s.id === section);
    if (
      value.status === "supported" &&
      !value.evidenceIds.some((id) => id.startsWith(prefix))
    )
      fail("章节缺少对应领域的直接证据", "DIRECT_DOMAIN_EVIDENCE");
  }
  report.sections.sort(
    (a, b) =>
      AI_SECTIONS.findIndex(([id]) => id === a.id) -
      AI_SECTIONS.findIndex(([id]) => id === b.id),
  );
  report.cycles = list(value.cycles, 0, 3, (c) => ({
    title: text(c.title, 100),
    trigger: text(c.trigger, 700),
    meaning: text(c.meaning, 700),
    protection: text(c.protection, 700),
    shortTerm: text(c.shortTerm, 700),
    longTerm: text(c.longTerm, 700),
    alternative: text(c.alternative, 700),
    check: text(c.check, 700),
    ...cited(c),
  }));
  report.contradictions = list(value.contradictions, 0, 4, (c) => ({
    observation: text(c.observation, 1000),
    explanations: list(c.explanations, 2, 3, (s) => text(s, 800)),
    question: text(c.question, 700),
    ...cited(c),
  }));
  report.priorities = list(value.priorities, 2, 3, (p) => ({
    title: text(p.title, 100),
    why: text(p.why, 800),
    step: text(p.step, 1000),
    observe: text(p.observe, 700),
    timeframe: text(p.timeframe, 100),
    ...cited(p),
  }));
  report.followUpQuestions = list(value.followUpQuestions, 3, 6, (s) =>
    text(s, 500),
  );
  report.uncertainties = list(value.uncertainties, 3, 6, (s) => text(s, 900));
  // Reject clear diagnostic declarations, invented clinical scores and prescriptions. This is a limited guard, not clinical validation.
  const narrative = JSON.stringify(report);
  const banned = [
    /(你|您)(确诊|患有|患上|就是|一定是|肯定是|属于)(.{0,12})(抑郁症|双相|精神分裂|人格障碍|强迫症|ADHD|PTSD|自闭症)/i,
    /(患病|确诊|自杀|诊断)(概率|可能性|风险)(为|是|达到)?\s*\d+\s*%/,
    /(建议|应该|需要)(你|您)?(服用|停用|减量|加量|换用)(.{0,12})(药|片|胶囊)/,
    /(你的童年|你小时候)(一定|必然|肯定|说明你)(.{0,30})(创伤|虐待|忽视)/,
  ];
  if (banned.some((rx) => rx.test(narrative)))
    fail("出现诊断、病史或用药越界表述");
  if (
    !allowHealth &&
    report.sections.find((s) => s.id === "mental_health").status !==
      "insufficient"
  )
    fail("健康信息未获授权");
  return report;
}

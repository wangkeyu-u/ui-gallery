import { hasConcreteEpisode } from "./ai-context.js";
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
  const episodeIds = ["context:example", "context:meaning", "context:strategy"];
  const episodeReady = hasConcreteEpisode(
    Object.fromEntries(
      episodeIds.map((id) => [id.slice(8), evidenceMap.get(id)?.value]),
    ),
  );
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
  const cited = (x, multi = true, minimum = multi ? 2 : 1) => {
    const evidenceIds = refs(x.evidenceIds, "evidence", minimum);
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
      alternatives: list(t.alternatives, 1, 5, (s) => text(s, 700)),
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
  const rawCycles = Array.isArray(value.cycles) ? value.cycles : [];
  const scopedCycles = episodeReady
    ? rawCycles.filter((c) =>
        episodeIds.every((id) => c?.evidenceIds?.includes(id)),
      )
    : [];
  Object.defineProperty(report, "_omittedCycleCount", {
    value: rawCycles.length - scopedCycles.length,
  });
  report.cycles = list(scopedCycles, 0, 3, (c) => ({
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
  report.formulations = list(value.formulations ?? [], 0, 2, (f) => ({
    title: text(f.title, 100),
    observation: text(f.observation, 1400),
    hypothesis: text(f.hypothesis, 1400),
    possibleFunction: text(f.possibleFunction, 900),
    possibleCost: text(f.possibleCost, 900),
    counterpoints: list(f.counterpoints, 1, 3, (s) => text(s, 700)),
    alternatives: list(f.alternatives, 2, 5, (s) => text(s, 700)),
    question: text(f.question, 700),
    wouldChangeMind: text(f.wouldChangeMind, 900),
    ...cited(f),
  }));
  if (!episodeReady && (report.formulations.length || report.cycles.length))
    fail(
      "缺少具体经历、当时理解或行动目的，不能生成机制假设或功能循环",
      "INFERENCE_SCOPE",
    );
  for (const f of report.formulations)
    if (!episodeIds.every((id) => f.evidenceIds.includes(id)))
      fail(
        "经历假设必须引用事件、当时理解和行动目的三项直接自述",
        "EPISODE_EVIDENCE",
      );
  for (const f of report.formulations)
    for (const alternative of f.alternatives) {
      if (
        !/(可能|也许|假设|如果|待核实|不确定|尚不清楚|尚无法)/.test(
          alternative,
        ) ||
        /(?:^|[。；])你(?:过去|以前|曾经|小时候|童年).{0,10}(?:遇到过|经历过|遭受过|受过|被忽视|被抛弃|被虐待)/.test(
          alternative,
        )
      )
        fail(
          "经历假设的替代解释必须明确是待核实可能，不能把未提供的过去经历写为事实",
          "ALTERNATIVE_UNCERTAINTY",
        );
    }
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
    ...cited(p, false, 2),
  }));
  report.followUpQuestions = list(value.followUpQuestions, 3, 6, (s) =>
    text(s, 500),
  );
  report.uncertainties = list(value.uncertainties, 3, 6, (s) => text(s, 900));
  {
    // Main prose stays descriptive; scoped functional hypotheses belong in their explicit cards.
    // Limited guard for observed failures, not a semantic truth test.
    const assertions = [
      ["overall.summary", report.overall.summary],
      ...report.themes.map((t, i) => [`themes[${i}].claim`, t.claim]),
      ...report.sections.flatMap((s) => [
        [`sections.${s.id}.summary`, s.summary],
        [`sections.${s.id}.implications`, s.implications],
      ]),
    ];
    const unsupported = [
      /(?:短期|暂时|当下|一时)[^，。；\n]{0,24}(?:安心|松一口气|控制感|降低不安|缓解焦虑|减少焦虑)/,
      /(?:靠|用|通过).{0,10}(?:尽责|高标准|表现|可靠).{0,12}(?:换取|维持|获得).{0,10}(?:爱|认可|价值|安全感)/,
    ];
    for (const [path, narrative] of assertions)
      for (const re of unsupported) {
        const m = re.exec(narrative);
        if (!m) continue;
        const prefix = narrative.slice(Math.max(0, m.index - 45), m.index);
        if (
          /(?:不(?:能|必|应|足以)|无法|不知道|尚不清楚|尚未|没有(?:依据|资料|证据)|并非|不是|不代表).{0,28}$/.test(
            prefix,
          )
        )
          continue;
        fail(
          `正文应描述自述与模式，却在${path}推测未报告的短期作用或价值交换机制`,
          "UNSUPPORTED_FUNCTION",
        );
      }
  }
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

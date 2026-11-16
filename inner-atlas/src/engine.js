import {
  QUESTIONS,
  TRAITS,
  CUSTOM,
  CONTEXTS,
  SCENARIOS,
  VERSION,
  DEFAULT_CONFIG,
} from "./data.js";
export function validAnswer(q, value) {
  return Number.isInteger(value) && value >= q.min && value <= q.max;
}
export function keyed(q, value) {
  return q.reverse ? q.min + q.max - value : value;
}
export function scoreGroup(questions, answers) {
  const done = questions.filter((q) => validAnswer(q, answers[q.id]));
  const complete = questions.length > 0 && done.length === questions.length;
  if (!complete)
    return {
      complete: false,
      answered: done.length,
      total: questions.length,
      mean: null,
      sum: null,
      position: null,
    };
  const sum = done.reduce((s, q) => s + keyed(q, answers[q.id]), 0),
    mean = sum / done.length;
  return {
    complete: true,
    answered: done.length,
    total: questions.length,
    mean,
    sum,
    position: Math.round(
      ((mean - questions[0].min) / (questions[0].max - questions[0].min)) * 100,
    ),
  };
}
export function phqBand(score) {
  return score < 5
    ? "0–4：原版最低区间"
    : score < 10
      ? "5–9：原版轻度区间"
      : score < 15
        ? "10–14：原版中度区间"
        : score < 20
          ? "15–19：原版中重度区间"
          : "20–27：原版重度区间";
}
export function gadBand(score) {
  return score < 5
    ? "0–4：原版最低区间"
    : score < 10
      ? "5–9：原版轻度区间"
      : score < 15
        ? "10–14：原版中度区间"
        : "15–21：原版重度区间";
}
export function dimensionText(
  mean,
  low,
  high,
  middle = "你的回答较居中或混合，可能需要结合具体情境理解，暂不突出某一侧。",
) {
  return mean < 2.75 ? low : mean > 3.25 ? high : middle;
}
export function attachmentText(anxiety, avoidance) {
  if (!anxiety.complete || !avoidance.complete)
    return "该关系的两个维度尚未全部答完，暂不生成关系解释。";
  const a = anxiety.mean,
    v = avoidance.mean;
  const anxietyText =
    a > 4.25
      ? "你报告较多关于被忽视、离开或投入不对等的担忧。"
      : a < 3.75
        ? "你报告较少关于被忽视或离开的担忧。"
        : "你对关系回应的担忧较混合，值得结合最近发生的事理解。";
  const avoidanceText =
    v > 4.25
      ? "你同时报告较不容易敞开、讨论困难或依靠对方；压力下可能倾向自己消化。"
      : v < 3.75
        ? "你报告较愿意敞开、交流困难或依靠对方。"
        : "你对敞开与依靠的态度较混合，可能随情境而变化。";
  return (
    anxietyText +
    avoidanceText +
    "这些是当前关系中的连续倾向，不是固定的依恋类型，也不能证明对方的动机或行为。"
  );
}
export function safetySignal(answers) {
  const value = answers["phq-9"];
  return Number.isInteger(value) && value > 0 && value <= 3;
}
export function assess(answers, config = DEFAULT_CONFIG) {
  const group = (module, dimension) =>
    QUESTIONS.filter(
      (q) => q.module === module && (!dimension || q.dimension === dimension),
    );
  const traits = Object.fromEntries(
    Object.entries(TRAITS).map(([id, d]) => {
      const score = scoreGroup(group("personality", id), answers);
      return [
        id,
        {
          ...score,
          ...d,
          id,
          text: score.complete
            ? dimensionText(score.mean, d.lowText, d.highText)
            : "该维度题目未答完整，暂不作解释。",
        },
      ];
    }),
  );
  const attachments = Object.fromEntries(
    Object.entries(CONTEXTS)
      .filter(([id]) => id === "general" || config[id])
      .map(([id, target]) => {
        const anxiety = scoreGroup(group(id, "anxiety"), answers),
          avoidance = scoreGroup(group(id, "avoidance"), answers);
        return [
          id,
          {
            id,
            target,
            anxiety,
            avoidance,
            text: attachmentText(anxiety, avoidance),
          },
        ];
      }),
  );
  const custom = Object.fromEntries(
    Object.entries(CUSTOM).map(([id, d]) => {
      const score = scoreGroup(
        QUESTIONS.filter((q) => q.dimension === id),
        answers,
      );
      return [
        id,
        {
          ...score,
          ...d,
          id,
          text: score.complete
            ? dimensionText(score.mean, d.low, d.high)
            : "该探索维度未答完整，暂不作解释。",
        },
      ];
    }),
  );
  const screens = {};
  for (const id of ["phq", "gad", "pcl"]) {
    const enabled = id === "pcl" ? config.trauma : config.health;
    if (!enabled) continue;
    const score = scoreGroup(group(id), answers);
    screens[id] = {
      ...score,
      id,
      band: score.complete
        ? id === "phq"
          ? phqBand(score.sum)
          : id === "gad"
            ? gadBand(score.sum)
            : "仅报告原始总分，不作诊断或阈值判断"
        : "题目不完整，不计算总分",
    };
  }
  const scenarios = SCENARIOS.flatMap((s, i) =>
    validAnswer(
      QUESTIONS.find((q) => q.id === `scenario-${i + 1}`),
      answers[`scenario-${i + 1}`],
    )
      ? [
          {
            ...s,
            index: i,
            answer: answers[`scenario-${i + 1}`],
            pattern: s.patterns[answers[`scenario-${i + 1}`]],
          },
        ]
      : [],
  );
  const values = group("personality")
    .map((q) => answers[q.id])
    .filter(Number.isInteger);
  const quality = [];
  if (values.length >= 20 && new Set(values).size === 1)
    quality.push(
      "人格题的答案高度重复。可能确实符合你的情况，也可能是机械作答；建议检查正向和反向表达后再理解结果。",
    );
  const conclusions = [];
  if (traits.E.complete)
    conclusions.push({
      title: "你的能量与表达",
      text: traits.E.text,
      evidence: `外向性 ${traits.E.mean.toFixed(2)} / 5`,
      source: "ipip-key",
    });
  if (
    attachments.general?.anxiety.complete &&
    attachments.general?.avoidance.complete
  )
    conclusions.push({
      title: "你如何靠近重要的人",
      text: attachments.general.text,
      evidence: `总体依恋焦虑 ${attachments.general.anxiety.mean.toFixed(2)} / 7，回避 ${attachments.general.avoidance.mean.toFixed(2)} / 7`,
      source: "ecrrs",
    });
  for (const id of ["boundary", "repair", "compassion"])
    if (custom[id].complete)
      conclusions.push({
        title: custom[id].name,
        text: custom[id].text,
        evidence: `原创探索均值 ${custom[id].mean.toFixed(2)} / 5；未经过量表验证`,
        source: custom[id].source,
      });
  const patterns = [];
  const addPattern = (title, text, evidence, check) =>
    patterns.push({ title, text, evidence, check });
  if (
    attachments.general?.anxiety.complete &&
    custom.rumination.complete &&
    attachments.general.anxiety.mean > 4.25 &&
    custom.rumination.mean > 3.25
  )
    addPattern(
      "关系担忧与反复思考，同时被你报告",
      "你既报告较多关于关系回应的担忧，也报告较多反复思虑。它们可能在同一些时刻出现，但这份测试无法确定先后或因果。",
      `总体依恋焦虑 ${attachments.general.anxiety.mean.toFixed(2)}/7；原创反复思虑 ${custom.rumination.mean.toFixed(2)}/5`,
      "回想一次回复延迟：你先注意到什么，怎样解释，有没有直接核实？",
    );
  if (
    traits.A.complete &&
    custom.boundary.complete &&
    traits.A.mean > 3.25 &&
    custom.boundary.mean < 2.75
  )
    addPattern(
      "体谅他人与表达限度，可能需要一起照顾",
      "你报告较多体谅与合作倾向，同时在原创题中报告较少边界表达。可以核实自己是否有时为照顾对方而答应过量；这不意味着体谅一定造成委屈。",
      `宜人性 ${traits.A.mean.toFixed(2)}/5；原创边界 ${custom.boundary.mean.toFixed(2)}/5`,
      "最近一次答应别人时，你是否真的愿意？拒绝的现实代价是什么？",
    );
  if (
    traits.C.complete &&
    custom.compassion.complete &&
    traits.C.mean > 3.25 &&
    custom.compassion.mean < 2.75
  )
    addPattern(
      "认真做事时，也看看怎样对待失误",
      "你报告较多计划与落实倾向，同时在原创题中报告较少自我关怀。这值得放在一起反思，但不能由此诊断完美主义或认定你总是苛责自己。",
      `尽责性 ${traits.C.mean.toFixed(2)}/5；原创自我关怀 ${custom.compassion.mean.toFixed(2)}/5`,
      "一次计划没有完成后，你对自己说了什么？相同情况下，你会怎样回应朋友？",
    );
  if (
    attachments.general?.avoidance.complete &&
    custom.support.complete &&
    attachments.general.avoidance.mean > 4.25 &&
    custom.support.mean < 2.75
  )
    addPattern(
      "依靠别人这件事，可能值得从小处尝试",
      "你报告较少向重要的人敞开或依靠，同时在原创题中报告较少求助与互惠。先判断关系是否安全可靠，再考虑一个范围有限的请求。",
      `总体依恋回避 ${attachments.general.avoidance.mean.toFixed(2)}/7；原创求助互惠 ${custom.support.mean.toFixed(2)}/5`,
      "不求助是在保护你的安全、隐私，还是你想改变却不知如何开始？",
    );
  const contexts = Object.values(attachments).filter(
    (d) => d.id !== "general" && d.anxiety.complete && d.avoidance.complete,
  );
  const comparisons =
    contexts.length >= 2
      ? ["anxiety", "avoidance"].map((axis) => {
          const sorted = [...contexts].sort(
              (a, b) => b[axis].mean - a[axis].mean,
            ),
            high = sorted[0],
            low = sorted.at(-1);
          return {
            axis,
            high: high.id,
            low: low.id,
            difference: high[axis].mean - low[axis].mean,
          };
        })
      : [];
  const practice = Object.values(custom)
    .filter((d) => d.complete)
    .sort(
      (a, b) =>
        (a.id === "rumination" ? 5 - a.mean : a.mean) -
        (b.id === "rumination" ? 5 - b.mean : b.mean),
    )
    .slice(0, 3)
    .map((d) => ({ title: d.name, text: d.practice, need: d.need }));
  return {
    version: VERSION,
    traits,
    attachments,
    custom,
    screens,
    scenarios,
    quality,
    conclusions,
    patterns,
    comparisons,
    practice,
    safety: safetySignal(answers),
    limits:
      "仅反映本次自我报告。中文均为项目译文，尚未做等值性检验、中国常模或临床验证；原创题未经过信效度验证。所有关系解释均为待核实的假设，不能诊断或排除心理疾病。",
  };
}
// Imports are strict: no silent replacement of out-of-range answers or schema mismatch.
export function validateSession(raw) {
  if (
    !raw ||
    typeof raw !== "object" ||
    raw.version !== VERSION ||
    !raw.config ||
    typeof raw.config !== "object" ||
    !raw.answers ||
    typeof raw.answers !== "object" ||
    Array.isArray(raw.answers)
  )
    throw new Error(
      "备份格式或版本不匹配，请使用本网站导出的 v1.0.0 答题备份。",
    );
  const config = {};
  for (const [key, value] of Object.entries(DEFAULT_CONFIG)) {
    if (typeof raw.config[key] !== "boolean")
      throw new Error("备份中的设置格式不正确。");
    config[key] = raw.config[key];
  }
  const answers = {};
  for (const [id, value] of Object.entries(raw.answers)) {
    const q = QUESTIONS.find((q) => q.id === id);
    if (!q || !(value === null || validAnswer(q, value)))
      throw new Error("备份包含未知题目或无效答案，未导入。");
    answers[id] = value;
  }
  return {
    version: VERSION,
    config,
    answers,
    index: Number.isInteger(raw.index)
      ? Math.max(0, Math.min(raw.index, QUESTIONS.length - 1))
      : 0,
    finished: raw.finished === true,
    created:
      typeof raw.created === "string" &&
      /^\d{4}-\d\d-\d\dT/.test(raw.created) &&
      !Number.isNaN(Date.parse(raw.created))
        ? raw.created
        : new Date().toISOString(),
  };
}

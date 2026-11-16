import test from "node:test";
import assert from "node:assert/strict";
import { inferencePolicy, verificationGuide } from "../src/ai-verification.js";
import { makeAnalysisRequest } from "../src/ai-input.js";
import {
  prepareAnalysis,
  buildReviewMessages,
  knowledge,
} from "../api/analysis.mjs";
import { validateAIReport } from "../src/ai-contract.js";
import { fixtureSession, fixtureReport } from "./fixtures/ai.mjs";
const episode = {
  example: "对方晚两小时回复，我发了三条消息。",
  meaning: "我担心安排有变，也想知道是否还记得约定。",
  strategy: "我想确认安排；得到回复后暂时放心，但事情还没有完全谈清。",
};
const prepared = (context = {}, config = {}) =>
  prepareAnalysis(makeAnalysisRequest(fixtureSession(config), context, false));
const validation = (p) => ({
  evidence: p.evidence,
  knowledge: knowledge.entries,
  disabledSections: p.disabledSections,
  allowHealth: false,
});
test("missing or explicitly unknown experience fields do not unlock mechanism inference", () => {
  assert.equal(inferencePolicy({}).level, "patterns_only");
  assert.equal(
    inferencePolicy({ ...episode, meaning: "不知道。" }).level,
    "patterns_only",
  );
  assert.equal(
    inferencePolicy({ ...episode, strategy: "不想说" }).level,
    "patterns_only",
  );
  assert.equal(inferencePolicy(episode).level, "episode_hypotheses");
  const p = prepared(episode);
  assert.equal(p.packet.inference_policy.level, "episode_hypotheses");
  assert.deepEqual(
    JSON.parse(buildReviewMessages(p, fixtureReport(p))[1].content)
      .assessment_packet.context,
    episode,
  );
});
test("verification questions use complete chosen relationships and never promote a difference to a clinical finding", () => {
  const guide = verificationGuide(
    fixtureSession({ partner: false, family: false }),
  );
  assert.equal(guide.comparison, null);
  assert.equal(guide.questions.length, 3);
  assert.ok(
    guide.questions.every(
      (q) => !q.question.includes("恋人") && !q.question.includes("照顾者"),
    ),
  );
  const complete = verificationGuide(fixtureSession());
  assert.ok(complete.comparison);
  assert.ok(complete.questions[0].question.includes("实际反应"));
});
test("scores alone cannot authorize a functional cycle even if its references exist", () => {
  const p = prepared(),
    r = fixtureReport(p);
  assert.equal(r.formulations.length, 0);
  assert.equal(r.cycles.length, 0);
  r.cycles = [
    {
      title: "猜测",
      trigger: "可能触发",
      meaning: "可能理解",
      protection: "可能保护",
      shortTerm: "可能作用",
      longTerm: "可能代价",
      alternative: "另一解释",
      check: "核实",
      ...r.overall,
    },
  ];
  r.cycles[0].evidenceIds = r.overall.evidenceIds;
  r.cycles[0].knowledgeIds = r.overall.knowledgeIds;
  const accepted = validateAIReport(r, validation(p));
  assert.equal(accepted.cycles.length, 0);
  assert.equal(accepted._omittedCycleCount, 1);
});
test("episode hypotheses require all three direct self-reports, distinct alternatives and a revision condition", () => {
  const p = prepared(episode),
    r = fixtureReport(p);
  assert.equal(validateAIReport(r, validation(p)).formulations.length, 1);
  const missing = structuredClone(r);
  missing.formulations[0].evidenceIds =
    missing.formulations[0].evidenceIds.filter(
      (id) => id !== "context:strategy",
    );
  assert.throws(
    () => validateAIReport(missing, validation(p)),
    (e) => e.validationIssue === "EPISODE_EVIDENCE",
  );
  const oneAlternative = structuredClone(r);
  oneAlternative.formulations[0].alternatives = ["唯一解释"];
  assert.throws(() => validateAIReport(oneAlternative, validation(p)));
  const noRevision = structuredClone(r);
  delete noRevision.formulations[0].wouldChangeMind;
  assert.throws(() => validateAIReport(noRevision, validation(p)));
});
test("an unknown purpose remains a gap after input validation and cannot use filled boxes as evidence of depth", () => {
  const p = prepared({ ...episode, strategy: "unknown" });
  assert.equal(p.packet.inference_policy.level, "patterns_only");
  const r = fixtureReport(p);
  assert.equal(r.formulations.length, 0);
  assert.ok(
    knowledge.entries.filter((e) =>
      e.sourceIds.some(
        (id) => id.startsWith("book-") && id.endsWith("excerpt"),
      ),
    ).length >= 5,
  );
});
test("a pattern-only report cannot hide an unreported relief mechanism in its prose", () => {
  const p = prepared(),
    r = fixtureReport(p);
  r.sections.find((s) => s.id === "romance").implications =
    "短期可能让你暂时安心，但长期影响还不知道。";
  assert.throws(
    () => validateAIReport(r, validation(p)),
    (e) => e.validationIssue === "UNSUPPORTED_FUNCTION",
  );
  r.sections.find((s) => s.id === "romance").implications =
    "目前无法判断反复确认是否让你短期安心，需要具体经历核实。";
  assert.equal(validateAIReport(r, validation(p)).formulations.length, 0);
});
test("an alternative explanation cannot quietly invent an unreported history", () => {
  const p = prepared(episode),
    r = fixtureReport(p);
  r.formulations[0].alternatives = [
    "这次同时包含两种目的。",
    "你过去遇到过对方不按计划回应，因此形成了习惯。",
  ];
  assert.throws(
    () => validateAIReport(r, validation(p)),
    (e) => e.validationIssue === "ALTERNATIVE_UNCERTAINTY",
  );
  r.formulations[0].alternatives = [
    "一种待核实可能是沟通安排需要。",
    "另一种可能是当时状态的影响，需要同类经历区分。",
  ];
  assert.equal(validateAIReport(r, validation(p)).formulations.length, 1);
});
test("four qualified alternatives are preserved rather than rejecting a valid report for a display limit", () => {
  const p = prepared(),
    r = fixtureReport(p);
  r.themes[0].alternatives = [
    "可能与当前安排有关。",
    "可能与题目理解有关。",
    "可能与具体对象有关。",
    "可能需要更多经历才能区分。",
  ];
  assert.deepEqual(
    validateAIReport(r, validation(p)).themes[0].alternatives,
    r.themes[0].alternatives,
  );
});
test("a local action may use two relevant dimensions from one domain without inventing a cross-domain citation", () => {
  const p = prepared(),
    r = fixtureReport(p);
  r.priorities[0].evidenceIds = ["explore:compassion", "explore:rumination"];
  assert.equal(
    validateAIReport(r, validation(p)).priorities[0].evidenceIds.length,
    2,
  );
  r.priorities[0].evidenceIds = ["explore:compassion"];
  assert.throws(() => validateAIReport(r, validation(p)));
});
test("one episode does not authorize cycles about other behaviors", () => {
  const p = prepared(episode),
    r = fixtureReport(p);
  const filtered = validateAIReport(r, validation(p));
  assert.equal(filtered.cycles.length, 0);
  assert.equal(filtered._omittedCycleCount, 1);
  r.cycles[0].evidenceIds = [
    "context:example",
    "context:meaning",
    "context:strategy",
    "trait:C",
  ];
  assert.equal(validateAIReport(r, validation(p)).cycles.length, 1);
});
test("an episode does not authorize new unreported functions in the main personality prose", () => {
  const p = prepared(episode),
    r = fixtureReport(p);
  r.sections.find((s) => s.id === "self").implications =
    "你用高标准换取价值感。";
  assert.throws(
    () => validateAIReport(r, validation(p)),
    (e) => e.validationIssue === "UNSUPPORTED_FUNCTION",
  );
});

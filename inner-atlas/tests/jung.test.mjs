import test from "node:test";
import assert from "node:assert/strict";
import { QUESTIONS, DEFAULT_CONFIG, activeQuestions } from "../src/data.js";
import { assess, validateSession } from "../src/engine.js";
import { analysisCoverage, makeAnalysisRequest } from "../src/ai-input.js";
import { prepareAnalysis, knowledge } from "../api/analysis.mjs";
import { validateAIReport } from "../src/ai-contract.js";
import { fixtureSession, fixtureReport } from "./fixtures/ai.mjs";
const prepare = (config = {}) =>
  prepareAnalysis(makeAnalysisRequest(fixtureSession(config), {}, false));
const check = (report, p) =>
  validateAIReport(report, {
    evidence: p.evidence,
    knowledge: knowledge.entries,
    disabledSections: p.disabledSections,
  });
test("older v1 backups keep all answers and do not silently enable the added chapter", () => {
  const old = fixtureSession({ jung: false });
  delete old.config.jung;
  const restored = validateSession(old);
  assert.equal(restored.config.jung, false);
  assert.deepEqual(restored.answers, old.answers);
  assert.equal(activeQuestions(restored.config).length, 142);
});
test("Jung self-report never alters Big Five, attachment or symptom scoring", () => {
  const session = fixtureSession({ health: true, jung: false });
  const baseline = assess(session.answers, session.config);
  const expanded = {
    ...session.answers,
    ...Object.fromEntries(
      QUESTIONS.filter((q) => q.module === "jung").map((q) => [q.id, q.max]),
    ),
  };
  const result = assess(expanded, { ...session.config, jung: true });
  for (const key of ["traits", "attachments", "screens"])
    assert.deepEqual(result[key], baseline[key]);
  assert.deepEqual(assess(expanded, session.config).jung, {});
});
test("three-item exploratory means preserve reverse wording, missingness and simultaneous endorsements", () => {
  const qs = QUESTIONS.filter((q) => q.module === "jung");
  const answers = Object.fromEntries(qs.map((q) => [q.id, q.reverse ? 1 : 5]));
  const complete = assess(answers).jung;
  assert.equal(Object.keys(complete).length, 8);
  for (const d of Object.values(complete)) assert.equal(d.mean, 5);
  delete answers["jung-Se-2"];
  const partial = assess(answers).jung;
  assert.equal(partial.Se.mean, null);
  assert.equal(partial.Se.answered, 2);
  assert.equal(partial.Si.mean, 5);
});
test("Jung answers cannot substitute for core coverage and disabled answers are not transmitted", () => {
  const s = fixtureSession();
  assert.equal(analysisCoverage(s).total, 142);
  const onlyJung = {
    ...s,
    answers: Object.fromEntries(
      Object.entries(s.answers).filter(([id]) => id.startsWith("jung-")),
    ),
  };
  assert.throws(
    () => prepareAnalysis(makeAnalysisRequest(onlyJung, {}, false)),
    /基础题/,
  );
  const off = { ...s, config: { ...s.config, jung: false } };
  assert.ok(
    !Object.keys(makeAnalysisRequest(off, {}, false).session.answers).some(
      (id) => id.startsWith("jung-"),
    ),
  );
});
test("an eight-function profile reaches both direct evidence and an explicit cross-theory card", () => {
  const p = prepare();
  assert.equal(p.packet.jung_coverage.completeFunctions.length, 8);
  assert.equal(p.evidence.filter((e) => e.id.startsWith("jung:")).length, 8);
  const report = fixtureReport(p);
  assert.equal(check(report, p).perspectives[0].theoryId, "jung");
  report.perspectives = [];
  assert.throws(() => check(report, p), /荣格交叉解读/);
});
test("unmeasured or incomplete functions cannot be filled from personality references", () => {
  const off = prepare({ jung: false });
  const full = prepare();
  const report = fixtureReport(full);
  assert.throws(() => check(report, off), /不存在/);
  const p = prepare();
  const r = fixtureReport(p);
  r.perspectives[0].evidenceIds = ["trait:E", "attachment:general:anxiety"];
  assert.throws(() => check(r, p), /直接对应资料/);
});
test("needs and appraisal lenses cannot invent the context they require", () => {
  const p = prepare();
  const r = fixtureReport(p);
  const card = {
    ...r.perspectives[0],
    theoryId: "needs",
    evidenceIds: ["trait:E", "explore:boundary"],
  };
  r.perspectives.push(card);
  assert.throws(() => check(r, p), /直接对应资料/);
  r.perspectives[1].theoryId = "appraisal";
  assert.throws(() => check(r, p), /经历的三项/);
});
test("direct type declarations are rejected even when citations and structure are valid", () => {
  const p = prepare();
  const r = fixtureReport(p);
  r.overall.summary = "你是INFJ，所以不需要再核实。";
  assert.throws(() => check(r, p), /越界/);
  const off = prepare({ jung: false });
  const unmeasured = fixtureReport(off);
  unmeasured.overall.summary = "你的Ne较强，说明你总能想到新的方向。";
  assert.throws(() => check(unmeasured, off), /未施测八维/);
});

test("provider output must contain an integrated portrait while historical display remains readable", () => {
  const p = prepare();
  const r = fixtureReport(p);
  delete r.overall.portrait;
  assert.throws(
    () =>
      validateAIReport(r, {
        evidence: p.evidence,
        knowledge: knowledge.entries,
        disabledSections: p.disabledSections,
        requirePortrait: true,
      }),
    /整体人格画像/,
  );
  assert.doesNotThrow(() => check(r, p));
});
test("a portrait needs personality, a relationship and a third domain rather than two rephrased scores", () => {
  const p = prepare();
  const r = fixtureReport(p);
  r.overall.portrait.evidenceIds = [
    "trait:E",
    "trait:O",
    "attachment:general:anxiety",
  ];
  assert.throws(() => check(r, p), /第三个领域/);
  r.overall.portrait.evidenceIds = [
    "trait:E",
    "attachment:general:anxiety",
    "explore:empathy",
  ];
  assert.doesNotThrow(() => check(r, p));
  r.overall.portrait.core = "你通过高标准换取被爱。";
  assert.throws(() => check(r, p), /正文应描述/);
});

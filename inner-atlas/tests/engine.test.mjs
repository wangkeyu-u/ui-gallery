import test from "node:test";
import assert from "node:assert/strict";
import {
  QUESTIONS,
  MODULES,
  DEFAULT_CONFIG,
  activeQuestions,
  TRAITS,
  VERSION,
} from "../src/data.js";
import {
  assess,
  scoreGroup,
  phqBand,
  gadBand,
  validAnswer,
  validateSession,
  safetySignal,
} from "../src/engine.js";
const answersFor = (questions, value) =>
  Object.fromEntries(
    questions.map((q) => [
      q.id,
      typeof value === "function" ? value(q) : value,
    ]),
  );
const allConfig = { ...DEFAULT_CONFIG, health: true, trauma: true };
test("202 unique questions match 12 declared chapter sizes; conditional paths are deterministic", () => {
  assert.equal(QUESTIONS.length, 202);
  assert.equal(new Set(QUESTIONS.map((q) => q.id)).size, 202);
  assert.equal(MODULES.length, 12);
  for (const m of MODULES)
    assert.equal(
      QUESTIONS.filter((q) => q.module === m.id).length,
      m.count,
      m.id,
    );
  assert.equal(activeQuestions(DEFAULT_CONFIG).length, 166);
  assert.equal(
    activeQuestions({ ...DEFAULT_CONFIG, health: true }).length,
    182,
  );
  assert.equal(activeQuestions(allConfig).length, 202);
  assert.equal(
    activeQuestions({
      ...DEFAULT_CONFIG,
      partner: false,
      friend: false,
      family: false,
    }).length,
    139,
  );
});
test("IPIP reverse key matches the published 50-item sample, independently encoded", () => {
  const reverse = [
    2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 29, 30, 32, 34, 36, 38,
    39, 44, 46, 49,
  ];
  const personality = QUESTIONS.filter((q) => q.module === "personality");
  assert.deepEqual(
    personality.filter((q) => q.reverse).map((q) => Number(q.id.split("-")[1])),
    reverse,
  );
  const result = assess(answersFor(personality, 1));
  const expected = { E: 30, A: 26, C: 26, S: 42, O: 22 };
  for (const id of Object.keys(TRAITS)) {
    assert.equal(result.traits[id].total, 10);
    assert.equal(result.traits[id].sum, expected[id]);
    assert.equal(result.traits[id].mean, expected[id] / 10);
  }
});
test("ECR-RS uses six avoidance items, reverses first four, and separately averages final three", () => {
  const answers = answersFor(
    QUESTIONS.filter((q) => q.module === "general"),
    (q) =>
      Number(q.id.split("-")[1]) <= 4
        ? 7
        : Number(q.id.split("-")[1]) <= 6
          ? 1
          : 5,
  );
  const r = assess(answers);
  assert.equal(r.attachments.general.avoidance.mean, 1);
  assert.equal(r.attachments.general.anxiety.mean, 5);
  assert.equal(r.attachments.general.avoidance.position, 0);
});
test("trait upper endpoint, lower endpoint, and midpoint map to the correct positions", () => {
  const qs = QUESTIONS.filter(
    (q) => q.module === "personality" && q.dimension === "E",
  );
  for (const target of [1, 3, 5]) {
    const score = scoreGroup(
      qs,
      answersFor(qs, (q) => (q.reverse ? 6 - target : target)),
    );
    assert.equal(score.mean, target);
    assert.equal(score.position, (target - 1) * 25);
  }
});
test("missing, skipped, invalid and numeric-string answers never become zero or a prorated score", () => {
  const qs = QUESTIONS.filter((q) => q.module === "phq");
  const answers = answersFor(qs, 0);
  for (const value of [undefined, null, 4, -1, NaN, "0", false]) {
    const score = scoreGroup(qs, { ...answers, "phq-3": value });
    assert.equal(score.complete, false);
    assert.equal(score.sum, null);
    assert.equal(score.answered, 8);
  }
  assert.equal(validAnswer(qs[0], 0), true);
});
test("all reference interval boundaries and raw ranges are preserved", () => {
  for (const [score, label] of [
    [0, "0–4"],
    [4, "0–4"],
    [5, "5–9"],
    [9, "5–9"],
    [10, "10–14"],
    [14, "10–14"],
    [15, "15–19"],
    [19, "15–19"],
    [20, "20–27"],
    [27, "20–27"],
  ])
    assert.ok(phqBand(score).includes(label));
  for (const [score, label] of [
    [0, "0–4"],
    [4, "0–4"],
    [5, "5–9"],
    [9, "5–9"],
    [10, "10–14"],
    [14, "10–14"],
    [15, "15–21"],
    [21, "15–21"],
  ])
    assert.ok(gadBand(score).includes(label));
  const r = assess(
    answersFor(QUESTIONS, (q) => q.max),
    allConfig,
  );
  assert.equal(r.screens.phq.sum, 27);
  assert.equal(r.screens.gad.sum, 21);
  assert.equal(r.screens.pcl.sum, 80);
});
test("self-harm support is independent of total, completeness and the other questionnaire items", () => {
  assert.equal(safetySignal({ "phq-9": 1 }), true);
  assert.equal(assess({ "phq-9": 1 }, allConfig).safety, true);
  assert.equal(assess({ "phq-9": 1 }, allConfig).screens.phq.sum, null);
  for (const value of [0, null, undefined, 4, -1, "1"])
    assert.equal(safetySignal({ "phq-9": value }), false);
});
test("unselected health and relation modules do not appear as assessed; empty report infers nothing", () => {
  const r = assess(
    {},
    { ...DEFAULT_CONFIG, partner: false, family: false, friend: false },
  );
  assert.deepEqual(Object.keys(r.screens), []);
  assert.deepEqual(Object.keys(r.attachments), ["general"]);
  assert.equal(r.conclusions.length, 0);
  assert.equal(r.practice.length, 0);
  assert.equal(r.scenarios.length, 0);
});
test("scenario answers remain descriptive and never enter numeric clinical or personality groups", () => {
  const r = assess({ "scenario-1": 0, "scenario-2": 3 });
  assert.equal(r.scenarios.length, 2);
  assert.equal(r.scenarios[0].pattern, "寻找确认");
  assert.equal(r.traits.E.sum, null);
  assert.equal(r.screens.phq, undefined);
});
test("strict backup validation rejects corrupt schemas and unknown or out of range responses", () => {
  const base = {
    version: VERSION,
    config: { ...DEFAULT_CONFIG },
    answers: { "phq-1": 0, "ipip-1": null },
    index: 0,
  };
  assert.deepEqual(validateSession(base).answers, base.answers);
  for (const change of [
    { version: "old" },
    { answers: { unknown: 1 } },
    { answers: { "ipip-1": 0 } },
    { answers: { "ipip-1": "3" } },
    { config: { ...DEFAULT_CONFIG, remember: "yes" } },
    { answers: [] },
  ])
    assert.throws(() => validateSession({ ...base, ...change }));
});
test("joint observations require completed constituent dimensions, and comparisons use only complete real contexts", () => {
  const filled = answersFor(QUESTIONS, (q) => {
    if (q.module === "personality" && q.dimension === "A")
      return q.reverse ? 2 : 4;
    if (q.dimension === "boundary") return q.reverse ? 4 : 2;
    if (q.type === "attachment") {
      const v = q.module === "partner" ? 5 : 2;
      return q.reverse ? 8 - v : v;
    }
    return q.min;
  });
  const full = assess(filled, DEFAULT_CONFIG);
  assert.ok(full.patterns.some((p) => p.title.includes("体谅")));
  assert.equal(full.comparisons[0].difference, 3);
  assert.equal(full.comparisons[0].high, "partner");
  delete filled["boundary-1"];
  delete filled["friend-1"];
  const incomplete = assess(filled, { ...DEFAULT_CONFIG, family: false });
  assert.ok(!incomplete.patterns.some((p) => p.title.includes("体谅")));
  assert.equal(incomplete.comparisons.length, 0);
});

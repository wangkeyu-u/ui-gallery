import { activeQuestions, QUESTIONS } from "./data.js";
import { assess, validAnswer } from "./engine.js";
import { AI_CONSENT_VERSION } from "./ai-contract.js";
import { AI_CONTEXT_IDS } from "./ai-context.js";
export function analysisCoverage(session) {
  const questions = activeQuestions({
    ...session.config,
    health: false,
    trauma: false,
  });
  const results = assess(session.answers, session.config);
  const answered = questions.filter((q) =>
      validAnswer(q, session.answers[q.id]),
    ).length,
    traits = Object.values(results.traits).filter((d) => d.complete).length,
    explorations = Object.values(results.custom).filter(
      (d) => d.complete,
    ).length,
    attachment =
      results.attachments.general.anxiety.complete &&
      results.attachments.general.avoidance.complete,
    scenarios = results.scenarios.length;
  return {
    answered,
    total: questions.length,
    percent: Math.round((answered / questions.length) * 100),
    traits,
    explorations,
    attachment,
    scenarios,
    ready:
      answered / questions.length >= 0.7 &&
      traits >= 3 &&
      explorations >= 4 &&
      attachment &&
      scenarios >= 3,
  };
}
export function makeAnalysisRequest(session, context, health) {
  const allowed = new Set(
    activeQuestions(session.config)
      .filter((q) => health || !["phq", "gad", "pcl"].includes(q.module))
      .map((q) => q.id),
  );
  const answers = Object.fromEntries(
    Object.entries(session.answers).filter(([id]) => allowed.has(id)),
  );
  return {
    session: {
      version: session.version,
      config: { ...session.config, remember: false },
      answers,
    },
    context: Object.fromEntries(
      Object.entries(context).filter(
        ([key, value]) =>
          AI_CONTEXT_IDS.includes(key) &&
          typeof value === "string" &&
          value.trim(),
      ),
    ),
    consent: {
      version: AI_CONSENT_VERSION,
      analysis: true,
      adult: true,
      health: health === true,
    },
  };
}

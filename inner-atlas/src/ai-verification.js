import { assess } from "./engine.js";
import { EPISODE_CONTEXT_IDS, hasEpisodeDetail } from "./ai-context.js";

export const EPISODE_FIELDS = EPISODE_CONTEXT_IDS;
export function inferencePolicy(context = {}) {
  const missing = EPISODE_FIELDS.filter((id) => !hasEpisodeDetail(context[id]));
  return {
    level: missing.length ? "patterns_only" : "episode_hypotheses",
    missingEpisodeFields: missing,
    scope: missing.length
      ? "可以综合形成关于人格倾向与关系方式的整体工作判断；不把未提供的行为功能、核心恐惧或保护机制写成个人结论。"
      : "可以提出只针对这一次自述经历的功能假设，必须保留不同解释、反例与可改变判断的信息；不是原因证明。",
    developmentalOrigins:
      "不从分数或单次经历反推童年、创伤、潜意识、父母动机或终身人格成因。",
  };
}

export function verificationGuide(session) {
  const r = assess(session.answers, session.config);
  const names = {
    partner: "这位恋人",
    friend: "这位最亲近朋友",
    family: "这位照顾者",
  };
  const complete = Object.entries(r.attachments).filter(
    ([id, v]) => names[id] && v.anxiety.complete && v.avoidance.complete,
  );
  let pair = null;
  for (let i = 0; i < complete.length; i++)
    for (let j = i + 1; j < complete.length; j++) {
      const [a, av] = complete[i],
        [b, bv] = complete[j];
      const distance =
        Math.abs(av.anxiety.mean - bv.anxiety.mean) +
        Math.abs(av.avoidance.mean - bv.avoidance.mean);
      if (!pair || distance > pair.distance) pair = { a, b, distance };
    }
  return {
    comparison: pair ? { left: pair.a, right: pair.b } : null,
    note: "这些追问用于核实解释，不增加心理分数。跳过仍可生成答卷报告；补充具体经历后，才尝试解释那一次反应的可能作用。",
    questions: [
      {
        id: "example",
        question: pair
          ? `选一次与${names[pair.a]}的具体互动；如果换成${names[pair.b]}，你的实际反应有什么不同？请区分真实发生与假设。`
          : "选最近一次让你在意的互动，按顺序写发生的事、自己的行动和对方的实际回应。",
      },
      {
        id: "meaning",
        question:
          "在那个时刻，你脑海里具体怎样解释？什么对你重要？哪些只是猜测或暂时不知道？",
      },
      {
        id: "strategy",
        question:
          "你当时做了什么、希望发生什么、实际结果是什么？有没有一次结果和预期相反？",
      },
    ],
  };
}

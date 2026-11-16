// Optional interview-style self-report; none of these fields is a diagnostic score.
export const AI_CONTEXT_FIELDS = [
  [
    "goal",
    "你最想理解自己哪一件事？",
    "例如：为什么和朋友相处轻松，恋爱时却经常担忧？",
  ],
  [
    "recent",
    "最近有什么处境可能影响你的回答？",
    "例如：近期压力、失落、睡眠或关系变化。",
  ],
  [
    "counterexample",
    "有没有一次，你的表现和通常的自己很不一样？",
    "写一个反例，有助于 AI 避免把你说得过于统一。",
  ],
  [
    "history",
    "这种体验持续多久？以前也这样吗？",
    "可说明大致开始时间、持续或间歇、与平常相比的变化。不确定也可以。",
  ],
  [
    "impact",
    "它对日常生活有什么实际影响？",
    "例如：学习／工作、睡眠、自我照顾或关系中具体受影响的事；也可以写没有明显影响。",
  ],
  [
    "example",
    "选一次具体互动：发生了什么，你做了什么？",
    "分别写可观察的经过、自己的理解和行动、对方实际回应；不要猜测对方内心，也不需要身份信息。",
  ],
];
export const AI_CONTEXT_IDS = AI_CONTEXT_FIELDS.map(([id]) => id);
export const emptyAIContext = () =>
  Object.fromEntries(AI_CONTEXT_IDS.map((id) => [id, ""]));

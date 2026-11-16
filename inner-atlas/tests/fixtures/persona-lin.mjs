import { VERSION, DEFAULT_CONFIG, activeQuestions } from "../../src/data.js";
import { makeAnalysisRequest } from "../../src/ai-input.js";

// Preregistered fictional biography. Never included in the model request.
export const persona = {
  id: "persona-lin",
  name: "林澈（虚构，29岁）",
  biography:
    "慢热，陌生聚会里安静，熟悉朋友中能主动聊天。工作有计划、重视兑现承诺，也会偶尔拖延和忘放东西。喜欢想象和新点子，关心他人但不是逢求必应。对最亲近朋友放心、愿意求助；恋人没及时回复时容易担心，在表达脆弱和求助上又有保留。对一位常干涉选择的照顾者保持距离，不常倾诉。冲突时有时先撤开，事后愿意修复。近期工作略忙，偶尔睡不好，没有提供疾病诊断。",
  expected: [
    "陌生社交偏安静，不等于不能和熟人交流",
    "做事有计划、责任感较强，仍允许日常例外",
    "愿意体谅与合作，具有好奇心和想象力",
    "最亲近朋友的安全感高于恋人",
    "恋人关系里担忧较多，敞开与求助有一定保留",
    "与该照顾者的回避或距离感较明显，不能外推整个家庭或成因",
    "修复意愿与偶尔撤开的习惯并存",
    "近期轻微困扰不应被诊断为疾病，不能据低分排除疾病",
  ],
  caveat:
    "这是作者编写的固定角色与答卷的方向核对，不是独立临床效标或准确率研究。",
};

// Raw responses authored item by item from the biography, not generated from target scores or reverse keys.
const raw = {
  personality: [
    2, 1, 5, 3, 4, 4, 4, 2, 4, 2, 4, 1, 4, 3, 4, 4, 4, 2, 4, 2, 2, 2, 4, 3, 4,
    3, 4, 2, 2, 2, 2, 1, 5, 3, 4, 5, 4, 1, 2, 3, 2, 4, 4, 2, 4, 4, 4, 4, 2, 5,
  ],
  general: [5, 5, 4, 4, 4, 4, 4, 4, 5],
  partner: [5, 4, 5, 3, 5, 5, 6, 5, 6],
  friend: [7, 6, 6, 6, 2, 2, 2, 1, 2],
  family: [3, 3, 4, 2, 6, 6, 3, 2, 3],
  regulation: [3, 4, 2, 4, 3, 4],
  rumination: [4, 4, 3, 4, 2, 3],
  compassion: [3, 4, 3, 4, 2, 3],
  worth: [4, 2, 3, 2, 4, 2],
  boundary: [3, 4, 3, 1, 4, 4],
  empathy: [3, 4, 1, 4, 3, 4],
  repair: [4, 2, 4, 2, 2, 4],
  support: [3, 2, 2, 4, 3, 3],
  scenario: [0, 2, 0, 1, 1, 2, 2, 0],
  phq: [0, 0, 1, 1, 0, 0, 1, 0, 0],
  gad: [1, 1, 1, 0, 0, 0, 1],
};
export function personaCase() {
  const config = { ...DEFAULT_CONFIG, health: true, jung: false };
  const counts = {};
  const answers = Object.fromEntries(
    activeQuestions(config).map((q) => {
      const group = [
        "personality",
        "general",
        "partner",
        "friend",
        "family",
        "scenario",
        "phq",
        "gad",
      ].includes(q.module)
        ? q.module
        : q.dimension;
      const index = counts[group] || 0;
      counts[group] = index + 1;
      return [q.id, raw[group][index]];
    }),
  );
  const session = {
    version: VERSION,
    config,
    answers,
    index: 0,
    finished: true,
  };
  return {
    id: persona.id,
    label: "预先设定性格的虚拟人，逐题作答，画像不发送给模型",
    request: makeAnalysisRequest(session, {}, true),
    interactions: {
      skippedThenReturned: ["ipip-15", "worth-2"],
      revised: [
        { id: "ipip-48", initial: 5, final: 4 },
        { id: "partner-5", initial: 7, final: 5 },
      ],
      timing: "浏览器加速回放；不声称耗时或行为分布代表真实人群。",
    },
  };
}

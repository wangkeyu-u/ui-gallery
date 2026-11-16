import { VERSION, DEFAULT_CONFIG, activeQuestions } from "../../src/data.js";
import { makeAnalysisRequest } from "../../src/ai-input.js";

// Preset before the real call; biography and expectations are never sent to the model.
export const persona = {
  id: "persona-zhou",
  name: "周岚（虚构，31岁）",
  biography:
    "活动策划，社交主动，喜欢聚会和新点子，能很快与陌生人聊天。能扛项目责任、在意工作质量，却会把桌面弄乱，拖延日常报销，细节偶尔需同事提醒。关心朋友、愿意实际帮忙，常抢先给解决方案，争论时有时急着反驳，事后能承认具体错误并调整，不是总会耐心倾听。对恋人通常信任，不太担心被抛弃，但不习惯谈很脆弱的感受，仍愿商量实际事务；能向最亲近朋友和所指的这位照顾者求助。边界比较清楚，能拒绝过量请求。遇到冲突可以说明暂停时间再回来，也不是每次都做到。最近两周因活动收尾偶尔睡差、疲倦、分心，大体仍能工作，不设定任何疾病或童年创伤。",
  expected: [
    { id: "social", claim: "社交主动、外向，但不能等同于愿向恋人袒露脆弱。" },
    { id: "work", claim: "有责任心和质量要求，同时日常秩序、即时执行较不稳定；不应写成全面自律或不负责任。" },
    { id: "openness", claim: "喜欢想象、构思和新点子；不能据此推断智商、职业成就。" },
    { id: "partner", claim: "对恋人较少示弱和依靠，同时被抛弃担忧低；不应统一归为焦虑依恋或不爱恋人。" },
    { id: "support", claim: "对所指好友和照顾者较易求助；不能把恋人中的保留推广到所有关系。" },
    { id: "listening", claim: "愿意关心与实际帮忙，但倾听、先反驳或先解决问题仍有盲点。" },
    { id: "conflict", claim: "有边界与修复意愿，具体暂停事件要保留约定回谈及实际回来，不能直接写为惩罚性冷落。" },
    { id: "state", claim: "近期偶发疲劳睡差与分心，不能诊断疾病、排除疾病或推断童年原因。" },
  ],
  unobservable:
    "具体职业、年龄、过去经历和对方内心不是答卷能可靠识别的目标；没有识别出来不算失败。",
  caveat:
    "一个作者同时编写角色与答卷的模拟例子，仅检查方向、遗漏及过度推断，不是独立效标、准确率或真实人群验证。",
};

// Read the individual items, then author raw answers in character, without fitting target scores.
const raw = {
  personality: [
    5, 2, 3, 3, 4, 1, 4, 4, 4, 2,
    4, 1, 3, 2, 4, 2, 3, 4, 4, 2,
    5, 3, 2, 2, 5, 2, 2, 4, 3, 2,
    4, 2, 3, 2, 4, 1, 4, 2, 2, 3,
    4, 3, 3, 3, 4, 1, 4, 4, 1, 4,
  ],
  general: [5, 4, 5, 4, 4, 4, 2, 2, 2],
  partner: [5, 3, 5, 3, 5, 5, 2, 1, 2],
  friend: [6, 6, 6, 5, 2, 2, 2, 1, 2],
  family: [6, 5, 6, 5, 2, 2, 1, 2, 2],
  regulation: [3, 4, 4, 2, 2, 4],
  rumination: [2, 2, 2, 4, 4, 2],
  compassion: [3, 4, 3, 2, 1, 4],
  worth: [4, 4, 2, 2, 4, 2],
  boundary: [4, 4, 2, 1, 4, 4],
  empathy: [2, 3, 2, 2, 4, 4],
  repair: [3, 4, 4, 1, 3, 4],
  support: [3, 3, 2, 3, 4, 4],
  scenario: [2, 2, 2, 2, 0, 2, 2, 2],
  phq: [0, 0, 1, 1, 0, 0, 1, 0, 0],
  gad: [1, 0, 1, 1, 0, 1, 0],
};

export function personaCase() {
  const config = { ...DEFAULT_CONFIG, health: true, jung: false };
  const counts = {};
  const answers = Object.fromEntries(activeQuestions(config).map((q) => {
    const group = Object.hasOwn(raw, q.module) ? q.module : q.dimension;
    const index = counts[group] || 0;
    counts[group] = index + 1;
    const value = raw[group]?.[index];
    if (!Number.isInteger(value) || value < q.min || value > q.max)
      throw new Error("Invalid authored response: " + q.id);
    return [q.id, value];
  }));
  const session = { version: VERSION, config, answers, index: 0, finished: true };
  const context = {
    example: "上周我和恋人讨论周末安排，双方声音变大。我说需要安静二十分钟，并约好八点半继续。我在八点半回来，先承认刚才抢话，然后一起确定了安排。",
    meaning: "当时我发现自己有点烦、听不进后半句，想先理清怎么说。我没有在想他会不会离开我，也没有想靠消失让他着急。",
    strategy: "我希望暂停后能听完整、讨论具体安排，所以说了回来的时间并按时回来。后来谈完了，他说这次说清回谈时间比较好。我仍觉得自己的抢话需要改。",
    counterexample: "并不是每次都这样。上个月有一次我没暂停，先反驳、急着给方案，谈得更僵，第二天才道歉。最亲近的朋友难过时，我也有先给建议、后来才发现她想被听见的时候。",
  };
  return {
    id: persona.id,
    label: "新虚拟人，完整题目经页面作答，仅发送一次具体经历自述，人物设定不发送",
    request: makeAnalysisRequest(session, context, true),
    interactions: {
      skippedThenReturned: ["ipip-27", "support-4"],
      revised: [
        { id: "empathy-1", initial: 3, final: 2 },
        { id: "partner-2", initial: 4, final: 3 },
      ],
      timing: "加速模拟，含中间选项、返回与修改；不声称代表真实答题耗时或分布。",
    },
  };
}

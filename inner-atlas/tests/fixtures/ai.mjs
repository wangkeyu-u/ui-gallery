import { VERSION, DEFAULT_CONFIG, activeQuestions } from "../../src/data.js";
import { AI_SECTIONS, AI_CONTRACT_VERSION } from "../../src/ai-contract.js";
import { hasConcreteEpisode } from "../../src/ai-context.js";
export function fixtureSession(overrides = {}) {
  const config = { ...DEFAULT_CONFIG, ...overrides };
  return {
    version: VERSION,
    config,
    answers: Object.fromEntries(
      activeQuestions(config).map((q, i) => [
        q.id,
        q.type === "scenario"
          ? i % 4
          : q.type === "health" || q.type === "trauma"
            ? 0
            : q.min + (i % (q.max - q.min + 1)),
      ]),
    ),
    index: 0,
    finished: true,
    created: "2026-11-15T00:00:00.000Z",
  };
}
export function fixtureReport(prepared) {
  const evidence = prepared.evidence || prepared.packet.evidence;
  const first = evidence[0],
    second = evidence.find((e) => e.group !== first.group);
  const evidenceIds = [first.id, second.id],
    knowledgeIds = ["kb-person-situation", "kb-uncertainty"];
  const cite = { evidenceIds, knowledgeIds };
  const episodeIds = ["context:example", "context:meaning", "context:strategy"];
  const episodeReady = hasConcreteEpisode(
    Object.fromEntries(
      episodeIds.map((id) => [
        id.slice(8),
        evidence.find((e) => e.id === id)?.value,
      ]),
    ),
  );
  const disabled =
    prepared.disabledSections ||
    prepared.packet.requiredInsufficientSections ||
    [];
  return {
    schemaVersion: AI_CONTRACT_VERSION,
    overall: {
      summary:
        "模拟上游综合报告：你对关系投入的期待、面对不确定时的感受和不同情境的选择，需要放在一起理解。这里依据不同领域的自我报告形成可核实的假设，不根据某一道题定义你。它们可能在某些时候相互影响，也可能只是并存；真实处境和你提供的反例能够帮助区分。这个文本仅用于自动化测试，不是真实 DeepSeek 生成的个人结论。",
      ...cite,
    },
    perspectives: evidence.some((e) => e.id.startsWith("jung:"))
      ? [
          {
            theoryId: "jung",
            observation: "模拟：对一组原创描述的自我认同。",
            interpretation: "只描述这些信息与判断偏好，未推算类型。",
            fit: "与人格线索一起核对，但不是同一构念或独立验证。",
            limits: "原创三题不证明能力、功能栈或临床结论。",
            alternative: "近期角色和题意理解可能影响回答。",
            question: "换一种场合还会这样描述吗？",
            evidenceIds: [
              evidence.find((e) => e.id.startsWith("jung:")).id,
              first.id,
            ],
            knowledgeIds: ["kb-jung-exploration", "kb-theory-integration"],
          },
        ]
      : [],
    themes: [
      {
        title: "跨领域主题：连接与自主",
        claim:
          "模拟分析把人格与总体关系中的报告放在一起，讨论连接、独立和实际环境可能怎样并存。",
        alternatives: ["当前处境也可能影响回答，而不是稳定性格。"],
        question: "有没有一次你既表达了需要，也保留了自主选择？",
        ...cite,
      },
      {
        title: "<img src=x onerror=alert(1)> 只是文字",
        claim: "模拟第二主题用于检查网页能把模型文字作为纯文本呈现。",
        alternatives: ["题目理解不同也可能影响自我描述。"],
        question: "有没有不符合这个方向的反例？",
        ...cite,
      },
    ],
    sections: AI_SECTIONS.map(([id, title]) => ({
      id,
      status: disabled.includes(id) ? "insufficient" : "supported",
      summary: disabled.includes(id)
        ? "该领域没有提供足够或获授权的资料，不能判断。"
        : `模拟${title}的整合描述，结合不同领域，不作诊断或固定身份判断。`,
      implications: "请结合真实经历理解；这里并没有观察到所有生活场景。",
      alternative: "环境差异、最近压力和题目理解都可能提供另一种解释。",
      question: "哪一个真实例子支持它，哪个反例不支持？",
      ...(disabled.includes(id)
        ? { evidenceIds: [], knowledgeIds }
        : (() => {
            const prefix = {
              self: "trait:",
              romance: "attachment:partner:",
              friendship: "attachment:friend:",
              family: "attachment:family:",
              mental_health: "health:",
            }[id];
            const direct = prefix
              ? evidence.find((e) => e.id.startsWith(prefix))
              : first;
            const other = evidence.find((e) => e.group !== direct.group);
            return { evidenceIds: [direct.id, other.id], knowledgeIds };
          })()),
    })),
    formulations: episodeReady
      ? [
          {
            title: "模拟：一次经历的可修改解释",
            observation:
              "这是用户描述的一次事件、当时理解与行动目的，不是独立观察。",
            hypothesis: "模拟解释仅限这一次经历，还需要对照不同条件下的例外。",
            possibleFunction:
              "只把用户自述的希望结果当作目的线索，不假装了解潜意识。",
            possibleCost: "实际后果仍需继续观察。",
            counterpoints: ["一次经历不能证明长期模式。"],
            alternatives: [
              "可能主要与当时的安排有关。",
              "也可能与题目理解或近期状态有关。",
            ],
            question: "换一个真实情境，还会出现相同反应吗？",
            wouldChangeMind: "如果同一条件下稳定出现相反反应，应修订这一解释。",
            evidenceIds: [...episodeIds, first.id],
            knowledgeIds,
          },
        ]
      : [],
    cycles: episodeReady
      ? [
          {
            title: "模拟的待验证循环",
            trigger: "可能遇到回应不明确的情境。",
            meaning: "可能暂时无法确定这对关系意味着什么。",
            protection: "可能先自己整理，或寻找更多确认。",
            shortTerm: "可能获得一点控制感。",
            longTerm: "若长期重复，也可能消耗注意力。",
            alternative: "对方的实际安排和环境限制也可能影响回应。",
            check: "记录一次真实经过，核实顺序是否符合。",
            ...cite,
          },
        ]
      : [],
    contradictions: [
      {
        observation: "不同场景可能表现不同",
        explanations: [
          "不同关系提供了不同的互动条件。",
          "近期状态或题目理解也可能影响回答。",
        ],
        question: "差异出现时，环境具体有什么不同？",
        ...cite,
      },
    ],
    priorities: [
      {
        title: "记录一个真实情境",
        why: "帮助核实多领域假设是否适合现实。",
        step: "记录一次触发、你的理解和行动，不急着评价自己。",
        observe: "观察是否存在反例。",
        timeframe: "本周",
        ...cite,
      },
      {
        title: "提出一个小请求",
        why: "将模糊期待变成可协商的信息。",
        step: "只在安全、可信任的关系中提出一项明确而有限的请求。",
        observe: "观察自己和对方是否都保有选择。",
        timeframe: "下周",
        ...cite,
      },
    ],
    followUpQuestions: [
      "你在什么情况下更自在？",
      "最近的压力是否影响回答？",
      "什么反例最值得保留？",
    ],
    uncertainties: [
      "不能由此确立疾病诊断。",
      "没有得到对方或其他观察者的视角。",
      "不能确定模式的成因或童年经历。",
    ],
  };
}

export function fixtureCompletion(init) {
  const request = JSON.parse(init.body),
    user = JSON.parse(request.messages[1].content);
  return user.mode === "review"
    ? { decision: "accept", revisions: [], report: null }
    : fixtureReport({ packet: user.assessment_packet });
}

import { JUNG_FUNCTIONS } from "./jung.js";
export const VERSION = "1.0.0";
export const OPTIONS = {
  trait: ["很不符合", "不太符合", "不确定／居中", "比较符合", "非常符合"],
  attachment: [
    "非常不同意",
    "不同意",
    "有些不同意",
    "既不同意也不赞同",
    "有些赞同",
    "赞同",
    "非常赞同",
  ],
  health: ["完全没有", "有几天", "一半以上的天数", "几乎每天"],
  trauma: ["完全没有", "有一点", "中等程度", "相当多", "极其多"],
};
export const TRAITS = {
  E: {
    name: "外向性",
    low: "安静充电",
    high: "互动充电",
    color: "#78968a",
    lowText: "你更常通过独处或小范围交流恢复精力，可能偏好深入而有准备的交流。",
    highText: "你更容易从互动中获得能量，可能愿意主动发起联系、表达想法。",
    action:
      "观察一周内，哪种社交时长让你感到有活力，安排适合自己的独处和连接。",
  },
  A: {
    name: "宜人性",
    low: "直接与审慎",
    high: "体谅与合作",
    color: "#c8a36a",
    lowText:
      "你可能更重视直率、独立判断和立场清晰；留意表达方式是否让对方感到被尊重。",
    highText:
      "你可能较容易顾及他人感受、维持合作；留意自己是否也能表达不同意见。",
    action: "下一次分歧时，同时说出对对方的理解和你自己的需求。",
  },
  C: {
    name: "尽责性",
    low: "灵活与即兴",
    high: "计划与落实",
    color: "#8b91b2",
    lowText:
      "你可能偏好灵活调整，执行会较受兴趣和环境影响；外部提醒可能有帮助。",
    highText: "你可能重视计划、承诺和完成度；给休息和意外留出空间。",
    action: "把一项重要任务拆成一个可在十分钟内开始的步骤。",
  },
  S: {
    name: "情绪稳定性",
    low: "更敏锐地感受压力",
    high: "更平稳地应对压力",
    color: "#ba8c7f",
    lowText:
      "你报告较容易担忧或受压力影响。这是感受倾向，不能据此判断你有心理疾病。",
    highText:
      "你报告一般较少被担忧和情绪波动牵动；平稳也不意味着没有支持需求。",
    action: "区分“通常的我”和“最近压力下的我”，在生活更平稳时再观察。",
  },
  O: {
    name: "开放性／想象力",
    low: "熟悉与具体",
    high: "新意与抽象",
    color: "#8aa3b2",
    lowText: "你可能更偏好具体、熟悉、能落地的信息；这不代表缺乏创造力或智力。",
    highText:
      "你可能更愿意接触新想法、想象和抽象问题；这不等于能力或智商更高。",
    action: "尝试一个小的新体验，记录它是否真的让你投入，而不是追求新奇本身。",
  },
};
// IPIP Big-Five Factor Markers, 50-item sample order. Chinese is a project translation.
const ipip = [
  ["E", 0, "我是聚会中活跃气氛的人。", "Am the life of the party."],
  ["A", 1, "我很少关心他人。", "Feel little concern for others."],
  ["C", 0, "我总是做好准备。", "Am always prepared."],
  ["S", 1, "我很容易感到压力。", "Get stressed out easily."],
  ["O", 0, "我的词汇量丰富。", "Have a rich vocabulary."],
  ["E", 1, "我不怎么说话。", "Don't talk a lot."],
  ["A", 0, "我对他人感兴趣。", "Am interested in people."],
  ["C", 1, "我随手乱放东西。", "Leave my belongings around."],
  ["S", 0, "我大多数时候很放松。", "Am relaxed most of the time."],
  [
    "O",
    1,
    "我理解抽象概念有困难。",
    "Have difficulty understanding abstract ideas.",
  ],
  ["E", 0, "和他人在一起时，我感觉自在。", "Feel comfortable around people."],
  ["A", 1, "我会侮辱他人。", "Insult people."],
  ["C", 0, "我注重细节。", "Pay attention to details."],
  ["S", 1, "我常为事情担忧。", "Worry about things."],
  ["O", 0, "我的想象力生动丰富。", "Have a vivid imagination."],
  ["E", 1, "我倾向于待在不显眼的位置。", "Keep in the background."],
  ["A", 0, "我能体谅他人的感受。", "Sympathize with others’ feelings."],
  ["C", 1, "我把东西弄得一团糟。", "Make a mess of things."],
  ["S", 0, "我很少感到忧郁。", "Seldom feel blue."],
  ["O", 1, "我对抽象概念不感兴趣。", "Am not interested in abstract ideas."],
  ["E", 0, "我会主动开启交谈。", "Start conversations."],
  [
    "A",
    1,
    "我对别人的问题不感兴趣。",
    "Am not interested in other people’s problems.",
  ],
  ["C", 0, "我会马上完成日常事务。", "Get chores done right away."],
  ["S", 1, "我很容易受到困扰。", "Am easily disturbed."],
  ["O", 0, "我有很好的点子。", "Have excellent ideas."],
  ["E", 1, "我没有太多话要说。", "Have little to say."],
  ["A", 0, "我是个心软的人。", "Have a soft heart."],
  [
    "C",
    1,
    "我常忘记把东西放回原位。",
    "Often forget to put things back in their proper place.",
  ],
  ["S", 1, "我很容易心烦。", "Get upset easily."],
  ["O", 1, "我的想象力不太好。", "Do not have a good imagination."],
  [
    "E",
    0,
    "在聚会上，我会和很多不同的人交谈。",
    "Talk to a lot of different people at parties.",
  ],
  ["A", 1, "我对他人并没有真正的兴趣。", "Am not really interested in others."],
  ["C", 0, "我喜欢井然有序。", "Like order."],
  ["S", 1, "我的心情经常变化。", "Change my mood a lot."],
  ["O", 0, "我理解事物很快。", "Am quick to understand things."],
  [
    "E",
    1,
    "我不喜欢把注意力引到自己身上。",
    "Don’t like to draw attention to myself.",
  ],
  ["A", 0, "我会为他人腾出时间。", "Take time out for others."],
  ["C", 1, "我会逃避自己的责任。", "Shirk my duties."],
  ["S", 1, "我经常有情绪起伏。", "Have frequent mood swings."],
  ["O", 0, "我会使用较难的词语。", "Use difficult words."],
  [
    "E",
    0,
    "我不介意成为关注的中心。",
    "Don’t mind being the center of attention.",
  ],
  ["A", 0, "我能感受到他人的情绪。", "Feel others’ emotions."],
  ["C", 0, "我会按时间安排做事。", "Follow a schedule."],
  ["S", 1, "我很容易烦躁。", "Get irritated easily."],
  ["O", 0, "我会花时间思考和反省。", "Spend time reflecting on things."],
  ["E", 1, "在陌生人面前，我很安静。", "Am quiet around strangers."],
  ["A", 0, "我能让别人感觉轻松自在。", "Make people feel at ease."],
  ["C", 0, "我对自己的工作要求严格。", "Am exacting in my work."],
  ["S", 1, "我经常感到忧郁。", "Often feel blue."],
  ["O", 0, "我有很多想法。", "Am full of ideas."],
];
export const CUSTOM = {
  regulation: {
    name: "情绪调节",
    section: "emotion",
    source: "emotion-book",
    low: "情绪来临时，你可能较难找到能帮助自己稳定下来的方法。",
    high: "你报告自己会辨认情绪、调整看法，并为行动留出缓冲。",
    need: "需要被理解，也需要一点整理感受的时间。",
    practice:
      "下次情绪升起时，写下“发生的事—我的解释—我需要什么”，再决定是否行动。",
    items: [
      ["我能把此刻的情绪说得比“难受”更具体。", 0],
      ["遇到不顺时，我能试着从另一个角度理解。", 0],
      ["情绪很强时，我会先缓一缓再回复消息。", 0],
      ["一旦情绪上来，我很难选择自己的反应。", 1],
      ["我只会把感受憋住，却不知道怎么处理。", 1],
      ["我知道至少一种对自己有用的平复方法。", 0],
    ],
  },
  rumination: {
    name: "反复思虑",
    section: "emotion",
    source: "emotion-book",
    low: "你报告较少长时间陷在重复的负面思考里。",
    high: "你报告容易反复回想不快，却较难得到新信息或采取行动。",
    need: "需要从反复思考中休息，而非再找到一个完美答案。",
    practice:
      "给担忧留十分钟，结束时只写一个可行动的下一步；无法控制的事先放在一旁。",
    items: [
      ["我会反复回放一段令人不舒服的对话。", 0],
      ["我不停想自己做错了什么，却没有更清晰的结论。", 0],
      ["想到糟糕的可能性后，我很难把注意力拉回来。", 0],
      ["我能注意到思考已经变成了原地打转。", 1],
      ["我能在需要时暂时放下尚未解决的担忧。", 1],
      ["我会因为反复思考而耽误休息或手头的事。", 0],
    ],
  },
  compassion: {
    name: "自我关怀",
    section: "emotion",
    source: "selfcomp",
    low: "犯错或失望时，你可能对自己比对朋友更苛刻。",
    high: "你报告能在承认失误的同时，保留对自己的理解。",
    need: "需要被允许不完美，而不只是被要求做得更好。",
    practice: "把你会对一个遇到同样困难的朋友说的话，完整地写给自己。",
    items: [
      ["做错事时，我仍会用尊重的方式和自己说话。", 0],
      ["遇到挫折时，我知道别人也会有类似挣扎。", 0],
      ["我能承认难过，而不急着责备自己软弱。", 0],
      ["一犯错，我就会用很刻薄的话批评自己。", 1],
      ["我会把一次失败看成“我整个人都很差”。", 1],
      ["我愿意给疲惫的自己留出恢复的空间。", 0],
    ],
  },
  worth: {
    name: "自我价值的稳定感",
    section: "emotion",
    source: "noba-personality",
    low: "你对自己的评价可能较容易被他人的反馈带动。",
    high: "你报告自己的价值感较少完全依赖当下的赞同和表现。",
    need: "需要更稳定地肯定自己，而不只通过赢得认可来安心。",
    practice: "写下三项与你今天表现好坏无关、仍值得被尊重的需要或品质。",
    items: [
      ["即使别人不同意我，我也能保持基本的自我尊重。", 0],
      ["没有被及时回应时，我不会立刻觉得自己不值得被喜欢。", 0],
      ["我觉得只有表现很好时，自己才值得被爱。", 1],
      ["别人的一句批评会让我全盘否定自己。", 1],
      ["我能把“这件事做得不好”和“我没有价值”分开。", 0],
      ["我需要不断得到夸奖，才能相信自己是好的。", 1],
    ],
  },
  boundary: {
    name: "关系边界",
    section: "relationship",
    source: "sdt",
    low: "你可能较难拒绝请求，或较难让彼此拥有独立空间。",
    high: "你报告会表达限度，也能尊重他人的拒绝和自主选择。",
    need: "需要在保持连接的同时，保有时间、隐私与选择权。",
    practice:
      "练习一句具体表达：“我现在无法答应这件事，但我可以在周末帮你半小时。”",
    items: [
      ["即使担心对方失望，我也能表达自己的限度。", 0],
      ["我能接受亲近的人有不想告诉我的隐私。", 0],
      ["我常答应不愿意做的事，之后又感到委屈。", 1],
      ["为了确定对方在乎我，我会要求查看对方的私人信息。", 1],
      ["我能在关系里保留自己的朋友、兴趣和休息时间。", 0],
      ["当对方说“不”时，我会尽量尊重，而不是持续施压。", 0],
    ],
  },
  empathy: {
    name: "理解与倾听",
    section: "relationship",
    source: "noba-relationships",
    low: "你可能较快给建议或下判断，尚未确认对方真正的感受。",
    high: "你报告会主动理解对方、确认意思，也区分理解和认同。",
    need: "需要被认真听见，也需要了解对方真实的处境。",
    practice: "在给建议前问：“你现在更希望我听你说，还是一起想办法？”",
    items: [
      ["给建议前，我会先确认对方希望得到什么。", 0],
      ["我能尝试理解和我立场不同的人的感受。", 0],
      ["对方说难过时，我会立刻告诉对方“不至于”。", 1],
      ["我会复述听到的意思，确认自己没有误解。", 0],
      ["我常在对方说完之前，就准备反驳。", 1],
      ["我能理解对方的感受，同时保留不同意见。", 0],
    ],
  },
  repair: {
    name: "冲突与修复",
    section: "relationship",
    source: "relationship-book",
    low: "发生分歧后，你可能较难把感受和请求说清楚，或重新建立联系。",
    high: "你报告会为具体行为负责、给暂停设定返回时间，并讨论后续改变。",
    need: "需要可预期的沟通和具体的修复，而不只是压下分歧。",
    practice: "把“你总是……”改成：“刚才发生了……，我感到……，下次我希望我们……”",
    items: [
      ["争执时，我能围绕具体事件表达，而不是攻击人格。", 0],
      ["需要冷静时，我会说明何时回来继续谈。", 0],
      ["道歉时，我会说清楚自己做了什么和准备怎么改。", 0],
      ["我会用长时间不回应来让对方着急或让步。", 1],
      ["冲突时，我很难承认自己可能也有责任。", 1],
      ["一次争执后，我愿意主动讨论双方可以怎样调整。", 0],
    ],
  },
  support: {
    name: "求助与互惠",
    section: "relationship",
    source: "sdt",
    low: "你可能习惯独自承受，或让付出和接受支持长期失去平衡。",
    high: "你报告能具体求助、接纳帮助，也会与对方协商支持的限度。",
    need: "需要不必靠独自撑住或不断付出来维持的连接。",
    practice:
      "向一个可信任的人提出一个小而明确的请求，并允许对方选择是否答应。",
    items: [
      ["需要帮助时，我能提出具体的请求。", 0],
      ["别人帮助我时，我能接受，而不总觉得自己欠了债。", 0],
      ["我觉得只有一直付出，关系才不会消失。", 1],
      ["即使已经承受不住，我也不愿让任何人知道。", 1],
      ["我会和亲近的人商量彼此能提供多少支持。", 0],
      ["我能在关心别人和照顾自己之间调整投入。", 0],
    ],
  },
};
const rsItems = [
  [
    "在需要帮助时，向{target}求助对我有帮助。",
    "It helps to turn to this person in times of need.",
  ],
  [
    "我通常会和{target}讨论我的问题和担忧。",
    "I usually discuss my problems and concerns with this person.",
  ],
  ["我会和{target}一起商量事情。", "I talk things over with this person."],
  ["我觉得依靠{target}是容易的。", "I find it easy to depend on this person."],
  [
    "向{target}敞开心扉让我不自在。",
    "I don’t feel comfortable opening up to this person.",
  ],
  [
    "我宁愿不让{target}知道我内心深处的感受。",
    "I prefer not to show this person how I feel deep down.",
  ],
  [
    "我常担心{target}并不真正在乎我。",
    "I often worry that this person doesn’t really care for me.",
  ],
  ["我害怕{target}会抛下我。", "I’m afraid that this person may abandon me."],
  [
    "我担心{target}在乎我，不像我在乎对方那样多。",
    "I worry that this person won’t care about me as much as I care about him or her.",
  ],
];
const globalEnglish = [
  "It helps to turn to people in times of need.",
  "I usually discuss my problems and concerns with others.",
  "I talk things over with people.",
  "I find it easy to depend on others.",
  "I don’t feel comfortable opening up to others.",
  "I prefer not to show others how I feel deep down.",
  "I often worry that other people do not really care for me.",
  "I’m afraid that other people may abandon me.",
  "I worry that others won’t care about me as much as I care about them.",
];
export const CONTEXTS = {
  general: "重要的他人",
  partner: "恋人",
  friend: "最亲近的朋友",
  family: "一位主要照顾者",
};
export const SCENARIOS = [
  {
    text: "恋人比平时晚了很久才回复消息，你最可能先做什么？",
    options: [
      "反复发消息，直到确认对方还在乎我",
      "猜想自己不重要，先冷下来不理对方",
      "暂时做自己的事，之后再确认彼此的安排",
      "直接说明我很担心，希望商量回复的预期",
    ],
    patterns: ["寻找确认", "先行撤退", "保留不确定性", "直接协商"],
    reflect:
      "延迟回复有许多解释。观察自己的第一反应，再核实事实；确认对方的时间和你的需求都能被表达。",
  },
  {
    text: "朋友临时取消约定，最近已经发生两次，你最可能怎样回应？",
    options: [
      "说没关系，心里不舒服但不再提起",
      "觉得对方不珍惜我，逐渐减少联系",
      "询问原因，并说清这对我的影响",
      "担心关系变差，马上再约一个完全迁就对方的时间",
    ],
    patterns: ["压下失望", "降低投入", "表达影响", "优先维系"],
    reflect: "你的失望可以被认真对待。了解背景后，讨论一个双方能兑现的约定。",
  },
  {
    text: "家人希望替你决定一项重要选择，而你有不同想法，你更可能？",
    options: [
      "先服从，避免让他们失望",
      "立刻切断对话，不想再解释",
      "说明自己的决定，愿意听建议但保留选择权",
      "一再说服他们，只有得到同意才放心",
    ],
    patterns: ["迁就期待", "退出对话", "表达自主", "寻求认可"],
    reflect:
      "表达自主并不要求赢得所有人的赞同。现实中的安全、经济依赖和家庭背景也会影响选择。",
  },
  {
    text: "争执越来越激烈，而你已难以冷静思考，你更可能？",
    options: [
      "继续争论，直到对方承认我有道理",
      "离开或关掉消息，不说明什么时候回来",
      "说明需要暂停，约好晚些时候继续谈",
      "马上道歉结束争执，即使还没弄清问题",
    ],
    patterns: ["争取结论", "无约定撤离", "有约定暂停", "尽快平息"],
    reflect:
      "暂停是否有帮助，与是否说明原因、是否按约回来有关；暴力或胁迫情境应优先保障安全。",
  },
  {
    text: "亲近的人告诉你一个坏消息，你通常先？",
    options: [
      "帮对方想出一整套解决方案",
      "认真听，询问对方希望我怎样陪伴",
      "讲自己的类似经历，想让对方不孤单",
      "有些不知所措，于是转移话题",
    ],
    patterns: ["解决问题", "确认需要", "分享经历", "避开不适"],
    reflect: "不同的人需要不同支持。先询问，再决定是倾听、陪伴还是解决问题。",
  },
  {
    text: "你很疲惫，但朋友又提出一个会占用整个周末的请求，你更可能？",
    options: [
      "答应下来，觉得拒绝就是不够朋友",
      "不解释就不再回复",
      "说明自己的状态，给出做得到的帮助",
      "答应后再找借口取消",
    ],
    patterns: ["承担过量", "回避回应", "协商限度", "延后拒绝"],
    reflect: "边界可以具体而温和。明确能做多少，比勉强答应更有利于双方安排。",
  },
  {
    text: "你发现自己在一段关系中犯了错，你最可能？",
    options: [
      "解释自己的出发点，希望对方别再难过",
      "先责备自己很差，之后不知道怎么办",
      "承认具体影响，询问修复并采取行动",
      "等时间过去，担心提起会让事情更糟",
    ],
    patterns: ["解释动机", "自我责备", "承担与修复", "等待淡化"],
    reflect:
      "动机和影响可以同时存在。修复需要具体行为，也需要尊重对方决定是否接受。",
  },
  {
    text: "一段重要关系结束后，哪种反应更接近你？",
    options: [
      "不断回想每个细节，希望找到唯一原因",
      "尽快让自己什么也感觉不到",
      "允许失落，找支持，再慢慢恢复日常",
      "马上证明自己值得被爱，急着进入下一段关系",
    ],
    patterns: ["反复追问", "压下感受", "容纳与恢复", "寻找价值确认"],
    reflect:
      "失落的节奏因人而异。留意睡眠、饮食和日常功能；持续受影响时可以寻求支持。",
  },
];
const phq = [
  ["做事时提不起劲或没有兴趣。", "Little interest or pleasure in doing things"],
  ["感到心情低落、沮丧或绝望。", "Feeling down, depressed, or hopeless"],
  [
    "入睡困难、睡不安稳，或睡眠过多。",
    "Trouble falling or staying asleep, or sleeping too much",
  ],
  ["感觉疲倦或没有活力。", "Feeling tired or having little energy"],
  ["食欲不振或吃得太多。", "Poor appetite or overeating"],
  [
    "觉得自己很糟、很失败，或让自己或家人失望。",
    "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
  ],
  [
    "对事物专注有困难，例如阅读报纸或看电视。",
    "Trouble concentrating on things, such as reading the newspaper or watching television",
  ],
  [
    "行动或说话慢到别人可以察觉；或相反，烦躁、坐立不安，活动比平时多。",
    "Moving or speaking so slowly that other people could have noticed. Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual",
  ],
  [
    "有不如死掉或用某种方式伤害自己的念头。",
    "Thoughts that you would be better off dead, or of hurting yourself in some way",
  ],
];
const gad = [
  ["感觉紧张、焦虑或急切。", "Feeling nervous, anxious, or on edge"],
  ["不能停止或控制担忧。", "Not being able to stop or control worrying"],
  ["对各种各样的事情担忧过多。", "Worrying too much about different things"],
  ["很难放松下来。", "Trouble relaxing"],
  ["由于不安而难以静坐。", "Being so restless that it is hard to sit still"],
  ["变得容易烦恼或易怒。", "Becoming easily annoyed or irritable"],
  [
    "感到害怕，好像会有可怕的事情发生。",
    "Feeling afraid, as if something awful might happen",
  ],
];
const pcl = [
  [
    "反复出现不由自主、令人不安的事件记忆。",
    "Repeated, disturbing, and unwanted memories of the stressful experience?",
  ],
  [
    "反复做与该事件有关、令人不安的梦。",
    "Repeated, disturbing dreams of the stressful experience?",
  ],
  [
    "突然感觉或行动得好像事件又在发生，仿佛回到当时。",
    "Suddenly feeling or acting as if the stressful experience were actually happening again (as if you were actually back there reliving it)?",
  ],
  [
    "被某事提醒起事件时，感到非常难受。",
    "Feeling very upset when something reminded you of the stressful experience?",
  ],
  [
    "被某事提醒起事件时，有强烈身体反应，例如心跳加快、呼吸困难或出汗。",
    "Having strong physical reactions when something reminded you of the stressful experience (for example, heart pounding, trouble breathing, sweating)?",
  ],
  [
    "回避与该事件有关的记忆、想法或感受。",
    "Avoiding memories, thoughts, or feelings related to the stressful experience?",
  ],
  [
    "回避提醒起该事件的外部事物，例如人、地方、交谈、活动、物品或情境。",
    "Avoiding external reminders of the stressful experience (for example, people, places, conversations, activities, objects, or situations)?",
  ],
  [
    "难以记住事件中的重要部分。",
    "Trouble remembering important parts of the stressful experience?",
  ],
  [
    "对自己、他人或世界有强烈的负面看法，例如自己很差、无人可信或世界很危险。",
    "Having strong negative beliefs about yourself, other people, or the world (for example, having thoughts such as: I am bad, there is something seriously wrong with me, no one can be trusted, the world is completely dangerous)?",
  ],
  [
    "责怪自己或别人造成了事件，或造成事件之后发生的事。",
    "Blaming yourself or someone else for the stressful experience or what happened after it?",
  ],
  [
    "有强烈负面感受，例如恐惧、惊恐、愤怒、内疚或羞耻。",
    "Having strong negative feelings such as fear, horror, anger, guilt, or shame?",
  ],
  [
    "对过去喜欢的活动失去兴趣。",
    "Loss of interest in activities that you used to enjoy?",
  ],
  ["觉得与他人疏远或隔绝。", "Feeling distant or cut off from other people?"],
  [
    "难以体验积极感受，例如无法感到快乐，或无法对亲近的人产生爱的感觉。",
    "Trouble experiencing positive feelings (for example, being unable to feel happiness or have loving feelings for people close to you)?",
  ],
  [
    "有易怒、愤怒爆发或攻击行为。",
    "Irritable behavior, angry outbursts, or acting aggressively?",
  ],
  [
    "冒太大的风险，或做可能伤害自己的事。",
    "Taking too many risks or doing things that could cause you harm?",
  ],
  ["高度警觉、防备或戒备。", "Being “superalert” or watchful or on guard?"],
  ["感到神经紧绷或容易受惊。", "Feeling jumpy or easily startled?"],
  ["难以集中注意。", "Having difficulty concentrating?"],
  ["难以入睡或维持睡眠。", "Trouble falling or staying asleep?"],
];
export const MODULES = [
  {
    id: "personality",
    name: "人格的底色",
    short: "人格",
    icon: "fingerprint",
    description: "五个连续维度，理解你通常如何感受与行动。",
    source: "IPIP-50 · 中文项目译文",
    period: "请描述通常的自己，以近半年总体表现为参考，不必只考虑今天。",
    type: "trait",
    count: 50,
  },
  ...Object.entries(CONTEXTS).map(([id, target]) => ({
    id,
    name: {
      general: "亲密关系中的你",
      partner: "你与恋人",
      friend: "你与朋友",
      family: "你与家庭",
    }[id],
    short: {
      general: "总体依恋",
      partner: "恋人",
      friend: "朋友",
      family: "家庭",
    }[id],
    icon: "heart",
    description: `分别观察你面对${target}时的亲近、信任与担忧。`,
    source: "ECR-RS · 中文项目译文" + (id === "family" ? "／对象改编" : ""),
    period:
      id === "general"
        ? "请想一想你与重要他人的亲密关系总体情况。"
        : id === "family"
          ? "选定一位主要照顾者，所有题都围绕同一个人作答；不需要填写姓名。这不是整个家庭的评估。"
          : `围绕你当前真实生活中的${target}作答。没有合适对象时，可在设置中关闭本章；不需要靠想象补齐。`,
    type: "attachment",
    count: 9,
  })),
  {
    id: "emotion",
    name: "你与自己的相处",
    short: "情绪",
    icon: "sun",
    description: "情绪调节、反复思虑、自我关怀与自我价值。",
    source: "原创探索题 · 未经量表验证",
    period: "以最近一个月真实发生的情况为参考；这里探索体验，不作临床判断。",
    type: "trait",
    count: 24,
  },
  {
    id: "relationship",
    name: "你如何经营关系",
    short: "关系能力",
    icon: "link",
    description: "边界、倾听、冲突修复与求助的日常模式。",
    source: "原创探索题 · 未经量表验证",
    period: "以最近一个月的实际相处为参考；考虑相处环境是否安全、平等。",
    type: "trait",
    count: 24,
  },
  {
    id: "scenario",
    name: "关系里的关键时刻",
    short: "情境",
    icon: "sparkles",
    description: "八个日常情境，把抽象倾向放回具体生活。",
    source: "原创情境题 · 不计临床或人格分数",
    period:
      "选择最接近你的第一反应的一项；没有“正确人格”，情境和安全条件会影响选择。",
    type: "scenario",
    count: 8,
  },
  {
    id: "jung",
    name: "荣格八维探索",
    short: "荣格八维",
    icon: "sparkles",
    description: "从关注信息与判断依据理解自己，与大五和关系资料一起核实。",
    source: "24道原创题 · 理论启发／未经验证",
    period:
      "以近半年通常的自己作答；不同场合可以不同。这里问倾向，不测能力，也不要求选出一种类型。",
    type: "trait",
    count: 24,
  },
  {
    id: "phq",
    name: "最近的情绪状态",
    short: "抑郁筛查",
    icon: "cloud",
    description: "PHQ-9：近两周抑郁相关症状的自我报告。",
    source: "PHQ-9 · 中文项目译文／仅供筛查参考",
    period: "在过去两周内，你有多少天受到以下问题的困扰？",
    type: "health",
    count: 9,
    sensitive: true,
  },
  {
    id: "gad",
    name: "最近的担忧与焦虑",
    short: "焦虑筛查",
    icon: "waves",
    description: "GAD-7：近两周焦虑相关症状的自我报告。",
    source: "GAD-7 · 中文项目译文／仅供筛查参考",
    period: "在过去两周内，你有多少天受到以下问题的困扰？",
    type: "health",
    count: 7,
    sensitive: true,
  },
  {
    id: "pcl",
    name: "创伤后的相关体验",
    short: "创伤体验",
    icon: "leaf",
    description: "PCL-5：可选，需围绕同一件严重威胁性事件。",
    source: "PCL-5 · 中文项目译文／不提供诊断阈值",
    period:
      "仅在你愿意且认为适合时作答。围绕同一件涉及实际或威胁性死亡、严重伤害或性暴力的事件，回顾过去一个月受到以下问题困扰的程度。不需要描述事件。若只是普通关系挫折，建议关闭本章。随时可跳过或退出。",
    type: "trauma",
    count: 20,
    sensitive: true,
  },
];
export const QUESTIONS = [
  ...ipip.map(([dimension, reverse, text, en], i) => ({
    id: `ipip-${i + 1}`,
    module: "personality",
    dimension,
    reverse: !!reverse,
    text,
    en,
    type: "trait",
    min: 1,
    max: 5,
    source: "ipip-key",
  })),
  ...Object.entries(CONTEXTS).flatMap(([module, target]) =>
    rsItems.map(([text, en], i) => ({
      id: `${module}-${i + 1}`,
      module,
      dimension: i < 6 ? "avoidance" : "anxiety",
      reverse: i < 4,
      text: text.replaceAll("{target}", target),
      en: module === "general" ? globalEnglish[i] : en,
      type: "attachment",
      min: 1,
      max: 7,
      source: "ecrrs",
    })),
  ),
  ...Object.entries(CUSTOM).flatMap(([dimension, d]) =>
    d.items.map(([text, reverse], i) => ({
      id: `${dimension}-${i + 1}`,
      module: d.section,
      dimension,
      reverse: !!reverse,
      text,
      type: "trait",
      min: 1,
      max: 5,
      source: d.source,
    })),
  ),
  ...SCENARIOS.map((s, i) => ({
    id: `scenario-${i + 1}`,
    module: "scenario",
    dimension: "scenario",
    text: s.text,
    type: "scenario",
    min: 0,
    max: 3,
    options: s.options,
    source: "original",
  })),
  ...Object.entries(JUNG_FUNCTIONS).flatMap(([dimension, d]) =>
    d.items.map(([text, reverse], i) => ({
      id: `jung-${dimension}-${i + 1}`,
      module: "jung",
      dimension,
      text,
      reverse: !!reverse,
      type: "trait",
      min: 1,
      max: 5,
      source: "jung-iaap",
    })),
  ),
  ...phq.map(([text, en], i) => ({
    id: `phq-${i + 1}`,
    module: "phq",
    dimension: "phq",
    text,
    en,
    type: "health",
    min: 0,
    max: 3,
    source: "phq-paper",
  })),
  ...gad.map(([text, en], i) => ({
    id: `gad-${i + 1}`,
    module: "gad",
    dimension: "gad",
    text,
    en,
    type: "health",
    min: 0,
    max: 3,
    source: "gad-paper",
  })),
  ...pcl.map(([text, en], i) => ({
    id: `pcl-${i + 1}`,
    module: "pcl",
    dimension: "pcl",
    text,
    en,
    type: "trauma",
    min: 0,
    max: 4,
    source: "pcl",
  })),
];
export const DEFAULT_CONFIG = {
  jung: true,
  partner: true,
  friend: true,
  family: true,
  health: false,
  trauma: false,
  remember: false,
};
export function activeQuestions(config) {
  return QUESTIONS.filter(
    (q) =>
      !(q.module === "partner" && !config.partner) &&
      !(q.module === "friend" && !config.friend) &&
      !(q.module === "family" && !config.family) &&
      !(q.module === "jung" && !config.jung) &&
      !(["phq", "gad"].includes(q.module) && !config.health) &&
      !(q.module === "pcl" && !config.trauma),
  );
}

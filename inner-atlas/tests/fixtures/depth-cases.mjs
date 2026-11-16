import { personaCase } from "./persona-lin.mjs";
export function depthCases() {
  const base = personaCase().request;
  const blind = structuredClone(base);
  const episode = structuredClone(base);
  episode.context = {
    goal: "区分我平常对恋人的担忧与这一次连发消息的实际原因。",
    recent: "旅行当天交通延误，酒店前台说晚于十点需要另外确认入住。",
    history:
      "过去一年恋爱中偶尔会担忧，但不是每次联系不上都担心关系。没有提供童年经历。",
    impact: "这次只是一段临时焦急，没有持续影响睡眠或工作。",
    example:
      "恋人去取行李没看手机。我发了三条消息，分别是酒店的入住时限、备用交通方案、请他确认是否看到。后来他回了，我们确定到店时间，事情解决。",
    meaning:
      "当时我担心的是赶不上入住，不是怕他不爱我；我知道他在取行李，手机也快没电。",
    strategy:
      "我想让他拿到最新安排并共同确认时间。得到确认后我放心了，之后没有继续追问或担心关系。",
    counterexample:
      "行程已说清时，即使恋人几个小时没回复，我也能安心；遇到类似的时间问题，我对朋友也会分几条发安排。",
  };
  return [
    {
      id: "depth-patterns",
      label: "相同虚拟人，只有答卷：应保留模式，不生成机制卡与循环",
      request: blind,
    },
    {
      id: "depth-episode",
      label: "相同回答，连发消息的自述目的为行程协调：不能强行解释为害怕被抛弃",
      request: episode,
    },
  ];
}

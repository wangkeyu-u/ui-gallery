import {
  persona as originalPersona,
  personaCase as originalCase,
} from "./persona-zhou.mjs";
import { QUESTIONS } from "../../src/data.js";
export const persona = {
  ...originalPersona,
  id: "persona-zhou-jung",
  addedBeforeCall:
    "同一虚构人补充原创八维：较愿探索几个方案和现场线索，讨论时偏好明确可执行安排，其他偏好允许居中；不设定四字母类型或功能栈。",
  testPurpose:
    "检查新增资料和新提示词能否形成整体画像；不是独立样本或人格准确率。",
};
const raw = {
  Se: [4, 4, 2],
  Si: [3, 3, 3],
  Ne: [5, 4, 2],
  Ni: [3, 3, 3],
  Te: [4, 4, 2],
  Ti: [3, 3, 3],
  Fe: [3, 4, 3],
  Fi: [4, 4, 2],
};
export function personaCase() {
  const c = structuredClone(originalCase());
  c.id = persona.id;
  c.request.session.config.jung = true;
  for (const q of QUESTIONS.filter((q) => q.module === "jung")) {
    const value = raw[q.dimension][Number(q.id.split("-")[2]) - 1];
    if (!Number.isInteger(value) || value < q.min || value > q.max)
      throw Error("Invalid response " + q.id);
    c.request.session.answers[q.id] = value;
  }
  c.request.context.goal = "希望整合判断我更像怎样的人，理解不同关系里的自己。";
  return c;
}

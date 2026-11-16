import {
  CHAT_LIMITS,
  chatEndpoint,
  validateChatReply,
} from "./chat-contract.js";
import { analysisEndpoint } from "./ai-service.js";
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let hooks,
  installed = false,
  owner = null,
  epoch = 0;
const fresh = () => ({
  messages: [],
  draft: "",
  busy: false,
  error: "",
  open: false,
  pending: "",
  controller: null,
});
let state = fresh();
export function clearChat() {
  state.controller?.abort();
  epoch++;
  state = fresh();
  owner = null;
}
const full = () =>
  state.messages.length >= CHAT_LIMITS.turns * 2 ||
  state.messages.reduce((n, m) => n + m.content.length, 0) >
    CHAT_LIMITS.historyCharacters;
export function renderChat(result, stale) {
  const key = result.requestId || result.generatedAt + result.inputHash;
  if (owner !== key) {
    clearChat();
    owner = key;
  }
  return `<details id="ai-chat" class="panel ai-chat-panel" ${state.open ? "open" : ""}><summary><h3>带着这份测试，继续问 AI</h3></summary><p>会参考本次已授权的答卷、背景、综合报告和本页对话。你可以纠正报告或补充经历，AI会据此修订理解。</p><p class="caption">继续发送即同意把这些资料及问题交给本站分析服务和DeepSeek处理。对话仅保留在本页，刷新后消失，可先下载；最多12轮，清空对话会保留测试记忆。</p><p class="notice ai-chat-stale" ${stale ? "" : "hidden"}>答卷或背景已变化，请重新生成报告后追问。</p><div class="ai-chat-messages" aria-live="polite">${state.messages.map((m) => `<article class="ai-chat-message ${m.role}"><strong>${m.role === "user" ? "你" : "AI"}</strong><div class="ai-chat-text">${esc(m.content)}</div>${m.refs?.length ? `<details class="ai-chat-references"><summary>这次回答参考了什么</summary><p>${m.refs.map(esc).join(" · ")}</p></details>` : ""}</article>`).join("")}${state.busy ? `<article class="ai-chat-message user"><strong>你</strong><div class="ai-chat-text">${esc(state.pending)}</div></article><p role="status">正在结合本次测试回答…</p>` : ""}</div><div class="ai-chat-suggestions">${["这份画像最重要的矛盾是什么？", "为什么我在恋人和朋友面前不同？", "有一点不符合我，怎么重新理解？"].map((q) => `<button type="button" class="text-button" data-chat-action="suggest" data-question="${q}">${q}</button>`).join("")}</div>${state.error ? `<p class="ai-error" role="alert">${esc(state.error)}</p>` : ""}${full() ? '<p class="notice">本段对话已较长，可先下载，再清空对话继续；答卷和报告会保留。</p>' : ""}<form id="ai-chat-form"><label class="ai-field">继续问 AI<textarea name="question" rows="3" maxlength="1500" placeholder="例如：这份画像里，你怎样理解我在亲密关系里的矛盾？" ${state.busy ? "disabled" : ""}>${esc(state.draft)}</textarea></label><div class="ai-submit-row"><button class="button primary" type="submit" ${stale || state.busy || full() || !state.draft.trim() ? "disabled" : ""}>${state.busy ? "正在回答…" : "发送追问"}</button>${state.busy ? '<button type="button" class="button ghost" data-chat-action="cancel">取消等待</button>' : ""}<button type="button" class="text-button" data-chat-action="download" ${state.messages.length ? "" : "disabled"}>下载追问记录</button><button type="button" class="text-button" data-chat-action="clear" ${state.busy ? "disabled" : ""}>清空对话，保留测试记忆</button></div></form></details>`;
}
export function syncChatUI() {
  if (!hooks) return;
  const m = hooks.getMemory();
  const stale = !m.result || m.stale;
  const note = document.querySelector(".ai-chat-stale");
  if (note) note.hidden = !stale;
  const button = document.querySelector("#ai-chat-form button[type=submit]");
  if (button)
    button.disabled = stale || state.busy || full() || !state.draft.trim();
  if (stale && state.busy) {
    state.controller?.abort();
    epoch++;
    state.busy = false;
    state.pending = "";
    state.error = "资料已变化，未采用旧答复。";
    const panel = document.getElementById("ai-chat");
    if (panel && m.result) panel.outerHTML = renderChat(m.result, true);
  }
}
function show() {
  state.open = true;
  const el = document.getElementById("ai-chat");
  if (el) {
    el.open = true;
    el.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
    el.querySelector("textarea")?.focus();
  }
}
export function configureChat(config) {
  hooks = config;
  if (installed) return;
  installed = true;
  document.addEventListener("input", (e) => {
    if (e.target.closest("#ai-chat-form") && e.target.name === "question") {
      state.draft = e.target.value;
      syncChatUI();
    }
  });
  document.addEventListener(
    "toggle",
    (e) => {
      if (e.target.id === "ai-chat") state.open = e.target.open;
    },
    true,
  );
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-chat-action]");
    if (!b) return;
    const a = b.dataset.chatAction;
    if (a === "open") show();
    if (a === "suggest") {
      state.draft = b.dataset.question;
      state.open = true;
      hooks.render();
      show();
    }
    if (a === "cancel") {
      state.controller?.abort();
      epoch++;
      state.busy = false;
      state.pending = "";
      state.error = "已取消等待；本次没有加入对话。";
      hooks.render();
    }
    if (a === "clear") {
      clearChat();
      state.open = true;
      hooks.render();
      show();
    }
    if (a === "download") {
      const m = hooks.getMemory();
      const text = [
        "# 见己 · 测试后的追问记录",
        m.result?.report?.overall?.portrait?.headline || "本次测试",
        ...state.messages.map(
          (x) => `## ${x.role === "user" ? "你" : "AI"}\n\n${x.content}`,
        ),
        "AI的解释可被纠正，不是诊断。",
      ].join("\n\n");
      const url = URL.createObjectURL(
        new Blob([text], { type: "text/markdown;charset=utf-8" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "见己-追问记录.md";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  });
  document.addEventListener("submit", async (e) => {
    if (e.target.id !== "ai-chat-form") return;
    e.preventDefault();
    const memory = hooks.getMemory();
    if (state.busy || full() || !state.draft.trim()) return;
    if (!memory.result || memory.stale) {
      state.error = "请根据当前答卷重新生成报告后追问。";
      hooks.render();
      return;
    }
    const question = state.draft.trim();
    if (question.length > CHAT_LIMITS.question) return;
    const id = ++epoch,
      resultId = memory.result.requestId;
    state.busy = true;
    state.open = true;
    state.pending = question;
    state.error = "";
    state.controller = new AbortController();
    const controller = state.controller;
    const body = {
      assessment: memory.assessment,
      report: memory.result.report,
      inputHash: memory.result.inputHash,
      history: state.messages.map(({ role, content }) => ({ role, content })),
      question,
    };
    hooks.render();
    try {
      const endpoint = chatEndpoint(
        analysisEndpoint(memory.endpoint, location.href),
      );
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Analysis-Keepalive": "1",
          ...(memory.code ? { Authorization: "Bearer " + memory.code } : {}),
        },
        body: JSON.stringify(body),
        signal: AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(195000),
        ]),
        cache: "no-store",
        credentials: "omit",
        referrerPolicy: "no-referrer",
      });
      let data;
      try {
        data = await response.json();
      } catch {
        throw Error("追问服务没有正确返回JSON，请检查后端连接。");
      }
      if (!response.ok || data.code)
        throw Error(data.message || "这次追问未成功，请稍后重试。");
      const current = hooks.getMemory();
      if (id !== epoch) return;
      if (
        current.stale ||
        current.result?.requestId !== resultId ||
        data.inputHash !== memory.result.inputHash
      )
        throw Error("答卷、背景或报告已变化，这次答复已丢弃。");
      const reply = validateChatReply(
        data,
        memory.result.evidence,
        memory.result.knowledge,
      );
      const refs = [
        ...(data.evidence || []).map((e) => e.label),
        ...(data.knowledge || []).map((k) => k.title),
      ];
      state.messages.push(
        { role: "user", content: question },
        { role: "assistant", content: reply.answer, refs },
      );
      state.draft = "";
    } catch (error) {
      if (id === epoch)
        state.error = ["AbortError", "TimeoutError"].includes(error.name)
          ? "等待已取消或超时，本次未加入对话；可稍后重试。"
          : error.message;
    } finally {
      if (id === epoch) {
        state.busy = false;
        state.pending = "";
        state.controller = null;
        hooks.render();
      }
    }
  });
}

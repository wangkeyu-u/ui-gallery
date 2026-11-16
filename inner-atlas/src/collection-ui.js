import { newCollection } from "./collection-contract.js";
import { requestDeadline } from "./request-deadline.js";
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let hooks,
  enabled = false,
  timer,
  busy = false,
  latest = null,
  controller = null,
  fingerprint = "",
  message = "",
  failed = false;
const api = (path) => "/api" + path;
export function collectionSetupMarkup() {
  return `<section class="collection-setup" ${enabled ? "" : "hidden"}><h3>保存给创建者查看（可选）</h3><label class="ai-field">给创建者看的称呼<input name="participantLabel" maxlength="40" placeholder="可留空，匿名提交"></label><label class="ai-check"><input type="checkbox" name="collect"><span>我同意把本次已选章节的作答、补充背景和总结提交给网站创建者保存、查看。<small>包括你主动开启并作答的健康题；不包含续聊内容。勾选后答题进度和新总结会自动保存；不勾选也可正常使用。想在刷新后自行撤回，请同时开启本机保存。</small></span></label></section>`;
}
export function collectionStatusMarkup({ allowNew = true } = {}) {
  const s = hooks?.getSession();
  if (!s || (!enabled && !s.collection)) return "";
  if (!s.collection)
    return allowNew
      ? `<details class="panel collection-status"><summary>将这次答卷与报告提交给创建者（可选）</summary><p>创建者可集中查看作答、你提供的背景及总结，包括主动开启的健康题。不包含续聊内容。</p><label class="ai-field">给创建者看的称呼<input id="collection-label" maxlength="40" placeholder="可留空匿名"></label><label class="ai-check"><input id="collection-consent" type="checkbox"><span>我同意上述保存与查看用途。</span></label><button type="button" class="button ghost" data-collection-action="enable">同意并保存</button></details>`
      : "";
  return `<section class="collection-status panel"><div><span class="eyebrow">已选择提交给创建者</span><strong class="collection-message" role="status">${esc(message || "准备保存本次作答与报告")}</strong><p class="caption">保存称呼：${esc(s.collection.label || "匿名参与者")}。请看到“已保存”后再关闭。清除本机数据前，你可以先撤回服务器记录。</p></div><button type="button" class="button ghost small" data-collection-action="save" ${busy ? "disabled" : ""}>${failed ? "重试保存" : "立即保存"}</button><button type="button" class="text-button" data-collection-action="revoke">停止共享并撤回记录</button></section>`;
}
function status(text, error = false) {
  message = text;
  failed = error;
  document
    .querySelectorAll(".collection-message")
    .forEach((el) => (el.textContent = text));
  document.querySelectorAll("[data-collection-action=save]").forEach((el) => {
    el.disabled = busy;
    el.textContent = error ? "重试保存" : "立即保存";
  });
}
export function scheduleSubmission(immediate = false) {
  const s = hooks?.getSession();
  if (
    !enabled ||
    !s?.collection ||
    (s.collection.revision === 1 &&
      !Object.values(s.answers).some(Number.isInteger))
  )
    return;
  const result = hooks.getAnalysis?.();
  const analysis = result?.result.archiveProof ? result : null;
  const identity = JSON.stringify({
    answers: s.answers,
    config: s.config,
    finished: s.finished,
    analysis: analysis?.result?.requestId,
    label: s.collection.label,
  });
  if (identity === fingerprint) {
    if (immediate && latest) flush();
    return;
  }
  fingerprint = identity;
  s.collection.revision++;
  latest = {
    collection: { ...s.collection },
    session: {
      version: s.version,
      config: { ...s.config },
      answers: { ...s.answers },
      finished: s.finished,
      created: s.created,
    },
    analysis,
  };
  status("尚未保存：正在准备提交");
  clearTimeout(timer);
  if (immediate) flush();
  else timer = setTimeout(flush, 1000);
}
async function flush() {
  if (busy || !latest || !hooks.getSession()?.collection) return;
  const payload = latest,
    revision = payload.collection.revision;
  busy = true;
  status("正在保存…");
  controller = new AbortController();
  const deadline = requestDeadline(20000, controller.signal);
  try {
    const r = await fetch(api("/submissions"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: deadline.signal,
      cache: "no-store",
      credentials: "omit",
    });
    const data = await r.json();
    if (!r.ok || data.code) throw Error(data.message || "保存未成功");
    if (hooks.getSession()?.collection?.id !== payload.collection.id) return;
    if (latest?.collection.revision === revision) {
      latest = null;
      status(
        (hooks.getAnalysis?.() &&
        !payload.analysis &&
        data.status !== "reported"
          ? "答卷已保存 · AI 报告需在本站生成后才能归档 · "
          : data.status === "reported"
            ? "答卷与报告已保存 · "
            : "答卷已保存 · ") +
          new Date(data.savedAt).toLocaleTimeString("zh-CN", {
            timeZone: "Asia/Shanghai",
          }),
      );
    } else status("正在保存最新修改…");
  } catch (e) {
    if (!controller.signal.aborted)
      status("尚未保存：" + (e.message || "网络暂不可用"), true);
  } finally {
    deadline.clear();
    busy = false;
    controller = null;
    document
      .querySelectorAll("[data-collection-action=save]")
      .forEach((el) => (el.disabled = false));
    if (latest && latest.collection.revision > revision) flush();
  }
}
export function resetCollectionClient() {
  clearTimeout(timer);
  controller?.abort();
  latest = null;
  fingerprint = "";
  message = "";
  failed = false;
}
export function configureCollection(config) {
  hooks = config;
  const deadline = requestDeadline(8000);
  fetch(api("/submissions/status"), {
    cache: "no-store",
    credentials: "omit",
    signal: deadline.signal,
  })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      enabled = data?.enabled === true;
      if (enabled) {
        document
          .querySelectorAll(".collection-setup")
          .forEach((el) => (el.hidden = false));
        document.querySelectorAll("[data-collection-slot]").forEach(
          (el) =>
            (el.innerHTML = collectionStatusMarkup({
              allowNew: el.dataset.collectionSlot !== "active-only",
            })),
        );
        scheduleSubmission();
      }
    })
    .catch(() => {})
    .finally(deadline.clear);
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-collection-action]");
    if (!b) return;
    const action = b.dataset.collectionAction,
      s = hooks.getSession();
    if (!s) return;
    if (action === "enable" && enabled && !s.collection) {
      if (!document.getElementById("collection-consent")?.checked) {
        hooks.toast("请先确认同意提交给创建者。");
        return;
      }
      s.collection = newCollection(
        document.getElementById("collection-label")?.value || "",
      );
      resetCollectionClient();
      hooks.persist();
      hooks.render();
      scheduleSubmission(true);
    }
    if (action === "save") {
      scheduleSubmission(true);
      flush();
    }
    if (action === "revoke" && s.collection && !b.disabled) {
      b.disabled = true;
      const c = s.collection;
      controller?.abort();
      clearTimeout(timer);
      latest = null;
      const deadline = requestDeadline(20000);
      try {
        const r = await fetch(api("/submissions/revoke"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: c.id, editToken: c.editToken }),
          cache: "no-store",
          credentials: "omit",
          signal: deadline.signal,
        });
        if (!r.ok) throw Error();
        delete s.collection;
        resetCollectionClient();
        hooks.persist();
        hooks.render();
        hooks.toast("服务器记录已撤回；创建者此前下载的副本需另行联系处理。");
      } catch {
        status("撤回未成功，请稍后重试。", true);
      } finally {
        deadline.clear();
        b.disabled = false;
      }
    }
  });
  window.addEventListener("inner-atlas:report-ready", () => {
    scheduleSubmission(true);
    hooks.persist();
    document.querySelectorAll("[data-collection-slot]").forEach(
      (el) =>
        (el.innerHTML = collectionStatusMarkup({
          allowNew: el.dataset.collectionSlot !== "active-only",
        })),
    );
  });
  window.addEventListener("pagehide", () => {
    if (latest && hooks.getSession()?.collection) {
      const payload = new Blob([JSON.stringify(latest)], {
        type: "application/json",
      });
      if (payload.size > 60000) return;
      navigator.sendBeacon(api("/submissions"), payload);
    }
  });
}

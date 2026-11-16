import {
  renderReportReader,
  configureReader,
  readerEsc as esc,
  readingParagraphs,
} from "./report-reader.js";
import { aiReportMarkdown, references } from "./ai-ui.js";
let hooks,
  token = "",
  records = null,
  selected = null,
  error = "",
  busy = false,
  installed = false;
const date = (s) =>
  new Date(s).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
const status = (s) =>
  ({ draft: "答题中", completed: "已完成答卷", reported: "已有AI报告" })[s] ||
  s;
function download(name, value, type = "application/json") {
  const body =
    typeof value === "string" ? value : JSON.stringify(value, null, 2);
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function request(path, options = {}) {
  const r = await fetch("/api/owner/" + path, {
    ...options,
    headers: { Authorization: "Bearer " + token, ...options.headers },
    cache: "no-store",
    credentials: "omit",
  });
  if (!r.ok) {
    let data;
    try {
      data = await r.json();
    } catch {}
    const error = Error(data?.message || "暂时无法读取归档。");
    error.status = r.status;
    throw error;
  }
  return r;
}
async function refresh() {
  busy = true;
  error = "";
  renderOwner();
  try {
    const r = await request("submissions");
    records = (await r.json()).records;
  } catch (e) {
    error = e.message;
    records = null;
    if (e.status === 401) token = "";
  } finally {
    busy = false;
    renderOwner();
  }
}
async function select(id) {
  busy = true;
  error = "";
  renderOwner();
  try {
    selected = await (await request("submissions/" + id)).json();
  } catch (e) {
    error = e.message;
  } finally {
    busy = false;
    renderOwner();
    document.getElementById("owner-detail")?.scrollIntoView({ block: "start" });
  }
}
export function configureOwner(config) {
  hooks = config;
  configureReader();
  if (installed) return;
  installed = true;
  document.addEventListener("submit", (e) => {
    if (e.target.id !== "owner-login") return;
    e.preventDefault();
    token = e.target.elements.ownerKey.value.trim();
    e.target.reset();
    if (token) refresh();
  });
  document.addEventListener("input", (e) => {
    if (e.target.id === "owner-search") {
      const q = e.target.value.toLowerCase();
      document
        .querySelectorAll("[data-owner-record]")
        .forEach((el) => (el.hidden = !el.dataset.search.includes(q)));
    }
  });
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-owner-action]");
    if (!b) return;
    const a = b.dataset.ownerAction;
    if (a === "refresh" && !busy) refresh();
    if (a === "open" && !busy) select(b.dataset.id);
    if (a === "logout") {
      token = "";
      records = null;
      selected = null;
      error = "";
      renderOwner();
    }
    if (a === "back") {
      selected = null;
      renderOwner();
    }
    try {
      if (a === "export-all") {
        const data = await (await request("export")).json();
        download("见己-全部答卷与报告.json", data);
      }
      if (a === "json" && selected)
        download("见己-" + selected.id + ".json", selected);
      if (a === "csv" && selected)
        download(
          "见己-" + selected.id + "-逐题答案.csv",
          await (
            await request("submissions/" + selected.id + "/answers.csv")
          ).text(),
          "text/csv;charset=utf-8",
        );
      if (a === "markdown" && selected?.analysis)
        download(
          "见己-" + selected.id + "-综合报告.md",
          aiReportMarkdown(selected.analysis),
          "text/markdown;charset=utf-8",
        );
      if (
        a === "delete" &&
        selected &&
        confirm("删除这份服务器答卷与报告？此前已下载的副本不会删除。")
      ) {
        await request("submissions/" + selected.id, { method: "DELETE" });
        selected = null;
        refresh();
      }
    } catch (err) {
      error = err.message;
      renderOwner();
    }
  });
}
export function renderOwner() {
  const head = `<div class="owner-header"><div><a class="back-link" href="#/">返回网站</a><span class="eyebrow">CREATOR / PRIVATE ARCHIVE</span><h1>创建者收件箱</h1><p>集中查看已明确同意提交的答卷、进度和综合报告。</p></div>${token ? '<button class="button ghost" data-owner-action="logout">退出查看</button>' : ""}</div>`;
  let body = "";
  if (!token)
    body = `<form id="owner-login" class="panel owner-login"><h2>打开你的归档</h2><p>这里需要创建者查看密钥。朋友使用普通测试入口，不需要这个密钥。</p><label class="ai-field">查看密钥<input name="ownerKey" type="password" autocomplete="off" required></label><button type="submit" class="button primary">查看答卷和报告</button></form>`;
  else if (selected) {
    const r = selected;
    body = `<section class="panel owner-detail-head" id="owner-detail"><button class="text-button" data-owner-action="back">返回全部记录</button><h2>${esc(r.label)}</h2><p>${status(r.status)} · ${r.answered} / ${r.total}题 · 更新于 ${date(r.updatedAt)}</p><div class="owner-actions"><button class="button ghost" data-owner-action="json">导出完整JSON</button><button class="button ghost" data-owner-action="csv">导出逐题CSV</button>${r.analysis ? '<button class="button ghost" data-owner-action="markdown">导出报告Markdown</button>' : ""}<button class="text-button" data-owner-action="delete">删除这份记录</button></div></section>${
      r.analysis
        ? renderReportReader(r.analysis, {
            interactive: false,
            references,
            prefix: "owner",
            formulations: r.analysis.report.formulations
              .map(
                (f) =>
                  `<details class="reader-disclosure"><summary>${esc(f.title)}</summary>${["observation", "hypothesis", "possibleFunction", "possibleCost"].map((k) => readingParagraphs(f[k])).join("")}<h4>反例与资料缺口</h4>${f.counterpoints.map(readingParagraphs).join("")}<h4>其他解释</h4>${f.alternatives.map(readingParagraphs).join("")}${readingParagraphs(f.question)}${readingParagraphs(f.wouldChangeMind)}</details>`,
              )
              .join(""),
          })
        : '<div class="notice">这份记录还没有生成AI报告，已保存的答案可在下方查看。</div>'
    }<details class="panel owner-answers"><summary>查看逐题作答（${r.answered}题已回答）</summary><div class="owner-table-wrap"><table><thead><tr><th>模块</th><th>题目</th><th>答案</th></tr></thead><tbody>${r.itemResponses.map((q) => `<tr><td>${esc(q.module)}</td><td>${esc(q.text)}</td><td>${esc(q.answerLabel)}${q.answer === null ? "" : ` (${q.answer})`}</td></tr>`).join("")}</tbody></table></div></details>${
      r.analysis?.context
        ? `<details class="panel"><summary>生成这份报告时的补充背景</summary>${Object.entries(
            r.analysis.context,
          )
            .map(([key, v]) => `<h4>${esc(key)}</h4>${readingParagraphs(v)}`)
            .join("")}</details>`
        : ""
    }`;
  } else if (records) {
    body = `<div class="owner-stats">${[
      ["全部记录", records.length],
      ["答题中", records.filter((r) => r.status === "draft").length],
      ["已有报告", records.filter((r) => r.hasReport).length],
    ]
      .map(
        ([a, b]) =>
          `<article class="panel"><span>${a}</span><strong>${b}</strong></article>`,
      )
      .join(
        "",
      )}</div><div class="owner-tools"><input id="owner-search" type="search" aria-label="按称呼查找" placeholder="按称呼查找"><button class="button ghost" data-owner-action="refresh">刷新记录</button><button class="button primary" data-owner-action="export-all">导出全部JSON备份</button></div><div class="owner-records">${records.length ? records.map((r) => `<button type="button" class="panel owner-record" data-owner-action="open" data-owner-record data-id="${r.id}" data-search="${esc(r.label.toLowerCase())}"><span><strong>${esc(r.label)}</strong><small>${date(r.updatedAt)}</small></span><span>${r.answered} / ${r.total}题</span><span class="badge">${status(r.status)}</span><span>查看 →</span></button>`).join("") : '<div class="panel"><h2>还没有提交记录</h2><p>朋友在测试设置中同意“保存给创建者查看”后，答题进度和生成的报告会出现在这里。</p></div>'}</div>`;
  } else body = '<p class="notice">正在读取服务器记录…</p>';
  if (location.hash !== "#/owner") return;
  hooks.shell(
    `<div class="owner-dashboard">${head}${error ? `<p class="ai-error" role="alert">${esc(error)}</p>` : ""}${busy ? '<p role="status" class="caption">正在读取…</p>' : ""}${body}</div>`,
    { wide: true },
  );
}

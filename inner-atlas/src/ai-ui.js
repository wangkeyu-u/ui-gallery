import {
  AI_SECTIONS,
  analysisIdentity,
  validateAIReport,
} from "./ai-contract.js";
import { analysisCoverage, makeAnalysisRequest } from "./ai-input.js";
import { SOURCES } from "./sources.js";
import { analysisEndpoint, probeAnalysisService } from "./ai-service.js";
let hooks,
  owner = null,
  generation = 0;
let state = {
  endpoint: "",
  code: "",
  context: { goal: "", recent: "", counterexample: "" },
  health: false,
  consent: false,
  busy: false,
  error: "",
  result: null,
  sourceKey: null,
  sourceContext: null,
  controller: null,
};
let service = {
  state: "idle",
  message: "正在读取分析服务状态…",
  endpoint: null,
  controller: null,
};
let serviceGeneration = 0;
function invalidateService() {
  service.controller?.abort();
  serviceGeneration++;
  service = {
    state: "idle",
    message: "服务地址已改变，请检测连接。",
    endpoint: null,
    controller: null,
  };
  updateServiceUI();
}
function serviceMarkup() {
  return `<div class="ai-service-copy"><strong>${service.state === "ready" ? "分析服务已配置" : service.state === "checking" ? "正在检查分析服务" : service.state === "unconfigured" ? "分析服务尚未启用" : service.state === "unavailable" ? "暂时无法连接分析服务" : "分析服务待检测"}</strong><p>${esc(service.message)}</p><small>连接检测只读取服务状态，不发送答卷、背景或分析口令；“已配置”不代表供应商密钥和余额已验证。</small><a href="./docs/AI_ANALYSIS.md" target="_blank" rel="noopener noreferrer" class="ai-setup-help">站点维护者：查看后端配置步骤</a></div><button type="button" class="button ghost small" data-ai-action="check-service" ${service.state === "checking" ? "disabled" : ""}>${service.state === "checking" ? "检测中…" : "检测连接"}</button>`;
}
export function renderAIReadiness(check = true) {
  if (check && service.state === "idle")
    queueMicrotask(() => {
      if (service.state === "idle") checkService();
    });
  return `<div id="ai-service-status" class="ai-service-status" data-state="${service.state}" role="status" aria-live="polite">${serviceMarkup()}</div>`;
}
function updateServiceUI() {
  const banner = document.querySelector("#ai-service-status");
  if (banner) {
    banner.innerHTML = serviceMarkup();
    banner.dataset.state = service.state;
  }
  const button = document.querySelector(
    '#ai-analysis-form button[type="submit"]',
  );
  const session = hooks?.getSession();
  if (button && session)
    button.disabled =
      state.busy ||
      !analysisCoverage(session).ready ||
      hooks.isDemo() ||
      service.state !== "ready";
}
async function checkService() {
  const selectedEndpoint = state.endpoint,
    id = ++serviceGeneration;
  service.controller?.abort();
  const controller = new AbortController();
  service = {
    state: "checking",
    message: "正在检查后端是否已配置，未发送答卷。",
    endpoint: null,
    controller,
  };
  updateServiceUI();
  try {
    const status = await probeAnalysisService(selectedEndpoint, {
      baseUrl: location.href,
      signal: controller.signal,
    });
    if (id !== serviceGeneration || selectedEndpoint !== state.endpoint) return;
    service = { ...status, controller: null };
  } catch (error) {
    if (id !== serviceGeneration) return;
    service = {
      state: "unavailable",
      message: error.message,
      endpoint: null,
      controller: null,
    };
  }
  updateServiceUI();
}
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const paragraphs = (s) =>
  esc(s)
    .split(/\n+/)
    .filter(Boolean)
    .map((s) => "<p>" + s + "</p>")
    .join("");
function ensureOwner(session, isDemo) {
  const next = isDemo ? "demo" : session.created;
  if (owner !== next) {
    state.controller?.abort();
    generation++;
    state = {
      ...state,
      context: { goal: "", recent: "", counterexample: "" },
      health: false,
      consent: false,
      busy: false,
      error: "",
      result: null,
      sourceKey: null,
      sourceContext: null,
      controller: null,
    };
    owner = next;
  }
}
export function clearAIState() {
  invalidateService();
  state.controller?.abort();
  generation++;
  state = {
    ...state,
    code: "",
    context: { goal: "", recent: "", counterexample: "" },
    health: false,
    consent: false,
    busy: false,
    error: "",
    result: null,
    sourceKey: null,
    sourceContext: null,
    controller: null,
  };
  owner = null;
}
function contextIdentity() {
  return JSON.stringify({ context: state.context, health: state.health });
}
function isStale(session) {
  return (
    !session ||
    state.sourceKey !== analysisIdentity(session) ||
    state.sourceContext !== contextIdentity()
  );
}
export function currentAIResult(session, isDemo) {
  if (!session || isDemo || isStale(session)) return null;
  return state.result;
}
function references(item, result) {
  return `<details class="ai-evidence"><summary>查看支持资料与依据</summary><ul>${item.evidenceIds
    .map((id) => {
      const e = result.evidence.find((e) => e.id === id);
      if (!e) return "";
      const value =
        e.value?.mean !== undefined
          ? `原始均值 ${e.value.mean.toFixed(2)} / ${e.value.range[1]}`
          : e.value?.sum !== undefined
            ? `原始总分 ${e.value.sum}`
            : typeof e.value === "string"
              ? e.value
              : e.value?.choice || "";
      return `<li><strong>${esc(e.label)}</strong>：${esc(value)} <span>(${esc({ scale: "量表分量表", original: "原创探索", scenario: "情境选择", self_report: "个人自述", screen: "症状筛查" }[e.kind] || e.kind)})</span></li>`;
    })
    .join("")}</ul><div class="ai-knowledge-refs">${item.knowledgeIds
    .map((id) => {
      const k = result.knowledge.find((k) => k.id === id);
      return k
        ? `<span>${esc(k.title)}：${k.sourceIds
            .map((id) => {
              const s = SOURCES.find((s) => s.id === id);
              return s
                ? `<a href="#/sources/${esc(id)}">${esc(s.title)}</a>`
                : "";
            })
            .join(" · ")}</span>`
        : "";
    })
    .join("")}</div></details>`;
}
const reviewLabels = {
  grounding: "资料与解释的对应",
  counterexamples: "反例的处理",
  context: "近期背景",
  relationship_scope: "关系对象的区别",
  redundancy: "内容重复",
  clinical_boundary: "健康解释的边界",
  actionability: "行动的具体程度",
};
function reviewSummary(result) {
  const review = result.review;
  if (!review || review.status === "not_requested")
    return '<span class="ai-review-label">单轮综合</span>';
  return `<details class="ai-review-summary"><summary>完成整合与一次 AI 复核</summary><p>复核会检查反例、关系对象、资料对应和重复表达。${review.status === "revised" ? `本次调整：${review.revisionCategories.map((code) => esc(reviewLabels[code] || code)).join("、")}。` : "第二轮未要求实质改写。"}AI复核不是独立临床审核，仍可能有遗漏或误解。</p></details>`;
}
function renderAnalysisSection(section, result) {
  const open =
    ["romance", "friendship", "family"].includes(section.id) &&
    section.status === "supported";
  return `<details class="panel ai-analysis-section" id="ai-section-${section.id}" ${open ? "open" : ""}><summary><h3>${esc(AI_SECTIONS.find(([id]) => id === section.id)[1])}</h3><span class="badge">${section.status === "insufficient" ? "资料不足" : "综合假设 · 待核实"}</span></summary><div class="ai-section-body">${paragraphs(section.summary)}${paragraphs(section.implications)}<h4>替代解释／边界</h4>${paragraphs(section.alternative)}<div class="practice-box"><p>${esc(section.question)}</p></div>${references(section, result)}</div></details>`;
}
function renderResult(result, stale) {
  const r = result.report;
  return `<div class="ai-generated ${stale ? "stale" : ""}"><div class="notice ai-stale-indicator" ${stale ? "" : "hidden"}><p>你的答卷或补充背景已修改。这份报告基于之前的资料，不能作为当前结果；请重新生成。</p></div><div class="ai-report-meta"><span>DeepSeek · ${esc(result.model)}</span><span>${new Date(result.generatedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</span><span>提示词 ${esc(result.promptVersion)} · 知识库 ${esc(result.knowledgeVersion)}</span></div>${reviewSummary(result)}<article class="ai-portrait panel"><span class="eyebrow">YOUR INTEGRATED PORTRAIT</span><h2>把不同的你，放在同一张地图里。</h2>${paragraphs(r.overall.summary)}${references(r.overall, result)}</article><h3 class="report-subtitle">贯穿整份答卷的主题</h3><div class="ai-theme-grid">${r.themes.map((t, themeIndex) => `<article class="panel"><h3>${esc(t.title)}</h3>${paragraphs(t.claim)}<h4>其他可能的解释</h4>${t.alternatives.map((a) => `<p>${esc(a)}</p>`).join("")}<div class="practice-box"><strong>用真实经历核实</strong><p>${esc(t.question)}</p></div>${references(t, result)}<button type="button" class="text-button ai-challenge" data-ai-action="challenge" data-theme="${themeIndex}">这点不符合我／补充反例</button></article>`).join("")}</div><nav class="ai-section-index" aria-label="综合分析内容索引">${AI_SECTIONS.map(([id, title]) => `<button type="button" data-ai-action="scroll" data-target="${id}">${esc(title)}</button>`).join("")}</nav><div class="ai-detail-toolbar"><span>按需要展开12项分析，优先呈现关系部分。</span><button type="button" class="text-button" data-ai-action="expand">展开全部</button><button type="button" class="text-button" data-ai-action="collapse">收起全部</button></div><div class="ai-integrated-sections">${r.sections.map((section) => renderAnalysisSection(section, result)).join("")}</div>${
    r.cycles.length
      ? `<h3 class="report-subtitle">你可以留意的关系与情绪循环</h3><p class="muted">这是待验证的功能性假设，并非问卷发现的因果关系。</p>${r.cycles
          .map(
            (c) =>
              `<article class="panel ai-cycle"><h3>${esc(c.title)}</h3><ol>${[
                ["可能的触发", c.trigger],
                ["可能的理解", c.meaning],
                ["保护自己的方式", c.protection],
                ["短期作用", c.shortTerm],
                ["可能的长期代价", c.longTerm],
              ]
                .map(
                  ([title, text]) =>
                    `<li><strong>${title}</strong><p>${esc(text)}</p></li>`,
                )
                .join(
                  "",
                )}</ol><h4>另一种解释</h4><p>${esc(c.alternative)}</p><div class="practice-box"><strong>如何核实</strong><p>${esc(c.check)}</p></div>${references(c, result)}</article>`,
          )
          .join("")}`
      : ""
  }${r.contradictions.length ? `<h3 class="report-subtitle">那些没有被抹平的矛盾</h3><div class="detail-grid">${r.contradictions.map((c) => `<article class="panel"><h3>${esc(c.observation)}</h3>${c.explanations.map((e) => `<p>${esc(e)}</p>`).join("")}<div class="practice-box"><p>${esc(c.question)}</p></div>${references(c, result)}</article>`).join("")}</div>` : ""}<h3 class="report-subtitle">从哪里开始改变</h3><div class="action-grid">${r.priorities.map((p) => `<article class="panel"><span class="eyebrow">${esc(p.timeframe)}</span><h3>${esc(p.title)}</h3><p>${esc(p.why)}</p><h4>具体一步</h4><p>${esc(p.step)}</p><h4>观察什么</h4><p>${esc(p.observe)}</p>${references(p, result)}</article>`).join("")}</div><div class="ai-followup-grid"><section class="panel"><h3>下一次，值得继续追问</h3><ol>${r.followUpQuestions.map((q) => `<li>${esc(q)}</li>`).join("")}</ol></section><section class="panel"><h3>目前还不能替你确定</h3><ul>${r.uncertainties.map((q) => `<li>${esc(q)}</li>`).join("")}</ul></section></div><div class="notice"><p>AI 综合的是你提供的自我报告，不是观察到的全部人生。连贯、有说服力的文字仍可能有误；不用于诊断或排除心理疾病。引用检查验证资料存在与结构，不证明每项解释在语义或临床上正确。</p></div><div class="ai-controls"><button class="button ghost" data-ai-action="export">下载 AI 综合报告</button></div></div>`;
}
export function renderAIPanel(session, isDemo = false) {
  ensureOwner(session, isDemo);
  const coverage = analysisCoverage(session),
    result = state.result,
    stale = result && isStale(session);
  return `<section class="report-section ai-report-section ${result ? "" : "ai-no-report"}"><div class="section-heading"><div><span class="eyebrow">DEEPSEEK / INTEGRATED UNDERSTANDING</span><h2>从整份答卷，理解它们怎样联系。</h2><p>综合人格、关系差异、情绪、情境与背景，解释共同主题、保护方式和可能的代价。</p></div></div>${isDemo ? '<div class="notice"><p>当前是虚构示例答卷。这里展示综合分析的流程和覆盖范围；未调用 DeepSeek，不展示伪造的 AI 结果。完成你的答卷后即可提交综合分析。</p></div>' : ""}${result ? renderResult(result, stale) : ""}<div class="ai-controls panel">${renderAIReadiness(!isDemo)}<div class="ai-coverage"><span>基础回答 ${coverage.answered} / ${coverage.total}</span><span>完整人格维度 ${coverage.traits} / 5</span><span>完整探索维度 ${coverage.explorations} / 8</span><span>情境 ${coverage.scenarios} / 8</span></div>${!coverage.ready ? '<div class="notice"><p>为避免用少数回答拼出一个人，综合分析需要基础题完成至少70%、3个人格维度、总体依恋、4个探索维度及3个情境。你可以先补充答题。</p></div>' : ""}<form id="ai-analysis-form"><h3>${result ? "补充背景，重新核实这份理解" : "给综合分析一点真实背景（可选）"}</h3><p class="muted">不需要姓名或联系方式。不要填写他人的身份信息；不必叙述不愿回忆的经历。</p>${[
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
  ]
    .map(
      ([id, label, placeholder]) =>
        `<label class="ai-field">${label}<textarea data-ai-context="${id}" maxlength="1000" rows="3" placeholder="${placeholder}">${esc(state.context[id])}</textarea></label>`,
    )
    .join(
      "",
    )}<details class="ai-connection"><summary>分析服务与访问设置</summary><label class="ai-field">分析服务地址<input type="url" name="endpoint" value="${esc(state.endpoint)}" placeholder="同站点部署可留空；外部服务填 https://…/api/analyze"><small>GitHub Pages 需连接独立分析服务。此地址只在本页内存中保存。</small></label><label class="ai-field">站点分析口令<input type="password" name="accessCode" value="${esc(state.code)}" autocomplete="off" placeholder="由站点维护者提供，不是 DeepSeek API Key"><small>不要在网页中输入 DeepSeek 密钥；口令仅保存在当前页面内存。</small></label></details><label class="ai-check"><input type="checkbox" name="health" ${state.health ? "checked" : ""}><span>同时分享我已作答的心理健康部分（可选）<small>未勾选时，PHQ-9、GAD-7、PCL-5 的答案与分数不会随 AI 请求发送；对应章节会说明资料不足。你自行填写的背景仍会按预览提交。更改选项只影响下一次请求，不能撤回已发送的资料。</small></span></label><details class="ai-transfer-preview"><summary>发送前，查看将提交的全部资料</summary><p class="muted">接收方：<span id="ai-recipient">${esc(state.endpoint || "本站 /api/analyze")} → DeepSeek 官方 API</span>。包括所选题目回答、重新计分用设置及你填写的背景；不含保存时间、姓名、访问口令或其他浏览器数据。</p><pre id="ai-payload-preview">${esc(JSON.stringify(makeAnalysisRequest(session, state.context, state.health), null, 2))}</pre></details><label class="ai-check"><input type="checkbox" name="consent" ${state.consent ? "checked" : ""} required><span>我已满18岁，理解这是探索而非诊断，并同意将上述资料发送至分析服务及 DeepSeek 处理。<small>网站后端不主动保存答卷或报告正文；托管商与 DeepSeek 可能按各自政策处理请求（<a href="https://cdn.deepseek.com/policies/zh-CN/deepseek-open-platform-privacy-policy.html" target="_blank" rel="noopener noreferrer">DeepSeek 开放平台隐私政策</a>）。AI报告仅保留在本页内存，刷新后请重新生成或使用已下载副本。</small></span></label>${state.error ? `<p class="ai-error" role="alert">${esc(state.error)}</p>` : ""}<div class="ai-submit-row"><button type="submit" class="button primary" ${state.busy || !coverage.ready || isDemo || service.state !== "ready" ? "disabled" : ""}>${state.busy ? "DeepSeek 正在综合与复核…" : result ? "根据当前答卷重新综合" : "生成我的 AI 综合分析"}</button>${state.busy ? '<button type="button" class="button ghost" data-ai-action="cancel">取消等待</button>' : '<a class="text-button" href="#/review">回看／补充回答</a>'}</div>${state.busy ? '<p class="ai-progress" role="status">正在整合跨领域资料、复核反例与关系差异，再检查引用，可能需要几分钟。请勿重复提交。</p>' : ""}</form></div></section>`;
}
function updatePreview() {
  const session = hooks.getSession();
  if (!session) return;
  const el = document.querySelector("#ai-payload-preview");
  if (el)
    el.textContent = JSON.stringify(
      makeAnalysisRequest(session, state.context, state.health),
      null,
      2,
    );
  const receiver = document.querySelector("#ai-recipient");
  if (receiver) receiver.textContent = state.endpoint || "本站 /api/analyze";
  if (state.result) {
    const stale = isStale(session),
      el = document.querySelector(".ai-generated");
    el?.classList.toggle("stale", stale);
    const note = document.querySelector(".ai-stale-indicator");
    if (note) note.hidden = !stale;
  }
}
function endpointURL(value) {
  return analysisEndpoint(value, location.href);
}
export function aiReportMarkdown(result) {
  const r = result.report;
  const lines = [
    "# 见己 · DeepSeek 综合分析",
    `提供方 ${result.provider}；模型 ${result.model}；提示词 ${result.promptVersion}；知识库 ${result.knowledgeVersion}`,
    r.overall.summary,
  ];
  const cite = (x) => {
    for (const id of x.evidenceIds) {
      const e = result.evidence.find((e) => e.id === id);
      lines.push(`依据 ${id}: ${e?.label || id} ${JSON.stringify(e?.value)}`);
    }
    for (const id of x.knowledgeIds) {
      const k = result.knowledge.find((k) => k.id === id);
      for (const sid of k?.sourceIds || []) {
        const s = SOURCES.find((s) => s.id === sid);
        if (s) lines.push(`参考：[${s.title}](${s.url})`);
      }
    }
  };
  if (result.review?.passes === 2)
    lines.push(
      "本次包含综合生成与一次AI复核；复核不能证明结论真实或具有临床效度。",
    );
  cite(r.overall);
  for (const t of r.themes) {
    lines.push(
      "## " + t.title,
      t.claim,
      ...t.alternatives,
      "核实：" + t.question,
    );
    cite(t);
  }
  for (const s of r.sections) {
    lines.push(
      "## " + AI_SECTIONS.find(([id]) => id === s.id)[1],
      s.status === "insufficient" ? "资料不足" : "综合假设，待核实",
      s.summary,
      s.implications,
      "替代解释：" + s.alternative,
      "核实：" + s.question,
    );
    cite(s);
  }
  for (const c of r.cycles) {
    lines.push(
      "## 待验证循环：" + c.title,
      "可能触发：" + c.trigger,
      "可能理解：" + c.meaning,
      "保护方式：" + c.protection,
      "短期作用：" + c.shortTerm,
      "可能代价：" + c.longTerm,
      "替代解释：" + c.alternative,
      "核实：" + c.check,
    );
    cite(c);
  }
  for (const c of r.contradictions) {
    lines.push("## 张力：" + c.observation, ...c.explanations, c.question);
    cite(c);
  }
  for (const p of r.priorities) {
    lines.push("## " + p.title, p.why, p.step, p.observe, p.timeframe);
    cite(p);
  }
  lines.push(
    "## 继续追问",
    ...r.followUpQuestions,
    "## 尚不能确定",
    ...r.uncertainties,
    "AI报告可能错误；项目译文、原创题与跨量表综合尚未验证，不提供临床诊断。",
  );
  return lines.join("\n\n");
}
export function configureAI(config) {
  hooks = config;
  window.addEventListener("beforeprint", () =>
    document
      .querySelectorAll("details.ai-evidence, details.ai-analysis-section")
      .forEach((el) => {
        if (el.dataset.wasOpen === undefined)
          el.dataset.wasOpen = el.open ? "true" : "false";
        el.open = true;
      }),
  );
  window.addEventListener("afterprint", () =>
    document
      .querySelectorAll("details.ai-evidence, details.ai-analysis-section")
      .forEach((el) => {
        if (el.dataset.wasOpen === "false") el.open = false;
        delete el.dataset.wasOpen;
      }),
  );
  document.addEventListener("input", (e) => {
    if (e.target.dataset.aiContext) {
      state.context[e.target.dataset.aiContext] = e.target.value;
      updatePreview();
    } else if (e.target.closest("#ai-analysis-form")) {
      if (e.target.name === "endpoint") {
        state.endpoint = e.target.value.trim();
        invalidateService();
        updatePreview();
      } else if (e.target.name === "accessCode") state.code = e.target.value;
    }
  });
  document.addEventListener("change", (e) => {
    if (!e.target.closest("#ai-analysis-form")) return;
    if (e.target.name === "health") {
      state.health = e.target.checked;
      updatePreview();
    }
    if (e.target.name === "consent") state.consent = e.target.checked;
    if (e.target.name === "endpoint" && service.state === "idle")
      checkService();
  });
  document.addEventListener("click", (e) => {
    const button = e.target.closest("[data-ai-action]");
    if (!button) return;
    const action = button.dataset.aiAction;
    if (action === "check-service") checkService();
    if (action === "scroll") {
      const section = document.getElementById(
        "ai-section-" + button.dataset.target,
      );
      if (section) {
        section.open = true;
        section.scrollIntoView({
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "instant"
            : "smooth",
        });
      }
    }
    if (action === "expand" || action === "collapse")
      document
        .querySelectorAll("details.ai-analysis-section")
        .forEach((section) => (section.open = action === "expand"));
    if (action === "challenge" && state.result) {
      const theme = state.result.report.themes[Number(button.dataset.theme)];
      if (!theme) return;
      const prefix = `关于主题“${theme.title}”：${theme.claim.slice(0, 100)}\n我想补充或纠正的是：`;
      const original = state.context.counterexample;
      if ((original + prefix).length + 2 > 1000) {
        hooks.toast("反例已接近1000字，请先整理已有补充。");
        return;
      }
      state.context.counterexample = original
        ? original + "\n\n" + prefix
        : prefix;
      state.consent = false;
      const input = document.querySelector(
        'textarea[data-ai-context="counterexample"]',
      );
      if (input) {
        input.value = state.context.counterexample;
        input.focus({ preventScroll: true });
        input.setSelectionRange(input.value.length, input.value.length);
        input.scrollIntoView({
          block: "center",
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "instant"
            : "smooth",
        });
      }
      const consent = document.querySelector(
        '#ai-analysis-form input[name="consent"]',
      );
      if (consent) consent.checked = false;
      updatePreview();
      hooks.toast("已定位到反例补充；写下真实经历后可重新综合。");
    }
    if (action === "cancel") {
      state.controller?.abort();
      generation++;
      state.busy = false;
      state.error = "已取消等待。";
      hooks.render();
    }
    if (action === "export" && state.result) {
      if (isStale(hooks.getSession()))
        return hooks.toast("答卷或补充背景已修改，请重新生成综合报告后导出。");
      hooks.download(
        "见己-私密AI综合报告.md",
        aiReportMarkdown(state.result),
        "text/markdown;charset=utf-8",
      );
    }
  });
  document.addEventListener("submit", async (e) => {
    if (e.target.id !== "ai-analysis-form") return;
    e.preventDefault();
    if (state.busy || hooks.isDemo()) return;
    const session = hooks.getSession();
    if (!session || !analysisCoverage(session).ready) return;
    if (service.state !== "ready") {
      hooks.toast("分析服务尚未就绪，请先检测连接。本地结果可继续查看。");
      return;
    }
    if (!e.target.reportValidity() || !state.consent) return;
    let endpoint;
    try {
      endpoint = endpointURL(state.endpoint);
      if (!state.code.trim())
        throw Error(
          "请先展开“分析服务与访问设置”，填写站点维护者提供的分析口令。",
        );
    } catch (error) {
      state.error = error.message;
      hooks.render();
      return;
    }
    const id = ++generation,
      key = analysisIdentity(session),
      draftKey = contextIdentity(),
      request = makeAnalysisRequest(session, state.context, state.health);
    state.busy = true;
    state.error = "";
    state.controller = new AbortController();
    hooks.render();
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + state.code,
        },
        body: JSON.stringify(request),
        signal: AbortSignal.any([
          state.controller.signal,
          AbortSignal.timeout(255000),
        ]),
        cache: "no-store",
        credentials: "omit",
        referrerPolicy: "no-referrer",
      });
      let data;
      try {
        data = await response.json();
      } catch {
        throw Error(
          "分析服务未正确返回 JSON。GitHub Pages 需要先配置独立 DeepSeek 后端。",
        );
      }
      if (!response.ok) {
        if (data.code === "AI_NOT_CONFIGURED") {
          service = {
            state: "unconfigured",
            message: "分析服务配置已变化，请维护者补齐后重新检测。",
            endpoint: null,
            controller: null,
          };
        }
        throw Error(data.message || "分析请求失败。");
      }
      if (
        data.provider !== "DeepSeek" ||
        !data.report ||
        !Array.isArray(data.evidence) ||
        !Array.isArray(data.knowledge)
      )
        throw Error("分析服务返回格式不正确。");
      data.report = validateAIReport(data.report, {
        evidence: data.evidence,
        knowledge: data.knowledge,
        disabledSections: request.consent.health ? [] : ["mental_health"],
        allowHealth: request.consent.health,
      });
      if (id !== generation) return;
      if (
        !hooks.getSession() ||
        key !== analysisIdentity(hooks.getSession()) ||
        draftKey !== contextIdentity()
      )
        throw Error(
          "答卷或补充背景已变化，这次返回的报告已丢弃。请按当前资料重新生成。",
        );
      state.result = data;
      state.sourceKey = key;
      state.sourceContext = draftKey;
      state.consent = false;
      hooks.toast("综合报告已生成。请结合真实经历核实，也可以下载保存。");
    } catch (error) {
      if (id === generation)
        state.error =
          error.name === "AbortError" || error.name === "TimeoutError"
            ? "请求已取消或超时，未生成有效报告。"
            : error.message;
    } finally {
      if (id === generation) {
        state.busy = false;
        state.controller = null;
        hooks.render();
      }
    }
  });
}

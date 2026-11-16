import { AI_SECTIONS } from "./ai-contract.js";
import { THEORY_LENSES } from "./theories.js";
export const readerEsc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function readingParagraphs(value) {
  const paragraphs = String(value || "")
    .split(/\n+/)
    .filter(Boolean)
    .flatMap((block) => {
      if (block.length < 170) return [block];
      const sentences = block.match(/[^。！？]+[。！？]?[”’"]?/g) || [block];
      const groups = [];
      let part = "";
      for (const sentence of sentences) {
        part += sentence;
        if (part.length >= 100) {
          groups.push(part);
          part = "";
        }
      }
      if (part) groups.push(part);
      return groups;
    });
  return paragraphs.map((p) => `<p>${readerEsc(p)}</p>`).join("");
}
let installed = false;
export function configureReader() {
  if (installed) return;
  installed = true;
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-reader-target]");
    if (!b) return;
    const target = document.getElementById(b.dataset.readerTarget);
    if (target) {
      for (const button of b.parentElement.querySelectorAll("[aria-current]"))
        button.removeAttribute("aria-current");
      b.setAttribute("aria-current", "location");
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
      target.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
      });
    }
  });
}
export function renderReportReader(
  result,
  {
    references = () => "",
    formulations = "",
    interactive = true,
    prefix = "ai",
  } = {},
) {
  const r = result.report,
    p = r.overall.portrait,
    esc = readerEsc,
    paras = readingParagraphs;
  const title = (id) => AI_SECTIONS.find(([key]) => key === id)?.[1] || id;
  function section(s) {
    const open =
      ["romance", "friendship", "family"].includes(s.id) &&
      s.status === "supported";
    return `<details class="ai-analysis-section reader-analysis" id="${prefix}-section-${s.id}" ${open ? "open" : ""}><summary><h3 class="reader-section-name">${esc(title(s.id))}</h3><span class="reader-state">${s.status === "insufficient" ? "资料不足" : "展开解读"}</span></summary><div class="ai-section-body">${paras(s.summary)}<div class="reader-implication">${paras(s.implications)}</div><details class="reader-disclosure"><summary>另一种理解与核实问题</summary>${paras(s.alternative)}<p class="reader-question">${esc(s.question)}</p></details>${references(s, result)}</div></details>`;
  }
  function sections(ids) {
    return ids
      .map((id) => section(r.sections.find((s) => s.id === id)))
      .join("");
  }
  const nav = [
    ["portrait", "整体画像"],
    ["relations", "关系方式"],
    ["patterns", "深层理解"],
    ["actions", "行动建议"],
    ["basis", "依据与边界"],
  ];
  return `<div class="report-reader"><nav class="reader-navigation" aria-label="综合报告目录"><span class="reader-nav-title">这份报告</span>${nav.map(([id, label], i) => `<button type="button" data-reader-target="${prefix}-reader-${id}"><span>0${i + 1}</span>${label}</button>`).join("")}<span class="reader-nav-note">先读主线，再按需展开细节。</span></nav><div class="reader-content"><section class="reader-chapter" id="${prefix}-reader-portrait"><div class="reader-chapter-label">01 / 整体画像</div><article class="ai-portrait reader-portrait"><span class="eyebrow">将不同的你，放在一起理解</span><h2>${esc(p?.headline || "你的整体人格画像")}</h2><div class="ai-portrait-core">${paras(p?.core || r.overall.summary)}</div>${references(p || r.overall, result)}</article>${p ? `<div class="reader-insights"><article><span class="reader-card-label">贯穿主线</span><h3>这些表现怎样连在一起</h3>${paras(p.centralTension)}</article><article><span class="reader-card-label">资源与代价</span><h3>同一倾向的两面</h3>${paras(p.strengthAndCost)}</article></div>` : ""}</section><section class="reader-chapter" id="${prefix}-reader-relations"><div class="reader-chapter-heading"><div><span class="reader-chapter-label">02 / 关系方式</span><h2>你怎样靠近不同的人</h2></div><p>恋人、朋友与家庭分别理解。</p></div>${p ? `<div class="reader-section-intro">${paras(p.relationshipSignature)}</div>` : ""}<div class="reader-relationship-grid">${sections(["romance", "friendship", "family"])}</div>${sections(["conflict"])}</section><section class="reader-chapter" id="${prefix}-reader-patterns"><div class="reader-chapter-heading"><div><span class="reader-chapter-label">03 / 深层理解</span><h2>让不同线索形成一条主线</h2></div><p>主题、内在体验与具体经历。</p></div><div class="ai-theme-grid reader-themes">${r.themes.map((t, i) => `<article class="reader-theme"><div class="reader-theme-number">0${i + 1}</div><div><h3>${esc(t.title)}</h3>${paras(t.claim)}<details class="reader-disclosure"><summary>其他解释，以及怎样核实</summary>${t.alternatives.map(paras).join("")}<p class="reader-question">${esc(t.question)}</p></details>${references(t, result)}${interactive ? `<button type="button" class="text-button ai-challenge" data-ai-action="challenge" data-theme="${i}">这点不符合我／补充反例</button>` : ""}</div></article>`).join("")}</div><div class="reader-inner-sections">${sections(["self", "needs", "emotion", "strengths", "blindspots"])}</div>${formulations}${r.contradictions.length ? `<details class="reader-disclosure reader-wide"><summary>矛盾与反例：画像在哪些地方需要修正</summary>${r.contradictions.map((c) => `<article><h3>${esc(c.observation)}</h3>${c.explanations.map(paras).join("")}<p class="reader-question">${esc(c.question)}</p></article>`).join("")}</details>` : ""}${
    r.cycles.length
      ? `<details class="reader-disclosure reader-wide"><summary>本次经历中的反应顺序</summary>${r.cycles
          .map(
            (c) =>
              `<article class="ai-cycle"><h3>${esc(c.title)}</h3><ol>${[
                ["发生了什么", c.trigger],
                ["当时的理解", c.meaning],
                ["采取的行动", c.protection],
                ["当次结果", c.shortTerm],
                ["待核实的代价", c.longTerm],
              ]
                .map(([a, b]) => `<li><strong>${a}</strong>${paras(b)}</li>`)
                .join(
                  "",
                )}</ol>${paras(c.alternative)}<p>${esc(c.check)}</p>${references(c, result)}</article>`,
          )
          .join("")}</details>`
      : ""
  }</section><section class="reader-chapter" id="${prefix}-reader-actions"><div class="reader-chapter-heading"><div><span class="reader-chapter-label">04 / 行动建议</span><h2>把理解用在下一次相处里</h2></div><p>选择适合你的一个小行动即可。</p></div><div class="reader-actions">${r.priorities.map((item, i) => `<article class="reader-action"><span class="reader-action-number">0${i + 1}</span><div><span class="reader-card-label">${esc(item.timeframe)}</span><h3>${esc(item.title)}</h3>${paras(item.why)}<div class="reader-practice"><strong>可以怎么做</strong>${paras(item.step)}<strong>留意什么变化</strong>${paras(item.observe)}</div>${references(item, result)}</div></article>`).join("")}</div>${sections(["change"])}<details class="reader-disclosure reader-wide"><summary>带着这些问题继续问 AI</summary><ol>${r.followUpQuestions.map((q) => `<li>${esc(q)}</li>`).join("")}</ol></details></section><section class="reader-chapter" id="${prefix}-reader-basis"><div class="reader-chapter-heading"><div><span class="reader-chapter-label">05 / 依据与边界</span><h2>这份理解来自哪里，止于哪里</h2></div></div>${p ? `<div class="reader-boundaries"><h3>哪些情况下会不同</h3>${paras(p.whereItChanges)}<h3>仍需要核实的地方</h3>${paras(p.stillUnknown)}</div>` : ""}${sections(["mental_health", "uncertainty"])}${r.perspectives?.length ? `<div class="ai-perspectives"><h3>不同理论怎样核对这份理解</h3>${r.perspectives.map((t) => `<details class="ai-theory-perspective reader-disclosure"><summary>${esc(THEORY_LENSES.find((x) => x.id === t.theoryId)?.name || t.theoryId)}</summary><h4>自述线索</h4>${paras(t.observation)}<h4>这个视角的解释</h4>${paras(t.interpretation)}<h4>与其他资料的异同</h4>${paras(t.fit)}<h4>不能据此判断</h4>${paras(t.limits)}<h4>另一种解释</h4>${paras(t.alternative)}<p class="reader-question">${esc(t.question)}</p>${references(t, result)}</details>`).join("")}</div>` : ""}<details class="reader-disclosure reader-wide"><summary>本次报告仍不能确定的内容</summary><ul>${r.uncertainties.map((q) => `<li>${esc(q)}</li>`).join("")}</ul></details><p class="reader-footnote">这是基于本次自我报告的综合判断。解释可以被真实经历修订；结构与引用检查不证明推断完全准确，也不作临床诊断。</p></section></div></div>`;
}

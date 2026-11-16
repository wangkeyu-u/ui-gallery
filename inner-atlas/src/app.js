import {
  VERSION,
  OPTIONS,
  TRAITS,
  CUSTOM,
  MODULES,
  QUESTIONS,
  DEFAULT_CONFIG,
  activeQuestions,
} from "./data.js";
import { assess, validAnswer, validateSession } from "./engine.js";
import { SOURCES } from "./sources.js";
import {
  renderAIPanel,
  renderAIReadiness,
  configureAI,
  clearAIState,
  currentAIResult,
  aiReportMarkdown,
} from "./ai-ui.js";
const app = document.querySelector("#app"),
  KEY = "inner-atlas.v1.session";
let session = null,
  demo = false,
  toastTimer,
  sourceFilter = "全部";
const icons = {
  home: '<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  chart: '<path d="M4 3v18h17M9 16v-5m5 5V6m5 10v-8"/>',
  book: '<path d="M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-4-2-7-1-10 1Zm0 0v15"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  back: '<path d="M20 12H4m6-6-6 6 6 6"/>',
  heart:
    '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
  fingerprint:
    '<path d="M4 10a8 8 0 0 1 16 0M7 14v-4a5 5 0 0 1 10 0v6m-7 4v-9a2 2 0 0 1 4 0v7m-9-4v3m12 2 1 2m-11-3-1 3"/>',
  link: '<path d="m10 14 4-4m-6 6-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m2 1 2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0" transform="translate(1 0)"/>',
  sparkles:
    '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Zm7-1v4m-2-2h4"/>',
  cloud: '<path d="M6 18a5 5 0 0 1-1-10 7 7 0 0 1 13-1 5.5 5.5 0 0 1 0 11Z"/>',
  waves:
    '<path d="M2 7q3-4 6 0t6 0 8 0M2 12q3-4 6 0t6 0 8 0M2 17q3-4 6 0t6 0 8 0"/>',
  leaf: '<path d="M5 19C-1 8 9 2 21 3c0 13-6 19-15 14m-3 4L16 8"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  upload: '<path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-11v1"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  github:
    '<path d="M9 21v-4c-4 1-4-2-6-2m15 6v-4c0-1-.5-2-1-2 4-.5 5-3 5-6 0-1-.5-2-1-3 0-1 0-3-1-3-2 0-3 1-3 1a12 12 0 0 0-7 0S8 3 6 3c-1 1-1 3-1 3-1 1-1 2-1 3 0 3 1 5 5 6-.5.5-1 1-1 2v4"/>',
  print: '<path d="M7 8V3h10v5M7 17H3V8h18v9h-4M7 14h10v7H7Zm10-3h1"/>',
};
function icon(name, cls = "") {
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.sparkles}</svg>`;
}
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const number = (n) => String(n).padStart(2, "0");
function toast(text) {
  const el = document.querySelector("#toast");
  el.textContent = text;
  el.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("visible"), 3500);
}
function persist() {
  if (!session) return;
  try {
    if (session.config.remember) {
      localStorage.setItem(KEY, JSON.stringify(session));
    } else localStorage.removeItem(KEY);
  } catch {
    toast("浏览器无法保存进度；本次仍可继续，请下载备份。");
  }
}
try {
  const raw = localStorage.getItem(KEY);
  if (raw) session = validateSession(JSON.parse(raw));
} catch {
  toast("保存的进度无法读取。你可以重新开始，或导入此前下载的备份。");
}
const route = () => location.hash.slice(1) || "/";
function go(path) {
  if (route() === path) {
    render();
    window.scrollTo(0, 0);
  } else location.hash = path;
}
function logo() {
  return `<a class="brand" href="#/" aria-label="见己首页"><span class="brand-icon">${icon("fingerprint")}</span><span>见己<span class="brand-en">INNER ATLAS</span></span></a>`;
}
function shell(content, { wide = false, quiz = false } = {}) {
  const path = route();
  app.innerHTML = `<aside class="sidebar">${logo()}<div class="sidebar-caption">一场向内的探索</div><nav aria-label="主导航">${[
    ["/", "home", "探索首页"],
    ["/modules", "grid", "探索维度"],
    ["/report", "chart", "我的报告"],
    ["/sources", "book", "科学与依据"],
  ]
    .map(
      ([url, i, t]) =>
        `<a href="#${url}" class="nav-link ${url === "/" ? (path === "/" ? "active" : "") : path.startsWith(url) ? "active" : ""}">${icon(i)}<span>${t}</span>${url === "/report" && session ? '<span class="nav-dot"></span>' : ""}</a>`,
    )
    .join(
      "",
    )}</nav><div class="sidebar-bottom"><div class="sidebar-flower">${icon("sun")}</div><p>理解自己，<br>从不急着定义自己开始。</p><a href="#/privacy">${icon("lock")}隐私与数据</a><span class="version">独立探索工具 · v${VERSION}</span></div></aside><div class="site-body"><header class="topbar"><div class="mobile-brand">${logo()}</div><span class="breadcrumb">你的内在地图 <span>/</span> ${quiz ? "正在探索" : path.startsWith("/report") ? "探索报告" : path.startsWith("/sources") ? "证据图书馆" : "自我探索"}</span><div class="top-actions"><a href="#/privacy" class="local-pill" aria-label="隐私与数据：本地计分与自愿 AI 分析">${icon("lock")} 默认本地</a><button class="text-button" data-action="help">需要支持 ${icon("heart")}</button></div></header><main id="main" tabindex="-1" class="main ${wide ? "wide" : ""} ${quiz ? "quiz-main" : ""}">${content}</main><footer class="site-footer"><span>见己 · 为理解留一点空间</span><span>成人自我探索 · 不提供医学诊断</span><a href="https://github.com/wangkeyu-u/ui-gallery/tree/main/inner-atlas" target="_blank" rel="noopener noreferrer">GitHub ${icon("github")}</a></footer></div><input hidden type="file" id="import-file" accept="application/json,.json">`;
}
function sectionTitle(kicker, title, desc = "") {
  return `<div class="section-heading"><div><span class="eyebrow">${kicker}</span><h2>${title}</h2>${desc ? `<p>${desc}</p>` : ""}</div></div>`;
}
function art() {
  return `<div class="atlas-art" aria-hidden="true"><span class="art-grain"></span><svg viewBox="0 0 430 450" class="atlas-svg"><defs><linearGradient id="orb" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d9e4bf"/><stop offset="1" stop-color="#7c9f89"/></linearGradient><linearGradient id="arch" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#e5ebd9"/><stop offset="1" stop-color="#c8d8bd"/></linearGradient></defs><ellipse cx="232" cy="385" rx="128" ry="17" fill="#73917c" opacity=".11"/><path d="M115 365V202a112 112 0 0 1 224 0v163Z" fill="url(#arch)"/><circle cx="228" cy="205" r="84" fill="none" stroke="#6f8d78" opacity=".45"/><circle cx="228" cy="205" r="116" fill="none" stroke="#8aa28e" opacity=".28"/><path d="M114 294c52-73 182-156 231-113M104 232c59 67 178 111 246 74" fill="none" stroke="#60816c" stroke-width="1"/><path d="M153 365v-47c0-36 28-49 47-55-27-12-43-39-35-66 7-25 34-43 61-38 27 4 45 25 45 51 0 18-9 32-20 44 40 12 58 35 58 64v47" fill="url(#orb)" stroke="#5b8069" stroke-width="1.2"/><path d="M215 195c-6 13-9 24-8 29l15 2m-22 15c11 8 23 7 31-1m-31-38h9m21 0h9m-17 66v36" fill="none" stroke="#496d59" stroke-width="1.4" stroke-linecap="round"/><circle cx="285" cy="107" r="20" fill="#e5c68f"/><circle cx="115" cy="293" r="9" fill="#bf8e74"/><circle cx="337" cy="240" r="7" fill="#496d59"/><path d="M92 145h14m-7-7v14M324 337h18m-9-9v18" stroke="#819984"/><path d="M311 368c-4-38 2-68 25-93m-17 55c28 0 39-14 38-35-20 1-31 12-38 35m-3 13c-23-5-32-19-27-37 18 5 26 18 27 37" fill="#a1b49a" stroke="#5b8069" stroke-width="1.2"/></svg><span class="art-label label-one">${icon("sparkles")} 内在的你</span><span class="art-label label-two">${icon("heart")} 关系里的你</span><span class="art-coord">SELF · RELATIONSHIP · WELLBEING</span></div>`;
}
function home() {
  const has = session && Object.keys(session.answers).length;
  shell(
    `<section class="hero"><div class="hero-copy"><div class="eyebrow hero-kicker"><span class="little-star">${icon("sparkles")}</span> MEET YOURSELF, AGAIN</div><h1>你比一个标签，<br>更<span class="serif-accent">丰富</span>。</h1><p class="hero-desc">从人格的底色，到亲密关系中的习惯。<br>把那些“我为什么会这样”，慢慢看清楚。</p><div class="hero-buttons"><a href="#/${has ? (session.finished ? "report/synthesis" : "quiz") : "setup"}" class="button primary">${has ? (session.finished ? "查看我的报告" : "继续我的探索") : "开启自我探索"} ${icon("arrow")}</a><button class="button ghost" data-action="demo">先看看报告 ${icon("chart")}</button></div><div class="hero-meta"><span>${icon("check")} 无需注册</span><span>${icon("lock")} 默认本地 · AI 需授权</span><span>约 30–45 分钟</span></div></div>${art()}</section><div class="trust-strip"><span>多一些依据，少一些武断。</span><div><b>IPIP</b><span>大五人格</span></div><div><b>ECR-RS</b><span>依恋维度</span></div><div><b>PHQ-9 / GAD-7</b><span>可选状态筛查</span></div><a href="#/sources">查看研究依据 ${icon("arrow")}</a></div><section class="home-dimensions">${sectionTitle("EXPLORE YOUR LAYERS", "不同切面，拼出更有层次的你", "一次连贯的探索，分别理解长期倾向、关系习惯与近期状态。")}<div class="dimension-grid">${[
      [
        "01",
        "fingerprint",
        "人格的底色",
        "你如何获得能量、做选择、回应世界。",
        "五大维度 · 连续特质",
        "sage",
      ],
      [
        "02",
        "heart",
        "关系中的你",
        "你如何爱、靠近、信任，又如何保护自己。",
        "恋人 · 朋友 · 家庭",
        "sand",
      ],
      [
        "03",
        "sun",
        "你与自己的相处",
        "情绪、自我价值、内耗与温柔的边界。",
        "8 项探索 · 8 个情境",
        "lavender",
      ],
      [
        "04",
        "leaf",
        "最近的心理状态",
        "看见值得关注的信号，找到支持的方向。",
        "自愿开启 · 筛查非诊断",
        "peach",
      ],
    ]
      .map(
        ([n, i, t, d, tag, c]) =>
          `<a class="dimension-card ${c}" href="#/modules"><div class="card-top"><span class="tile-icon">${icon(i)}</span><span class="card-number">${n}</span></div><h3>${t}</h3><p>${d}</p><div class="card-bottom"><span>${tag}</span>${icon("arrow")}</div></a>`,
      )
      .join(
        "",
      )}</div></section><section class="home-bottom"><div class="gentle-note"><span class="quote-mark">“</span><div><h3>一份理解你的地图，<br>而不是定义你的判决。</h3><p>结果会解释依据、保留不确定性，也给你可尝试的下一步。你始终比一次测试更复杂。</p></div><div class="small-orbit" aria-hidden="true">${icon("sun")}</div></div><div class="journey-note"><span class="eyebrow">YOUR OWN PACE</span><h3>按你的节奏来。</h3><p>可以跳过任何题目、暂停，或选择将进度保存在本机。没有合适的关系对象，也不必勉强回答。</p><a href="#/privacy">了解你的数据如何被保护 ${icon("arrow")}</a></div></section>`,
  );
}
function modules() {
  shell(
    `<div class="page-intro"><span class="eyebrow">THE EXPLORATION</span><h1>一层一层，认识自己。</h1><p>完整题库 178 题 · 11 个章节。你可以选择适合自己的范围，跳过不想回答的问题。</p><a class="button primary" href="#/setup">定制我的探索 ${icon("arrow")}</a></div><div class="module-list">${MODULES.map((m, i) => `<article class="module-card"><span class="module-no">${number(i + 1)}</span><span class="tile-icon ${i % 2 ? "sand" : "sage"}">${icon(m.icon)}</span><div><h3>${m.name} ${m.sensitive ? '<span class="badge">自愿开启</span>' : ""}</h3><p>${m.description}</p><span class="caption">${m.source}</span></div><span class="count-badge">${m.count} 题</span></article>`).join("")}</div><div class="notice">${icon("info")}<p>采用公开量表结构，不代表这个组合测试已通过验证。项目译文、对象改编和原创题的限制，会随每项结果一起说明。</p></div>`,
  );
}
function setup() {
  const cfg = { ...DEFAULT_CONFIG };
  shell(
    `<a class="back-link" href="#/">${icon("back")} 返回首页</a><div class="page-intro compact"><span class="eyebrow">MAKE IT YOURS</span><h1>这次，想了解哪些自己？</h1><p>用真实经历作答。涉及不舒服的关系时，你可以随时跳过。</p></div>${renderAIReadiness()}<p class="muted setup-service-note">你可以先完成本地探索；AI服务可在报告页设置，不影响本地计分。</p><form id="setup-form"><div class="setup-grid"><section class="panel"><h2>你的探索范围</h2><p class="muted">基础部分包含人格、总体依恋、情绪、关系习惯与情境。</p>${[
      ["partner", "恋人关系", "围绕当前恋人作答；没有合适对象可以关闭。"],
      ["friend", "朋友关系", "围绕一位最亲近的朋友作答。"],
      ["family", "家庭／照顾者关系", "围绕同一位主要照顾者；不代表整个家庭。"],
    ]
      .map(([id, title, desc]) => toggle(id, title, desc, true))
      .join(
        "",
      )}<h3 class="subheading">可选的心理健康部分</h3>${toggle("health", "近两周情绪与焦虑筛查", "PHQ-9 + GAD-7，包含自伤念头条目。可随时跳过；无法诊断或排除疾病。", false)}${toggle("trauma", "近一个月创伤相关体验", "PCL-5，围绕严重威胁性事件；无需叙述事件。本项目译文未验证，仅报原始分。", false)}<h3 class="subheading">进度与隐私</h3>${toggle("remember", "在这台设备保存进度", "默认仅存在当前页面内存。开启后会保存在此浏览器，使用共用设备时请慎选。", false)}</section><aside class="setup-summary panel"><span class="eyebrow">YOUR JOURNEY</span><span class="big-number" id="setup-count">142<span>题</span></span><p id="setup-time">预计 30–40 分钟</p><div class="summary-lines"><span>${icon("check")} 分章节完成，随时暂停</span><span>${icon("check")} 结果逐项解释，依据可查</span><span>${icon("check")} 无账号，无广告，无付费解锁</span></div><div class="notice small"><p>本网站适用于 18 岁及以上成人自我探索。中文为项目译文，未完成中国常模、等值性或临床验证；不适用于医疗诊断或选人决策。</p></div><label class="consent"><input type="checkbox" name="adult" required><span>我已满 18 岁，了解本次探索的用途与限制。</span></label><button class="button primary full" type="submit">准备好了，开始 ${icon("arrow")}</button><button class="text-button full" type="button" data-action="import">${icon("upload")} 导入以前的答题备份</button></aside></div></form>`,
  );
}
function toggle(id, title, desc, checked) {
  return `<label class="toggle-row"><span><strong>${title}</strong><small>${desc}</small></span><span class="switch"><input type="checkbox" name="${id}" ${checked ? "checked" : ""}><span></span></span></label>`;
}
function quiz() {
  if (!session) {
    go("/setup");
    return;
  }
  const qs = activeQuestions(session.config);
  session.index = Math.min(Math.max(0, session.index), qs.length - 1);
  const q = qs[session.index],
    m = MODULES.find((m) => m.id === q.module),
    mq = qs.filter((x) => x.module === q.module),
    mi = mq.indexOf(q),
    modules = MODULES.filter((m) => qs.some((q) => q.module === m.id)),
    value = session.answers[q.id];
  const done = qs.filter((q) => validAnswer(q, session.answers[q.id])).length,
    visited = qs.filter((q) => Object.hasOwn(session.answers, q.id)).length;
  shell(
    `<div class="quiz-layout"><aside class="chapter-sidebar"><a href="#/" class="back-link">${icon("back")} 暂停探索</a><h3>你的探索旅程</h3><p class="muted">已回答 ${done} / ${qs.length} 题</p><div class="progress-track"><span style="width:${(visited / qs.length) * 100}%"></span></div><nav aria-label="章节导航">${modules
      .map((mod, i) => {
        const group = qs.filter((x) => x.module === mod.id),
          count = group.filter((q) =>
            validAnswer(q, session.answers[q.id]),
          ).length;
        return `<button class="chapter-button ${mod.id === m.id ? "active" : ""}" data-action="chapter" data-module="${mod.id}"><span class="chapter-check">${count === group.length ? icon("check") : number(i + 1)}</span><span>${mod.name}<small>${count} / ${group.length}</small></span></button>`;
      })
      .join(
        "",
      )}</nav><button class="text-button" data-action="backup">${icon("download")} 下载进度备份</button><p class="caption">${session.config.remember ? "进度已启用本机保存" : "未启用保存，关闭或刷新将丢失进度"}</p></aside><section class="question-area"><div class="question-topline"><span class="eyebrow">CHAPTER ${number(modules.indexOf(m) + 1)} / ${number(modules.length)}</span><span class="badge">${mi + 1} / ${mq.length} 题</span></div><h2 class="chapter-title">${m.name}</h2><p class="question-context">${m.period}</p><div class="question-card"><span class="caption question-source">${m.source}</span><h1 id="question-title">${q.text}</h1>${q.en ? `<details class="english-original"><summary>查看英文原题</summary><p lang="en">${q.en}</p></details>` : ""}<div class="answer-options ${q.type === "attachment" ? "seven-options" : ""}" role="radiogroup" aria-labelledby="question-title">${(
      q.options || OPTIONS[q.type]
    )
      .map((label, i) => {
        const v = i + q.min;
        return `<label class="answer-option ${value === v ? "selected" : ""}"><input type="radio" name="answer" value="${v}" ${value === v ? "checked" : ""}><span class="option-key">${i + 1}</span><span>${label}</span><span class="option-check">${icon("check")}</span></label>`;
      })
      .join(
        "",
      )}</div>${q.id === "phq-9" && value > 0 ? supportPanel() : ""}<div class="question-bottom"><span class="caption">按数字键选择 · Enter 下一题 · 可跳过</span><button class="text-button" data-action="skip">${value === null ? "已跳过 · 继续" : "跳过这题"}</button></div></div><div class="quiz-actions"><button class="button ghost" data-action="prev" ${session.index === 0 ? "disabled" : ""}>${icon("back")} 上一题</button><button class="button primary" data-action="next" ${!validAnswer(q, value) && value !== null ? "disabled" : ""}>${session.index === qs.length - 1 ? "查看答题概况" : "下一题"} ${icon("arrow")}</button></div><div class="session-controls"><span>${session.config.remember ? "已在本机保存进度" : "进度仅在当前页面，刷新会丢失"}</span><button class="text-button" data-action="remember">${session.config.remember ? "关闭本机保存" : "开启本机保存"}</button><button class="text-button" data-action="backup">下载备份</button></div><button class="text-button review-shortcut" data-action="review">查看全部进度／生成已有结果</button></section></div>`,
    { wide: true, quiz: true },
  );
}
function review() {
  if (!session) {
    go("/setup");
    return;
  }
  const qs = activeQuestions(session.config),
    done = qs.filter((q) => validAnswer(q, session.answers[q.id])).length;
  const active = MODULES.filter((m) => qs.some((q) => q.module === m.id));
  shell(
    `<div class="page-intro compact"><span class="eyebrow">TAKE A BREATH</span><h1>回看一下你的探索。</h1><p>已回答 ${done} / ${qs.length} 题。缺少题目的维度会显示“未完成”，不会补成零分。</p></div><div class="review-grid">${active
      .map((m) => {
        const group = qs.filter((q) => q.module === m.id);
        return `<section class="panel"><h3>${m.name}<small>${group.filter((q) => validAnswer(q, session.answers[q.id])).length} / ${group.length}</small></h3><div class="question-dots">${group.map((q) => `<button class="question-dot ${validAnswer(q, session.answers[q.id]) ? "done" : session.answers[q.id] === null ? "skipped" : ""}" data-action="jump" data-id="${q.id}" aria-label="${m.short}第${group.indexOf(q) + 1}题，${validAnswer(q, session.answers[q.id]) ? "已回答" : session.answers[q.id] === null ? "已跳过" : "未回答"}">${group.indexOf(q) + 1}</button>`).join("")}</div></section>`;
      })
      .join(
        "",
      )}</div><div class="review-actions"><button class="button ghost" data-action="resume-missing">${icon("back")} 补充未回答的题目</button><button class="button primary" data-action="finish">查看我的报告与综合分析 ${icon("arrow")}</button></div>`,
  );
}
function supportPanel() {
  return `<aside class="support-panel" role="note"><h3>${icon("heart")} 先照顾此刻的安全</h3><p>你报告过不如死掉或伤害自己的念头，这值得被认真对待；它不等于你一定会采取行动，也不能由总分判断危险程度。</p><p>如果此刻可能伤害自己、已采取行动或难以保证安全，请立即联系当地急救，尽量与可信任的人待在一起。中国大陆可拨 <a href="tel:120">120</a>／<a href="tel:110">110</a>；寻求心理支持可拨 <a href="tel:12356">12356</a>。其他地区请联系当地急救或危机服务。</p><p>即使没有迫在眉睫的危险，也建议尽快与精神科／心理健康专业人员谈谈。<a href="https://www.nhc.gov.cn/xcs/c100122/202412/01fe4c5b70b149cd86ce685893f87adb.shtml" target="_blank" rel="noopener noreferrer">热线来源</a></p></aside>`;
}
function demoSession() {
  const answers = {};
  for (const q of QUESTIONS) {
    let v;
    if (q.module === "personality") {
      const targets = { E: 2, A: 4, C: 4, S: 3, O: 5 };
      v = q.reverse ? 6 - targets[q.dimension] : targets[q.dimension];
    } else if (q.type === "attachment") {
      const target =
        q.dimension === "avoidance"
          ? { general: 3, partner: 3, friend: 2, family: 5 }[q.module]
          : { general: 4, partner: 5, friend: 2, family: 3 }[q.module];
      v = q.reverse ? 8 - target : target;
    } else if (q.type === "trait") {
      const target = {
        regulation: 3,
        rumination: 4,
        compassion: 2,
        worth: 3,
        boundary: 2,
        empathy: 4,
        repair: 3,
        support: 3,
      }[q.dimension];
      v = q.reverse ? 6 - target : target;
    } else if (q.type === "scenario")
      v = [0, 2, 3, 2, 1, 0, 2, 0][Number(q.id.split("-")[1]) - 1];
    else v = 0;
    answers[q.id] = v;
  }
  return {
    version: VERSION,
    answers,
    config: { ...DEFAULT_CONFIG, health: true, trauma: false },
    created: new Date().toISOString(),
    finished: true,
  };
}
function sourceLink(id, label = "依据与限制") {
  return `<a class="evidence-link" href="#/sources/${esc(id)}">${icon("book")}${label}</a>`;
}
function meanLabel(score, max) {
  return score.complete
    ? `${score.mean.toFixed(2)}<small> / ${max}</small>`
    : '<span class="incomplete">未完成</span>';
}
function meter(score, color = "#6d907a") {
  return `<div class="score-track"><span style="width:${score.position ?? 0}%;background:${color}"></span></div>`;
}
function radar(traits) {
  const entries = Object.entries(traits),
    cx = 165,
    cy = 155,
    r = 104;
  const point = (i, f) => {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
    return [cx + Math.cos(a) * r * f, cy + Math.sin(a) * r * f];
  };
  const points = (f) => entries.map((_, i) => point(i, f).join(",")).join(" ");
  return `<svg class="radar" viewBox="0 0 330 320" role="img" aria-label="大五人格维度图，图形表示答题分数相对量尺的位置，不是人群百分位">${[0.25, 0.5, 0.75, 1].map((f) => `<polygon points="${points(f)}" fill="none" stroke="#d9e0d5"/>`).join("")}${entries.map((_, i) => `<line x1="${cx}" y1="${cy}" x2="${point(i, 1)[0]}" y2="${point(i, 1)[1]}" stroke="#d9e0d5"/>`).join("")}<polygon points="${entries.map(([id, d], i) => point(i, d.complete ? d.position / 100 : 0).join(",")).join(" ")}" fill="#7b9b7e" fill-opacity=".22" stroke="#66886c" stroke-width="2"/>${entries
    .map(([id, d], i) => {
      const [x, y] = point(i, 1.22);
      return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" fill="#5b665b" font-size="12">${d.name.split("／")[0]}${d.complete ? "" : "*"}</text>`;
    })
    .join("")}</svg>`;
}
function traitSection(r) {
  return `<section class="report-section" id="report-personality">${sectionTitle("01 / PERSONALITY", "人格的五个切面", "IPIP-50 项目译文 · 显示原始均值和量尺位置，没有中国常模或人群排名。")}<div class="notice small"><p>“更偏某一侧”仅根据量尺中点作描述，不是常模中的高低。每项都可能有适合和不适合的情境。未完成维度在图中标 *，不应解读为零分。</p></div><div class="personality-layout"><div class="panel radar-card">${radar(r.traits)}<span class="caption">图形表示量尺位置 · 不是“人格好坏”</span></div><div class="trait-bars panel">${Object.values(
    r.traits,
  )
    .map(
      (d) =>
        `<div class="trait-bar"><div><strong>${d.name}</strong><span>${meanLabel(d, 5)}</span></div>${meter(d, d.color)}<div class="axis-labels"><span>${d.low}</span><span>${d.high}</span></div></div>`,
    )
    .join("")}</div></div><div class="detail-grid">${Object.values(r.traits)
    .map(
      (d) =>
        `<article class="panel interpretation"><span class="badge">${d.complete ? "10 / 10 题" : `${d.answered} / 10 题`}</span><h3>${d.name}</h3><p>${d.text}</p>${d.complete ? `<h4>可以尝试</h4><p>${d.action}</p>` : ""}${sourceLink("ipip-key")}</article>`,
    )
    .join("")}</div></section>`;
}
function comparisonBlock(r) {
  return r.comparisons.length
    ? `<section class="panel comparison-block"><h3>同一个你，在不同关系中也有不同感受</h3><div class="comparison-table-wrap"><table class="comparison-table"><thead><tr><th>关系对象</th><th>焦虑均值 / 7</th><th>回避均值 / 7</th></tr></thead><tbody>${Object.values(
        r.attachments,
      )
        .filter((d) => d.id !== "general")
        .map(
          (d) =>
            `<tr><th>${MODULES.find((m) => m.id === d.id).short}</th><td>${d.anxiety.complete ? d.anxiety.mean.toFixed(2) : "未完成"}</td><td>${d.avoidance.complete ? d.avoidance.mean.toFixed(2) : "未完成"}</td></tr>`,
        )
        .join(
          "",
        )}</tbody></table></div>${r.comparisons.map((c) => `<p>${c.axis === "anxiety" ? "关系担忧" : "敞开与依靠的回避"}：${c.difference < 0.01 ? "已完成对象的均值相同。" : `在${MODULES.find((m) => m.id === c.high).short}关系中报告的均值较${MODULES.find((m) => m.id === c.low).short}多 ${c.difference.toFixed(2)} 个量尺单位。`}</p>`).join("")}<p class="caption">这里只比较本次原始回答，不能判断差异是否超过测量误差或具有统计意义，也不能推出哪段关系更好、谁导致了这种感受。</p></section>`
    : "";
}
function patternBlock(r) {
  return r.patterns.length
    ? `<h3 class="report-subtitle">把几个切面放在一起看</h3><p class="muted">以下为规则生成、待你核实的联合观察，不是已验证的跨量表结论。</p><div class="detail-grid">${r.patterns.map((p) => `<article class="panel"><h3>${p.title}</h3><p>${p.text}</p><div class="conclusion-evidence">${p.evidence}</div><div class="practice-box"><strong>回到一件真实的事里核实</strong><p>${p.check}</p></div></article>`).join("")}</div>`
    : "";
}
function attachmentSection(r) {
  return `<section class="report-section" id="report-relationships">${sectionTitle("02 / CONNECTION", "你在不同关系中的样子", "ECR-RS 项目译文 · 每段关系分别计算焦虑与回避，不给你固定的依恋类型。")}${comparisonBlock(r)}<div class="relationship-report-grid">${Object.values(
    r.attachments,
  )
    .map(
      (d) =>
        `<article class="panel relationship-result"><div class="result-card-heading"><span class="tile-icon">${icon("heart")}</span><h3>${MODULES.find((m) => m.id === d.id).name}</h3></div><div class="attachment-metrics">${[
          ["anxiety", "依恋焦虑"],
          ["avoidance", "依恋回避"],
        ]
          .map(
            ([id, name]) =>
              `<div><span>${name}</span><strong>${meanLabel(d[id], 7)}</strong>${meter(d[id])}<div class="axis-labels"><span>1 较少</span><span>7 较多</span></div></div>`,
          )
          .join(
            "",
          )}</div><p>${d.text}</p>${d.id === "family" ? '<p class="caption">对象改为一位主要照顾者，只反映该关系；本改编未经验证。</p>' : ""}${d.anxiety.complete && d.avoidance.complete ? `<div class="practice-box"><strong>沟通练习</strong><p>${d.anxiety.mean > 4.25 ? "把反复确认变成具体请求：“我会因为不确定而担心，我们能商量一个彼此做得到的安排吗？”" : d.avoidance.mean > 4.25 ? "在安全的关系中，试着分享一件小困难，并提出一项有限、具体的支持请求。" : "说出一次让你感到被支持的具体行为，并询问对方需要怎样的回应。"}</p></div>` : ""}${sourceLink("ecrrs")}</article>`,
    )
    .join(
      "",
    )}</div><div class="notice"><p>某段关系的分数不同，可能来自经历、安全感、对方行为或当下处境。差异不证明谁有问题；不要由此推断童年创伤、控制欲或对方是否爱你。</p></div>${sectionTitle("DAILY RELATIONSHIP HABITS", "你如何经营关系", "以下为原创探索题，不是已验证的关系能力量表。")}${customCards(r, "relationship")}<h3 class="report-subtitle">八个关键时刻里的你</h3><p class="muted">呈现你选择的第一反应，不评分、不推断疾病。</p><div class="detail-grid">${r.scenarios.length ? r.scenarios.map((s) => `<article class="panel scenario-result"><span class="eyebrow">SCENE ${number(s.index + 1)}</span><h3>${esc(s.pattern)}</h3><p>${s.text}</p><div class="chosen-answer">你的选择：${s.options[s.answer]}</div><p>${s.reflect}</p></article>`).join("") : '<p class="empty-copy">尚未回答情境题，因此暂不作情境解释。</p>'}</div></section>`;
}
function customCards(r, section) {
  return `<div class="detail-grid">${Object.values(r.custom)
    .filter((d) => d.section === section)
    .map(
      (d) =>
        `<article class="panel interpretation"><div class="result-card-heading"><h3>${d.name}</h3><strong>${meanLabel(d, 5)}</strong></div>${meter(d, d.id === "rumination" ? "#bc9b77" : "#72927c")}<span class="caption">原创探索 · ${d.answered} / ${d.total} 题 · 未经验证</span><p>${d.text}</p>${d.complete ? `<h4>可能值得表达的需要</h4><p>${d.need} 这只是一个待你核实的方向。</p><div class="practice-box"><strong>一个小练习</strong><p>${d.practice}</p></div>` : ""}${sourceLink(d.source, "主题参考，不代表题目效度")}</article>`,
    )
    .join("")}</div>`;
}
function healthSection(r) {
  return `<section class="report-section" id="report-health">${sectionTitle("04 / WELLBEING", "看见近期状态，找到支持方向", "症状与人格分开理解。分数不能证明患病，也不能排除疾病。")}${r.safety ? supportPanel() : ""}<div class="notice"><p>PHQ-9／GAD-7 显示的是原版文献的分数区间参考；本项目中文译文未经临床验证，区间不能视为你的临床严重程度。PCL-5 不套用诊断阈值。持续困扰、功能受损或你自己担心时，都可以寻求专业评估，不必等到分数变高。</p></div><div class="screen-grid">${[
    "phq",
    "gad",
    "pcl",
  ]
    .map((id) => {
      const s = r.screens[id],
        names = {
          phq: "PHQ-9 · 抑郁相关症状",
          gad: "GAD-7 · 焦虑相关症状",
          pcl: "PCL-5 · 创伤相关体验",
        },
        max = { phq: 27, gad: 21, pcl: 80 };
      return `<article class="panel screen-card"><h3>${names[id]}</h3><span class="caption">${id === "pcl" ? "过去一个月" : "过去两周"} · 项目译文</span><div class="screen-number">${s?.complete ? s.sum : "—"}<small> / ${max[id]}</small></div><strong>${!s ? "未选择本章" : s.band}</strong><p>${!s ? "没有施测，无法据此评价该领域。" : !s.complete ? "存在缺失题目，不计算总分，也不按比例补齐。" : id === "pcl" ? "原始分需要结合事件性质、时间、功能受损及专业访谈理解。本结果不能判断你是否患有 PTSD。" : s.sum >= 10 ? "原版参考区间提示应关注，建议带上这些回答，预约精神科或合格心理健康专业人员进一步评估。" : "当前自报条目频率较少或较低；这不代表没有困难，也不能排除其他心理或身体问题。"}</p>${sourceLink(id === "pcl" ? "pcl" : "phq-manual")}</article>`;
    })
    .join(
      "",
    )}</div><section class="panel broader-support"><h3>其他困扰，也值得被认真对待</h3><p>本测试不覆盖全部心理疾病，不会根据人格、依恋或情境题给出下列疾病标签。这些方向需要独立的专业评估。</p><div class="condition-grid">${[
    [
      "bipolar",
      "持续的异常兴奋／易怒与精力变化",
      "如果睡眠需求明显减少、活动或冒险行为持续异常增加，请告诉医生完整的发作过程。",
    ],
    [
      "adhd",
      "长期注意力或冲动困难",
      "需要结合童年史、多个生活场景和功能受损，也要考虑睡眠、焦虑或其他原因。",
    ],
    [
      "ocd",
      "反复侵入的想法和难以停止的行为",
      "如果耗时、痛苦或影响生活，可以寻求强迫相关评估；喜欢整洁不等于强迫症。",
    ],
    [
      "bpd",
      "持续痛苦的人际与自我体验",
      "关系不安不等于人格障碍，专业评估需结合持续模式、背景与功能影响。",
    ],
    [
      "eating",
      "进食、体重与身体形象困扰",
      "明显限制进食、反复暴食或补偿行为值得尽早评估；出现身体不适应及时就医。",
    ],
    [
      "psychosis",
      "现实感、知觉或思维的明显变化",
      "若出现别人没有的声音／影像、难以辨别现实或明显混乱，应及时寻求专业帮助；有危险时联系急救。",
    ],
  ]
    .map(
      ([id, title, text]) =>
        `<div><h4>${title}</h4><p>${text}</p>${sourceLink(id, "机构资料")}</div>`,
    )
    .join("")}</div></section></section>`;
}
function actionSection(r) {
  return `<section class="report-section" id="report-actions">${sectionTitle("05 / SMALL STEPS", "把理解，变成一点小改变。", "从已完成的原创探索维度中挑选三个练习方向；不是治疗方案，也不是经过验证的优先级算法。")}<div class="action-grid">${r.practice.length ? r.practice.map((p, i) => `<article class="panel action-card"><span class="action-no">${number(i + 1)}</span><span class="eyebrow">${["今天 · 留意", "这一周 · 尝试", "两周后 · 回看"][i]}</span><h3>${p.title}</h3><p>${p.text}</p><div class="practice-box"><p>${["记下一次具体经历：发生了什么，你怎样理解，又做了什么。", "尝试后观察：它是否适合你的真实处境？如果不适合，可以调整。", "比较生活中的变化；重复做题的熟悉感也会改变分数，不把变化当成治疗效果。"][i]}</p></div></article>`).join("") : '<div class="panel"><p>原创维度尚未完成。你可以先记录一个真实情境，再补充相关题目；暂不自动挑选练习。</p></div>'}</div><div class="notice"><p>如果关系中存在暴力、威胁、胁迫或持续侵犯边界，优先寻求安全支持，不要把问题解释成你“不够会沟通”。</p></div><section class="panel"><h3>带着这些问题，继续了解自己</h3><p>哪一项符合你，哪一项没有？你的行为在什么情境下会改变？有没有你信任的人能提供一个不同视角？这些反例和背景，比一个漂亮的标签更有帮助。</p></section></section>`;
}
function report() {
  if (!demo && !session) {
    shell(
      `<div class="empty-state"><span class="tile-icon">${icon("chart")}</span><h1>你的地图，还等你落下第一笔。</h1><p>完成探索后，这里会生成分项解读。也可以先看看示例报告。</p><a class="button primary" href="#/setup">开始探索 ${icon("arrow")}</a><button class="button ghost" data-action="demo">查看示例报告</button></div>`,
    );
    return;
  }
  const s = demo ? demoSession() : session,
    r = assess(s.answers, s.config),
    tab = route().split("/")[2] || "synthesis";
  const titles = {
    synthesis: "AI 综合分析",
    overview: "本地总览",
    personality: "人格底色",
    relationships: "亲密关系",
    emotion: "自我与情绪",
    health: "心理健康",
    actions: "行动建议",
  };
  const qs = activeQuestions(s.config),
    done = qs.filter((q) => validAnswer(q, s.answers[q.id])).length;
  const overview = `<section class="report-section" id="report-overview"><div class="report-summary"><div><span class="eyebrow">A MAP, NOT A LABEL</span><h2>你如何看待自己，<br>也如何走向别人。</h2><p>以下从已完成的维度生成。每条都是基于本次回答的描述，不是关于你全部人生的结论。</p></div><div class="completion-orbit"><strong>${done}<small> / ${qs.length}</small></strong><span>题已回答</span></div></div>${r.quality.map((t) => `<div class="notice"><p>${t}</p></div>`).join("")}<div class="overview-grid">${r.conclusions.length ? r.conclusions.map((c, i) => `<article class="panel conclusion"><span class="eyebrow">OBSERVATION ${number(i + 1)}</span><h3>${c.title}</h3><p>${c.text}</p><div class="conclusion-evidence">${c.evidence}</div>${sourceLink(c.source)}</article>`).join("") : '<div class="panel"><h3>目前还没有完整维度</h3><p>部分题目的回答不足以生成完整结论。请先完成一个维度。</p></div>'}</div><div class="notice"><p>${r.limits}</p></div>${patternBlock(r)}<a href="#/report/personality" class="button ghost">逐项查看我的结果 ${icon("arrow")}</a></section>`;
  const sections = {
    synthesis: renderAIPanel(s, demo),
    overview,
    personality: traitSection(r),
    relationships: attachmentSection(r),
    emotion: `<section class="report-section" id="report-emotion">${sectionTitle("03 / INNER WORLD", "你与自己的关系", "原创探索题的均值，只帮助你观察体验；并非临床量表，也没有正常／异常分界。")}${customCards(r, "emotion")}</section>`,
    health: healthSection(r),
    actions: actionSection(r),
  };
  shell(
    `${demo ? '<div class="demo-banner">' + icon("info") + '这是虚构数据的示例报告，不是你的测评结果。<button data-action="leave-demo">' + (session ? "返回我的结果" : "开始我的探索") + "</button></div>" : ""}<div class="report-header"><div><span class="eyebrow">YOUR INNER ATLAS</span><h1>${demo ? "一份示例内在地图" : "你的内在地图"}</h1><p>版本 ${VERSION} · ${done} / ${qs.length} 题已答 · ${demo ? "虚构示例" : new Date(s.created).toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" })}</p></div><div class="report-tools"><button class="button ghost small" data-action="export-report">${icon("download")} 导出报告</button><button class="icon-button" data-action="print" aria-label="打印或另存为 PDF">${icon("print")}</button>${!demo ? '<button class="icon-button" data-action="review" aria-label="修改回答">' + icon("grid") + "</button>" : ""}</div></div>${r.safety && tab !== "health" ? supportPanel() : ""}<nav class="report-tabs" aria-label="报告章节">${Object.entries(
      titles,
    )
      .map(
        ([id, title]) =>
          `<a href="#/report/${id}" ${tab === id ? 'aria-current="page"' : ""} class="${tab === id ? "active" : ""}">${title}</a>`,
      )
      .join("")}</nav><div class="report-panels">${Object.entries(sections)
      .map(
        ([id, html]) =>
          `<div class="report-tab-panel ${tab === id ? "shown" : ""}" data-tab="${id}">${html}</div>`,
      )
      .join(
        "",
      )}</div><div class="report-end"><p>一个分数无法概括你；你也可以对这份报告保留不同意见。</p><a href="#/sources">了解计分与解释的边界 ${icon("arrow")}</a></div>`,
    { wide: true },
  );
}
function sources() {
  const selected = route().split("/")[2];
  const rows = SOURCES.filter(
    (s) => sourceFilter === "全部" || s.group === sourceFilter,
  );
  shell(
    `<div class="page-intro compact"><span class="eyebrow">THE EVIDENCE LIBRARY</span><h1>每一项解读，都有来处和边界。</h1><p>核验 32 条来源记录，部分属于同一套工具。优先开发者、原始研究、公开教材和公共卫生机构；3 本书仅查阅公开目录或简介。</p></div><div class="evidence-principles"><article class="panel"><span class="badge">01 / 保留</span><h3>能追溯的工具与计分</h3><p>保留题目出处、反向题、时间窗口和分量表。开放使用许可与测量有效性分别核验。</p></article><article class="panel"><span class="badge">02 / 去重</span><h3>不靠堆题制造“全面”</h3><p>ECR-R、DASS 等与现有模块重复，因此没有叠加。HEXACO 的公开施测条件不适合直接复制。</p></article><article class="panel"><span class="badge">03 / 不夸大</span><h3>有理论，不等于题目已验证</h3><p>原创题只做探索；项目译文未经等值性和临床检验。书籍目录用于组织主题，不冒充全文阅读。</p></article></div><div class="methodology panel"><h2>结果怎样算出来？</h2><div class="method-grid"><div><h4>IPIP-50</h4><p>每维度 10 题，1–5 计分。反向题用 6−答案，取完整维度均值。情绪稳定性按正向稳定性解释，不当作疾病指标。</p></div><div><h4>ECR-RS</h4><p>每个对象 9 题，1–7 计分。回避 = 前 6 题均值，其中 1–4 反向为 8−答案；焦虑 = 后 3 题均值。不跨关系合成一个类型。</p></div><div><h4>原创探索与情境</h4><p>8 个维度各 6 题；反向后取均值，无临床阈值。8 个情境仅复述选择并给反思提示，不给人格或疾病分数。</p></div><div><h4>健康与缺失值</h4><p>PHQ-9：0–27；GAD-7：0–21；PCL-5：0–80。任何分量表缺题都不算总分；跳过不等于零。自伤条目单独提示支持。</p></div></div><p class="caption">百分比条只是（均值−量尺下限）÷量尺跨度，不是百分位、患病概率或准确率。展示两位小数是计分格式，不代表测量精度。描述分界（如 2.75／3.25）为界面启发式，不是常模。</p><a href="./docs/RESEARCH.md" target="_blank" rel="noopener">阅读研究取舍记录</a><a href="./docs/INSTRUMENTS.md" target="_blank" rel="noopener">译文、授权与版本说明</a></div><div class="source-filters" aria-label="来源类别">${["全部", ...new Set(SOURCES.map((s) => s.group))].map((g) => `<button data-action="source-filter" data-filter="${g}" class="chip ${g === sourceFilter ? "active" : ""}">${g}</button>`).join("")}</div><div class="source-list">${rows.map((s, i) => `<article class="source-row ${s.id === selected ? "highlighted" : ""}" id="source-${s.id}"><span class="source-index">${number(SOURCES.indexOf(s) + 1)}</span><div><span class="caption">${s.group} · ${s.decision}</span><h3><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${s.title} ↗</a></h3><p>${s.note}</p><span class="caption">访问范围：${s.access} · 查核：2026-11-15</span></div></article>`).join("")}</div><div class="notice"><p>未采用网络“暗黑心理学”、读心术、面相或笔迹推断、以单一类型决定一生的解释，也不把社交媒体人格标签当作疾病诊断。</p></div>`,
  );
  if (selected)
    setTimeout(
      () =>
        document
          .getElementById("source-" + selected)
          ?.scrollIntoView({ block: "center" }),
      30,
    );
}
function privacy() {
  shell(
    `<div class="page-intro compact"><span class="eyebrow">YOUR ANSWERS ARE YOURS</span><h1>关于你的数据，清清楚楚。</h1><p>本地计分无需联网提交；DeepSeek 综合分析由你主动开启并确认发送范围。无广告和第三方统计脚本。</p></div><div class="privacy-grid"><section class="panel"><h2>${icon("lock")} 答案放在哪里？</h2><p>默认只存在当前页面的内存中，刷新或关闭后会丢失。只有勾选“在这台设备保存进度”，答题与设置才会写入浏览器 localStorage。</p><p>这不是加密保险箱。同一浏览器的使用者、同源的其他网站项目、能读取设备的程序或浏览器扩展可能访问它；共用设备建议关闭保存，并在结束后清除。</p><h3>什么会经过网络？</h3><p>GitHub Pages 提供网站文件，可能记录普通访问日志，例如 IP 地址；普通本地计分不会上传答案。点击“生成 AI 综合分析”并授权后，选定范围的回答与背景会发送给你设置的分析服务，再由它调用 DeepSeek 官方 API。健康部分需要额外勾选才发送。点击来源链接会访问相应外部网站。</p><h3>报告怎么生成？</h3><p>量表分数由固定规则计算；AI 综合报告由 DeepSeek 结合整份答卷、背景、提示词和策划知识库生成。后端检查引用是否存在及报告结构，但不能保证每条解释准确。每次发送前可展开查看全部请求资料。</p></section><section class="panel"><h2>由你控制</h2><p>答题备份 JSON 含原始回答和设置；AI报告、普通报告和打印件均可能含敏感结果。AI背景、报告与分析口令只保存在当前页面内存，不写入本机答题备份。后端不主动保存正文；托管商与DeepSeek仍可能按各自政策处理请求，不能由本网站承诺零留存。下载副本由你自行管理。</p><div class="privacy-actions"><button class="button ghost" data-action="backup">${icon("download")} 下载当前答题备份</button><button class="button ghost" data-action="import">${icon("upload")} 导入备份</button><button class="button danger" data-action="erase">清除当前页面与已保存的答题数据</button></div><p class="caption">清除不会删除你已经下载的文件或打印件。你需要在设备中自行删除这些副本。</p><h3>用途与版本</h3><p>适用 18 岁及以上成人自我探索。此版本未经临床验证，不用于诊断、治疗、人员招聘、司法或其他高风险决策。</p><a href="#/sources">阅读完整依据与限制 ${icon("arrow")}</a></section></div>`,
  );
}
function render() {
  const path = route();
  if (path === "/") home();
  else if (path === "/modules") modules();
  else if (path === "/setup") setup();
  else if (path === "/quiz") quiz();
  else if (path === "/review") review();
  else if (path.startsWith("/report")) report();
  else if (path.startsWith("/sources")) sources();
  else if (path === "/privacy") privacy();
  else home();
  document.title =
    (route().startsWith("/report")
      ? "我的内在地图"
      : route() === "/quiz"
        ? "探索进行中"
        : "见己") + " · 见己 INNER ATLAS";
}
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function backup() {
  if (!session) {
    toast("当前没有答题进度。");
    return;
  }
  download(
    "见己-私密答题备份.json",
    JSON.stringify(session, null, 2),
    "application/json",
  );
  toast("已下载含原始回答的备份，请妥善保存。");
}
function markdownReport() {
  const s = demo ? demoSession() : session;
  if (!s) return;
  const r = assess(s.answers, s.config),
    lines = [
      `# 见己 · ${demo ? "虚构示例报告（不是你的结果）" : "我的内在地图"}`,
      `版本 ${VERSION}`,
      r.limits,
      "",
    ];
  const ai = currentAIResult(s, demo);
  if (ai) lines.push(aiReportMarkdown(ai), "---", "## 本地计分附录");
  if (r.safety)
    lines.push(
      "## 此刻的安全",
      "你报告有过死亡或自伤念头，建议尽快联系专业支持。若此刻无法保证安全，立即联系急救与可信任的人。中国大陆120／110；心理援助12356；其他地区联系当地急救或危机服务。",
      "",
    );
  lines.push("## 人格底色");
  for (const d of Object.values(r.traits))
    lines.push(
      `### ${d.name}`,
      d.complete
        ? `均值 ${d.mean.toFixed(2)} / 5`
        : `未完成：${d.answered}/${d.total}`,
      d.text,
      d.complete ? `练习：${d.action}` : "",
      "",
    );
  lines.push("## 亲密关系");
  for (const d of Object.values(r.attachments))
    lines.push(
      `### ${MODULES.find((m) => m.id === d.id).name}`,
      `焦虑：${d.anxiety.complete ? d.anxiety.mean.toFixed(2) + " / 7" : "未完成"}；回避：${d.avoidance.complete ? d.avoidance.mean.toFixed(2) + " / 7" : "未完成"}`,
      d.text,
      "",
    );
  lines.push("## 联合观察（待核实，不代表因果）");
  for (const p of r.patterns) lines.push(p.title, p.text, p.evidence, p.check);
  lines.push("## 原创探索（未经量表验证）");
  for (const d of Object.values(r.custom))
    lines.push(
      `### ${d.name}`,
      d.complete ? `均值 ${d.mean.toFixed(2)} / 5` : "未完成",
      d.text,
      d.complete ? `练习：${d.practice}` : "",
      "",
    );
  lines.push("## 情境反思");
  for (const s of r.scenarios)
    lines.push(s.text, `选择：${s.options[s.answer]}`, s.reflect, "");
  lines.push(
    "## 可选健康部分（不是诊断）",
    "PHQ-9/GAD-7所列区间来自原版文献，不能视为本项目译文的临床严重程度。",
  );
  for (const id of ["phq", "gad", "pcl"]) {
    const d = r.screens[id];
    lines.push(
      `${id.toUpperCase()}: ${!d ? "未选择" : !d.complete ? "未完成" : d.sum + "；" + d.band}`,
    );
  }
  lines.push(
    "## 小步练习",
    ...r.practice.map((p) => p.title + "：" + p.text),
    "## 作答提醒",
    ...r.quality,
    "## 研究依据",
    ...SOURCES.map((s) => `- [${s.title}](${s.url})：${s.note}`),
  );
  download(
    `见己-${demo ? "示例" : "私密"}探索报告.md`,
    lines.join("\n\n"),
    "text/markdown;charset=utf-8",
  );
  toast("报告已下载；文件包含敏感结果，请妥善保存。");
}
function dialog(title, body, onConfirm, label = "确认") {
  const el = document.createElement("dialog");
  el.className = "modal";
  el.innerHTML = `<form method="dialog"><button class="modal-close icon-button" value="cancel" aria-label="关闭">${icon("close")}</button><span class="tile-icon">${icon("info")}</span><h2>${title}</h2><div class="modal-body">${body}</div><div class="modal-actions"><button class="button ghost" value="cancel">返回</button><button class="button primary" value="confirm">${label}</button></div></form>`;
  document.body.append(el);
  el.addEventListener("close", () => {
    if (el.returnValue === "confirm") onConfirm?.();
    el.remove();
  });
  el.showModal();
}
function navigateNext() {
  if (!session) return;
  const qs = activeQuestions(session.config),
    q = qs[session.index];
  if (!validAnswer(q, session.answers[q.id]) && session.answers[q.id] !== null)
    return;
  if (session.index < qs.length - 1) {
    session.index++;
    persist();
    render();
    window.scrollTo(0, 0);
  } else {
    persist();
    go("/review");
  }
}
document.addEventListener("click", (e) => {
  if (e.target.closest('.nav-link[href="#/report"]')) {
    demo = false;
    if (route() === "/report") render();
  }
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const a = btn.dataset.action;
  if (a === "demo") {
    demo = true;
    go("/report/synthesis");
  } else if (a === "leave-demo") {
    demo = false;
    go(session ? "/report/synthesis" : "/setup");
  } else if (a === "source-filter") {
    sourceFilter = btn.dataset.filter;
    render();
  } else if (a === "help") {
    dialog("你不必独自撑住。", supportPanel(), null, "我知道了");
  } else if (a === "remember" && session) {
    session.config.remember = !session.config.remember;
    persist();
    render();
    toast(
      session.config.remember
        ? "已开启本机保存。共用设备结束后可在隐私页清除。"
        : "已关闭本机保存并删除浏览器中的副本，当前页面仍保留进度。",
    );
  } else if (a === "backup") backup();
  else if (a === "export-report") markdownReport();
  else if (a === "print") {
    toast("打印包含完整报告各章节；请注意文件隐私。");
    window.print();
  } else if (a === "import") document.querySelector("#import-file").click();
  else if (a === "erase")
    dialog(
      "清除答题数据？",
      "<p>将删除当前页面与这个浏览器中本网站保存的回答、报告进度和设置。已下载的文件需要你自行删除。</p>",
      () => {
        clearAIState();
        session = null;
        demo = false;
        try {
          localStorage.removeItem(KEY);
        } catch {}
        go("/");
        toast("当前页面与本机保存的答题数据已清除。");
      },
      "清除数据",
    );
  else if (a === "prev" && session) {
    session.index = Math.max(0, session.index - 1);
    persist();
    render();
  } else if (a === "next") navigateNext();
  else if (a === "skip" && session) {
    const q = activeQuestions(session.config)[session.index];
    session.answers[q.id] = null;
    navigateNext();
  } else if (a === "chapter" && session) {
    session.index = activeQuestions(session.config).findIndex(
      (q) => q.module === btn.dataset.module,
    );
    persist();
    render();
    window.scrollTo(0, 0);
  } else if (a === "review") {
    demo = false;
    go("/review");
  } else if (a === "jump" && session) {
    session.index = activeQuestions(session.config).findIndex(
      (q) => q.id === btn.dataset.id,
    );
    go("/quiz");
  } else if (a === "resume-missing" && session) {
    const qs = activeQuestions(session.config),
      idx = qs.findIndex((q) => !validAnswer(q, session.answers[q.id]));
    session.index = idx < 0 ? 0 : idx;
    go("/quiz");
  } else if (a === "finish" && session) {
    session.finished = true;
    persist();
    demo = false;
    go("/report/synthesis");
  }
});
document.addEventListener("change", async (e) => {
  if (e.target.name === "answer" && session) {
    const q = activeQuestions(session.config)[session.index];
    session.answers[q.id] = Number(e.target.value);
    persist();
    const focused = e.target.value;
    render();
    document
      .querySelector(`input[name="answer"][value="${focused}"]`)
      ?.focus({ preventScroll: true });
  }
  if (e.target.closest("#setup-form")) {
    const form = document.querySelector("#setup-form"),
      cfg = Object.fromEntries(
        Object.keys(DEFAULT_CONFIG).map((k) => [k, form.elements[k].checked]),
      );
    const count = activeQuestions(cfg).length;
    document.querySelector("#setup-count").innerHTML =
      count + "<span>题</span>";
    document.querySelector("#setup-time").textContent =
      `预计 ${Math.round(count * 0.2)}–${Math.round(count * 0.28)} 分钟`;
  }
  if (e.target.id === "import-file") {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 150000) {
      toast("文件过大，请选择本网站导出的 JSON 备份。");
      return;
    }
    try {
      const next = validateSession(JSON.parse(await file.text()));
      dialog(
        "导入答题备份？",
        "<p>将替换当前页面中的答题进度。导入文件可能含敏感回答；保存方式沿用文件中的本机保存设置。建议先下载当前进度。</p>",
        () => {
          clearAIState();
          session = next;
          demo = false;
          persist();
          go(session.finished ? "/report/synthesis" : "/quiz");
          toast("已导入答题备份。");
        },
        "导入并替换",
      );
    } catch (error) {
      toast(error.message || "文件无法读取，未导入。");
    }
    e.target.value = "";
  }
});
document.addEventListener("submit", (e) => {
  if (e.target.id !== "setup-form") return;
  e.preventDefault();
  const form = e.target;
  if (!form.reportValidity()) return;
  const config = Object.fromEntries(
    Object.keys(DEFAULT_CONFIG).map((k) => [k, form.elements[k].checked]),
  );
  const start = () => {
    clearAIState();
    session = {
      version: VERSION,
      config,
      answers: {},
      index: 0,
      finished: false,
      created: new Date().toISOString(),
    };
    demo = false;
    persist();
    go("/quiz");
  };
  if (session && Object.keys(session.answers).length)
    dialog(
      "开始一次新的探索？",
      "<p>这会替换当前答题进度。若想保留此前的回答，请先从隐私页面下载备份。</p>",
      start,
      "开始新探索",
    );
  else start();
});
document.addEventListener("keydown", (e) => {
  if (
    route() !== "/quiz" ||
    !session ||
    document.querySelector("dialog[open]") ||
    e.ctrlKey ||
    e.metaKey ||
    e.altKey
  )
    return;
  const q = activeQuestions(session.config)[session.index];
  if (/^[1-7]$/.test(e.key)) {
    const value = Number(e.key) - 1 + q.min;
    if (validAnswer(q, value)) {
      e.preventDefault();
      session.answers[q.id] = value;
      persist();
      render();
      document
        .querySelector(`input[name="answer"][value="${value}"]`)
        ?.focus({ preventScroll: true });
    }
  } else if (e.key === "Enter" && !e.target.closest("button,a")) {
    e.preventDefault();
    navigateNext();
  }
});
window.addEventListener("hashchange", () => {
  render();
  window.scrollTo(0, 0);
  document.querySelector("#main")?.focus({ preventScroll: true });
});
configureAI({
  getSession: () => session,
  isDemo: () => demo,
  render,
  toast,
  download,
});
render();

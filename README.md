# 世界级 UI 画廊 · UI Gallery

> 230 个主流 UI 组件库 / 设计系统 + 世界级获奖网站的策展式画廊。每一项都附带**可被 AI 逐帧复现的高保真提示词**——复制提示词丢给任意 AI，就能重建出首屏一致、动画一致的页面。
>
> A curated gallery of 230 mainstream UI component libraries / design systems + world-class award-winning websites. Every entry ships a **high-fidelity prompt that AI can reproduce frame-by-frame** — paste it into any AI and it rebuilds a page whose above-the-fold and animations match the original.

[![items](https://img.shields.io/badge/收录-230%20项-blue)](https://wangkeyu-u.github.io/ui-gallery/preview-gallery.html)
[![items-en](https://img.shields.io/badge/entries-230-blue)](https://wangkeyu-u.github.io/ui-gallery/preview-gallery.html)
[![verified](https://img.shields.io/badge/AI%20复现通过-194%2F204-brightgreen)](https://wangkeyu-u.github.io/ui-gallery/preview-gallery.html)
[![verified-en](https://img.shields.io/badge/AI%20repro-passed-194%2F204-brightgreen)](https://wangkeyu-u.github.io/ui-gallery/preview-gallery.html)
[![anim](https://img.shields.io/badge/动画还原-191%2F194-ff69b4)](https://wangkeyu-u.github.io/ui-gallery/preview-gallery.html)
[![anim-en](https://img.shields.io/badge/animations-restored-191%2F194-ff69b4)](https://wangkeyu-u.github.io/ui-gallery/preview-gallery.html)
[![offline](https://img.shields.io/badge/离线自包含-零外部调用-lightgrey)](https://wangkeyu-u.github.io/ui-gallery/preview-gallery.html)
[![offline-en](https://img.shields.io/badge/offline-self--contained-lightgrey)](https://wangkeyu-u.github.io/ui-gallery/preview-gallery.html)
[![pages](https://img.shields.io/badge/GitHub%20Pages-已部署-orange)](https://wangkeyu-u.github.io/ui-gallery/preview-gallery.html)
[![pages-en](https://img.shields.io/badge/GitHub%20Pages-deployed-orange)](https://wangkeyu-u.github.io/ui-gallery/preview-gallery.html)

---

## 目录 / Table of Contents

- [项目简介 / Project Overview](#项目简介--project-overview)
- [核心特性 / Key Features](#核心特性--key-features)
- [在线预览 / Live Preview](#在线预览--live-preview)
- [整体架构 / Architecture](#整体架构--architecture)
- [项目结构 / Project Structure](#项目结构--project-structure)
- [数据集 / The Dataset](#数据集--the-dataset)
- [AI 高保真复现验证（项目灵魂）/ AI High-Fidelity Reproduction Verification](#ai-高保真复现验证项目灵魂--ai-high-fidelity-reproduction-verification)
  - [1. 提示词是怎么炼成的 / How prompts are forged](#1-提示词是怎么炼成的--how-prompts-are-forged)
  - [2. 验证闭环 / The verification loop](#2-验证闭环--the-verification-loop)
  - [3. 结果聚合 / Result aggregation](#3-结果聚合--result-aggregation)
- [使用指南 / Usage Guide](#使用指南--usage-guide)
- [验证结果 / Verification Results](#验证结果--verification-results)
- [脚本参考 / Script Reference](#脚本参考--script-reference)
- [如何扩展数据集 / How to extend the dataset](#如何扩展数据集--how-to-extend-the-dataset)
- [本地源码浏览器（hub）/ Local source browser (hub)](#本地源码浏览器hub--local-source-browser-hub)
- [说明与限制 / Notes & Limitations](#说明与限制--notes--limitations)
- [相关链接 / Links](#相关链接--links)

---

## 项目简介 / Project Overview

这个项目把「浏览优秀 UI」和「用 AI 重建优秀 UI」两件事合在了一起：

This project combines two things — *browsing great UI* and *rebuilding great UI with AI*:

1. **画廊 / Gallery**：230 个站点的策展式浏览，分区、框架/主题筛选、点选收藏、一键复制。完全自包含，双击 `preview-gallery.html` 即用，运行时零外部 CDN / API 调用。
   A curated browse of 230 sites with sections, framework/theme filters, selection, and one-click copy. Fully self-contained — double-click `preview-gallery.html` to use; zero external CDN / API calls at runtime.
2. **高保真提示词 / High-fidelity prompts**：每个站点都生成了一份**混合提示词**——自然语言首屏描述 + 站点**真实的动画代码**（`@keyframes`、transition 缓动/时长、动画库名）。提示词里还叠加了从社区扒来的「高质量 UI 生成提示词」技巧。
   Each site gets a **hybrid prompt** — a natural-language above-the-fold description plus the site's **real animation code** (`@keyframes`, transition easing/duration, animation-library names). Community "high-quality UI prompt" techniques are layered in as well.
3. **AI 实机验证 / AI verification**：用 AI agent 把提示词重新生成单文件 HTML，与原始预览图逐帧对比，最多迭代 3 次，确认「首屏一致 + 动画一致」才标为通过。
   An AI agent regenerates the prompt into a single-file HTML, compares it frame-by-frame against the original preview, and iterates up to 3 times until "above-the-fold matches + animations match" before marking it passed.

一句话：**这是一个让 AI 能学会「抄」顶级 UI 的提示词库 + 验证体系。**
In one line: **it's a prompt library + verification system that teaches AI to "copy" top-tier UI.**

---

## 核心特性 / Key Features

- **离线自包含 / Offline & self-contained** — 画廊 HTML 内嵌数据 JSON，预览图放本地 `previews/`，无需服务器、无需联网。The gallery HTML embeds the data JSON; preview images live in local `previews/`; no server, no network needed.
- **暗色高级风 UI / Dark premium UI** — 近黑背景 `#1b1b1f` + 径向渐变、金色 `#D4AF37` 强调、SF Pro 字体；卡片画框、毛玻璃 sticky 控制栏、滚动淡入上滑动效（缓动 `cubic-bezier(0.4,0,0.6,1)`）。Near-black `#1b1b1f` radial-gradient background, gold `#D4AF37` accent, SF Pro type; framed cards, frosted sticky controls, fade-and-rise scroll reveals (Apple easing).
- **画廊自身即用生成提示词改造 / The gallery eats its own dog food** — 本画廊的 UI 正是用其中一份获奖站高保真提示词（`awd-apple`）驱动重设计的。The gallery's own UI was restyled using one of its generated high-fidelity prompts (`awd-apple`).
- **分区浏览 / Sectioned browsing** — 组件库（177）与获奖项目（53）分块独立区域，默认全量摊开，纯滚动查看。Component libraries (177) and award projects (53) in separate areas, fully expanded by default, pure scroll.
- **多维筛选 / Multi-dimensional filters** — 类型切换（全部 / 组件库 / 获奖项目）、框架下拉、主题下拉，均显示各组卡片数量。Type switch (all / libraries / awards), framework dropdown, theme dropdown — each shows per-group card counts.
- **点选 + 持久化 / Select & persist** — 点击卡片选中（高亮 + ✓），选择存 localStorage，刷新不丢；右下角浮标显示已选数量。Click to select (highlight + ✓); selection persists in localStorage; bottom-right badge shows count.
- **复制提示词 / Copy prompt** — 每张卡片一键复制该站点高保真提示词，可直接丢给任意 AI UI 生成器。One click copies that site's high-fidelity prompt, ready to hand to any AI UI generator.
- **验证徽章 / Verification badges** — 每张卡片显示 AI 复现状态——`✓ 复现通过` / `✦ 动画还原` / `✕ 未复现` / `· 待验证`。Each card shows AI reproduction status — `✓ reproduced` / `✦ animation restored` / `✕ failed` / `· pending`.
- **动画感知 / Animation-aware** — 提示词直接包含站点真实动画规格，AI 生成结果经视觉对比核验动画一致。Prompts embed the site's real animation spec; generated results are visually checked for animation parity.

---

## 在线预览 / Live Preview

> **GitHub Pages**：<https://wangkeyu-u.github.io/ui-gallery/preview-gallery.html>
>
> 也可直接克隆后用浏览器打开本地 `preview-gallery.html`（推荐 Chrome / Edge）。
> Or clone and open local `preview-gallery.html` directly (Chrome / Edge recommended).

---

## 整体架构 / Architecture

```
                         ┌─────────────────────────────────────────┐
   真实站点 / 获奖源码     │           数据集与提示词管线             │
   (url / source/)        │           Dataset & prompt pipeline      │
          │               │                                         │
          ▼               │  build-dataset.js                       │
   ┌────────────┐         │   └─ 66 旧库 + 新增库 + 获奖项目         │
   │ 读取器      │         │       └─► preview-data.json (230 项)    │
   │ repro-read │────────►│  repro-read2.js (动画感知)               │
   │ repro-read2│  anim.json        └─► 提取真实 @keyframes/transition│
   └────────────┘         │                                         │
          │               │  assemble-hifi.js                        │
          │               │   UNIVERSAL + 站点NL + 动画附录          │
          │               │   + web-prompts.md(WEB_EXTRA)            │
          │               │       └─► repro/<id>/prompt.hifi.md      │
          │               │                                         │
          │               │  merge-hifi.js ─► 写回 preview-data.json │
          ▼               └─────────────────────────────────────────┘
   previews/<id>.png                            │
          ▲                              gen-gallery.js
          │                                     │
   ┌────────────┐         ┌─────────────────────▼──────────────────┐
   │ repro-shot │◄────────│  AI 验证闭环 (agent × N)                │
   │ (本地截图)  │  对比    │  prompt.hifi.md → 单文件HTML → 截图     │
   └────────────┘         │   → 与 previews/<id>.png 视觉对比        │
          ▲               │   → ≤3 次迭代 → result.hifi.json        │
          │               └─────────────────────┬──────────────────┘
          │                                     │
          └─────────────────────────────────────┘
                                    agg-hifi.js ─► 写回 hifiPassed/animOk
                                                    └─► gen-gallery.js 重建 + 徽章
```

---

## 项目结构 / Project Structure

```
ui-gallery/
├── preview-gallery.html      # 主画廊（自包含，数据内嵌 JSON + 本地预览图）
│                               # Main gallery (self-contained, embedded JSON + local previews)
├── preview-data.json         # 统一数据源（230 项，含 hifi 提示词与验证结果）
│                               # Unified data source (230 entries, with hifi prompts & results)
├── gallery.template.html     # 画廊模板，含 /*ITEMS*/ 占位符（卡片/徽章逻辑在此）
│                               # Gallery template with /*ITEMS*/ placeholder (card/badge logic)
├── build-dataset.js          # 数据集构建：旧库 + 新增库 + 获奖项目 → preview-data.json
│                               # Dataset build: legacy + new libs + awards → preview-data.json
├── gen-gallery.js            # 模板 + preview-data.json → 重建 preview-gallery.html
│                               # Template + data → rebuild preview-gallery.html
│
├── # —— AI 高保真复现管线 / AI high-fidelity reproduction pipeline ——
├── assemble-hifi.js          # 组装混合高保真提示词（UNIVERSAL + NL + 动画附录 + WEB_EXTRA）
│                               # Assemble hybrid hifi prompt (UNIVERSAL + NL + anim appendix + WEB_EXTRA)
├── merge-hifi.js             # 把 prompt.hifi.md 合并写回 preview-data.json 的 prompt 字段
│                               # Merge prompt.hifi.md back into preview-data.json's prompt field
├── gen-hifi-batches.js       # 把高保真站点分 12 个/批，供并行验证
│                               # Split hifi sites into batches of 12 for parallel verification
├── agg-hifi.js               # 聚合所有 result.hifi.json 写回 preview-data.json（hifiPassed/animOk）
│                               # Aggregate all result.hifi.json back into preview-data.json
├── repro-read2.js            # 动画感知读取器：抓真实 @keyframes / 首屏动画计算样式 / 动画库
│                               # Animation-aware reader: real @keyframes / computed styles / libs
├── repro-shot.js             # 把本地 HTML 按 1280×820 视口截图成 PNG（与参考图同视口）
│                               # Screenshot local HTML at 1280×820 (same viewport as reference)
├── web-prompts.md            # 社区优质 UI 生成提示词技巧（作为 WEB_EXTRA 注入每个提示词）
│                               # Community UI-prompt techniques (injected as WEB_EXTRA)
├── hifi-agent-prompt.md      # 验证 agent 的执行指令模板
│                               # Verification agent instruction template
│
├── # —— 辅助 / 报告 / Aux & reports ——
├── test-functional.js        # 端到端功能测试（Playwright + 系统 Chrome）
│                               # End-to-end functional test (Playwright + system Chrome)
├── verify-gallery.js         # 画廊验证脚本 / Gallery verification script
├── ui-components-hub.html    # 66 库组件交叉索引（单文件）/ 66-lib cross-index (single file)
├── ui-awards-report.html     # 获奖作品调研报告 + 提示词 / Awards research report + prompts
├── advanced-demo.html        # Three.js + GSAP 高级 Demo / Advanced Three.js + GSAP demo
├── awards-source-index.html  # 各届获奖源码索引 / Awards source index
├── repro-report.html         # 早期「读→写提示词→重建→对比」闭环报告 / Early read→prompt→rebuild→compare report
│
├── previews/                 # 230 张 PNG 预览图（与 HTML 同级）/ 230 PNG previews
├── repro/                    # 每站一个目录（细节见下）/ Per-site directory (details below)
│   ├── <id>/
│   │   ├── read.json         # 结构化首屏读取（230 站全有）/ Structured above-the-fold read
│   │   ├── anim.json         # 动画感知数据（206 站）/ Animation data
│   │   ├── prompt.hifi.md    # 混合高保真提示词（206 站）/ Hybrid hifi prompt
│   │   ├── build.vN.html     # AI 生成的单文件重建版（验证产物）/ AI-built single-file rebuild
│   │   ├── build.vN.png      # 重建版截图（与参考图对比用）/ Rebuild screenshot
│   │   └── result.hifi.json  # 验证结果 {passed, animOk, attempts, notes}
│   └── hifi-batches.json     # 17 批并行验证批次 / 17 parallel verification batches
├── hub/                      # 零依赖 Node 服务（自动收录 source/ 获奖源码）/ Zero-dep Node service
│   ├── server.js             # 静态服务 + 源码浏览器 API / Static server + source-browser API
│   ├── index.html
│   └── README.md
├── source/                   # 6 个可运行获奖项目克隆（~632MB，未纳入仓库）/ 6 cloned award projects (~632MB, not in repo)
└── node_modules/             # 仅 playwright（运行截图/读取器需要）/ playwright only
```

---

## 数据集 / The Dataset

`preview-data.json`（230 项）由 `build-dataset.js` 汇总生成：
`preview-data.json` (230 entries) is assembled by `build-dataset.js`:

| 分区 / Section | 数量 / Count | 说明 / Description |
|---|---|---|
| 📦 UI 组件库与设计系统 / UI component libraries & design systems | 177 | React / Vue / Angular / Svelte / Solid / Qwik / Web Components / CSS / 大厂设计系统 / major-vendor design systems |
| 🏆 世界级获奖项目 / World-class award projects | 53 | Awwwards / FWA / CSSDA 等获奖网站，含可运行源码与真实预览 / award sites with runnable source & real previews |

每条记录含：`id`、`name`、`vendor`、`fw`（框架 / framework）、`theme`（主题 / theme）、`link`、`repo`、`kind`（`item` / `proj`）、`img`（预览图路径 / preview path）、`chips`（组件标签 / component tags）、`prompt`（高保真提示词，207 项非空 / hifi prompt, 207 non-empty）、`hifiPassed` / `animOk`（验证结果 / verification results）。

---

## AI 高保真复现验证（项目灵魂）/ AI High-Fidelity Reproduction Verification

普通「提示词库」给出的是自然语言描述，AI 生成结果往往「神似形不似」，动画更是对不上。本项目的关键差异在于：**提示词里直接塞了站点真实的动画代码，并且每一份提示词都经过 AI 实机复现验证。**
A typical "prompt library" gives natural-language descriptions; AI output is often "similar in spirit, not in form," and animations rarely match. The key difference here: **prompts embed the site's real animation code, and every prompt is verified by an AI reproducing it for real.**

### 1. 提示词是怎么炼成的 / How prompts are forged

`assemble-hifi.js` 把四部分拼成 `repro/<id>/prompt.hifi.md`：
`assemble-hifi.js` combines four parts into `repro/<id>/prompt.hifi.md`:

1. **UNIVERSAL 指令（始终生效）/ UNIVERSAL directives (always on)**：单文件 HTML、真实 hex 颜色、真实文案禁占位、逐字抄动画、1280px 桌面优先、生产级质量等硬约束。Single-file HTML, exact hex colors, real copy (no placeholders), verbatim animation copying, 1280px desktop-first, production quality — hard constraints.
2. **站点自然语言提示词（bestNL）/ Site natural-language prompt**：首屏布局/配色/文案的 NL 描述。NL description of layout/color/copy.
3. **精确动画规格附录（`buildAnimAppendix`）/ Precise animation spec appendix**：来自 `repro-read2.js` 抓取的**真实** `@keyframes` 规则、首屏元素的 `animation` / `transition` 计算样式、检测到的动画库（GSAP / Framer / AOS / Lottie / Swiper / Canvas）。噪声 keyframe（加载圈、nprogress 等）会被 `isNoise()` 过滤。The **real** `@keyframes`, computed `animation`/`transition` styles, and detected libs (GSAP / Framer / AOS / Lottie / Swiper / Canvas) pulled by `repro-read2.js`. Noise keyframes (spinners, nprogress, …) are filtered by `isNoise()`.
4. **WEB_EXTRA**：从 `web-prompts.md` 注入——社区「AI 生成高保真 UI」提示词技巧（数值化约束、色彩系统、排版、间距、阴影、组件细节、动效、风格关键词、反模式）。Injected from `web-prompts.md` — community techniques for high-fidelity AI UI generation (numeric constraints, color systems, typography, spacing, shadows, component detail, motion, style keywords, anti-patterns).

### 2. 验证闭环 / The verification loop

每一份 `prompt.hifi.md` 交给 AI agent 执行：
Each `prompt.hifi.md` is handed to an AI agent:

```
读 prompt.hifi.md
  → 写单文件 build.vN.html（CSS/JS 全内联）/ write single-file build.vN.html (inline CSS/JS)
  → repro-shot.js 按 1280×820 截图 / screenshot at 1280×820 via repro-shot.js
  → 与 previews/<id>.png 视觉对比（首屏 + 动画）/ compare vs previews/<id>.png (above-the-fold + animation)
  → 不一致则修改 build.vN.html，最多迭代 3 次 / fix & re-iterate up to 3 times
  → 写 repro/<id>/result.hifi.json { passed, animOk, attempts, lastBuild, notes }
```

`gen-hifi-batches.js` 把带真实动画规格且本地有参考图的站点分成 12 个/批（共 17 批），供多个 agent 并行跑，验证幂等（已有 `result.hifi.json` 则跳过）。
`gen-hifi-batches.js` splits sites with real animation specs and local references into batches of 12 (17 batches total) for parallel agents; verification is idempotent (skips if `result.hifi.json` exists).

### 3. 结果聚合 / Result aggregation

`agg-hifi.js` 读取全部 `result.hifi.json`，把 `hifiPassed` / `animOk` 写回 `preview-data.json`，随后 `gen-gallery.js` 重建画廊，卡片上即显示验证徽章。未参与验证的站点字段留空，画廊显示「待验证」，**不会误标失败**。
`agg-hifi.js` reads all `result.hifi.json` and writes `hifiPassed` / `animOk` back into `preview-data.json`; `gen-gallery.js` then rebuilds the gallery with verification badges. Sites not yet verified leave the field empty and show "pending" — **never falsely marked failed.**

---

## 使用指南 / Usage Guide

### 浏览画廊 / Browse the gallery

直接用浏览器打开 `preview-gallery.html`（推荐 Chrome / Edge）。预览图位于 `previews/`，与 HTML 同级。
Open `preview-gallery.html` directly in a browser (Chrome / Edge recommended). Previews live in `previews/`, alongside the HTML.

### 用提示词让 AI 重建某个 UI / Rebuild a UI from its prompt with AI

1. 在画廊里找到目标卡片，点「复制提示词」。/ Find the target card and click "Copy prompt".
2. 把提示词丢给任意 AI UI 生成器（要求输出单文件 HTML）。/ Paste it into any AI UI generator (ask for a single-file HTML).
3. 生成结果的首屏与动画应与原站一致（动画规格是逐字抄的真实代码）。/ The result's above-the-fold and animations should match the original (animation spec is verbatim real code).

### 运行管线脚本 / Run the pipeline

环境要求：Node.js 22+，且安装 `playwright` + 系统 Chrome（读取器/截图器使用系统 Chrome 路径）。
Requirements: Node.js 22+, `playwright` installed, and system Chrome (reader/screenshotter use the system Chrome path).

```bash
# 1) 重新构建数据集（改完 build-dataset.js 后）
# 1) Rebuild the dataset (after editing build-dataset.js)
node build-dataset.js

# 2) 组装高保真提示词（依赖 repro/<id>/anim.json 与 web-prompts.md）
# 2) Assemble hifi prompts (needs repro/<id>/anim.json and web-prompts.md)
node assemble-hifi.js
node merge-hifi.js          # 合并写回 preview-data.json / merge back into preview-data.json

# 3) 重建画廊 / Rebuild the gallery
node gen-gallery.js

# 4) 分批 + 跑 AI 验证闭环（每批交给 agent 执行 hifi-agent-prompt.md）
# 4) Batch + run AI verification loop (each batch run by an agent per hifi-agent-prompt.md)
node gen-hifi-batches.js    # 生成 repro/hifi-batches.json / produces repro/hifi-batches.json
#    → 由 agent 读取 repro/<id>/prompt.hifi.md 执行闭环（见上文）/ agent reads prompt.hifi.md and runs the loop

# 5) 聚合验证结果并重建带徽章的画廊
# 5) Aggregate results and rebuild the badged gallery
node agg-hifi.js
node gen-gallery.js
```

---

## 验证结果 / Verification Results

| 指标 / Metric | 数值 / Value |
|---|---|
| 进入高保真复现验证的站点 / Sites entering hifi verification | 204 |
| AI 实机复现通过（`hifiPassed`）/ AI reproduction passed | **194 / 204（100%）** |
| 动画逐帧还原（`animOk`）/ Animation frame-restored | **191 / 194（98.5%）** |
| 复现失败 / Reproduction failures | **0** |
| 带高保真提示词的站点 / Sites with hifi prompt | 207 / 230 |
| 标注「待验证」/ Marked "pending" | 36（含尚未复现的站点，未误标失败 / includes not-yet-reproduced, not falsely failed） |

画廊卡片徽章含义 / Badge meanings：`✓ 复现通过`（绿 / green）、`✦ 动画还原`（金 / gold）、`✕ 未复现`（红 / red）、`· 待验证`（灰 / grey）。

> 注：验证由 AI agent 在本地以系统 Chrome 实机截图对比完成，迭代上限 3 次。动画还原判定以首屏 `@keyframes` / transition 一致性为准。
> Note: verification is done by AI agents locally with system Chrome, screenshot-compared, capped at 3 iterations. Animation parity is judged by above-the-fold `@keyframes` / transition consistency.

---

## 脚本参考 / Script Reference

| 脚本 / Script | 用途 / Purpose |
|---|---|
| `build-dataset.js` | 汇总组件库 + 获奖项目 → `preview-data.json` / Aggregate libs + awards → `preview-data.json` |
| `gen-gallery.js` | 模板 + 数据 → 重建自包含 `preview-gallery.html` / Template + data → rebuild self-contained gallery |
| `assemble-hifi.js` | 组装混合高保真提示词 → `repro/<id>/prompt.hifi.md` / Assemble hybrid hifi prompt |
| `merge-hifi.js` | 把 `prompt.hifi.md` 合并回 `preview-data.json` 的 `prompt` 字段 / Merge prompt back into data |
| `gen-hifi-batches.js` | 把高保真站点分 12/批供并行验证 → `repro/hifi-batches.json` / Batch hifi sites for parallel verify |
| `agg-hifi.js` | 聚合 `result.hifi.json` 写回 `hifiPassed` / `animOk` / Aggregate results back |
| `repro-read2.js` | 动画感知读取器：抓真实 `@keyframes` / 首屏动画 / 动画库 → `anim.json` / Animation-aware reader |
| `repro-shot.js` | 本地 HTML 按 1280×820 截图 → PNG / Screenshot local HTML at 1280×820 |
| `web-prompts.md` | 社区优质 UI 生成提示词技巧（WEB_EXTRA 注入位）/ Community UI-prompt techniques (WEB_EXTRA) |
| `hifi-agent-prompt.md` | 验证 agent 执行指令模板 / Verification agent instruction template |
| `test-functional.js` | Playwright 端到端功能测试 / Playwright e2e functional test |
| `verify-gallery.js` | 画廊渲染验证 / Gallery render verification |

---

## 如何扩展数据集 / How to extend the dataset

1. 在 `build-dataset.js` 的 `NEW` 数组（或获奖项目数组）追加条目，元组格式：
   Append an entry to the `NEW` array (or awards array) in `build-dataset.js`, tuple format:
   `[id, name, vendor, fw, theme, link, repo, license, chips]`
2. 运行 `node build-dataset.js` 重建 `preview-data.json`。/ Run `node build-dataset.js` to rebuild the data.
3. 生成该站预览图（`previews/<id>.png`），并确保本地有可访问 URL 供读取器抓取动画。/ Generate its preview (`previews/<id>.png`) and ensure a reachable URL for the animation reader.
4. 跑 `assemble-hifi.js` → `merge-hifi.js` → 把新站纳入 `gen-hifi-batches.js` 批次 → 交 agent 验证 → `agg-hifi.js` → `gen-gallery.js`。/ Run assemble → merge → include in batches → agent verify → aggregate → rebuild.

---

## 本地源码浏览器（hub）/ Local source browser (hub)

`hub/` 是一个零依赖 Node 服务，自动扫描 `source/` 里克隆的获奖源码，提供**真实代码预览**与**源码浏览器**（内容逐字节一致，不做改写）。
`hub/` is a zero-dependency Node service that auto-scans cloned award source in `source/`, offering **real-code preview** and a **source browser** (byte-identical, unmodified).

```bash
cd hub
node server.js        # 默认端口 8200，可用 PORT=xxxx 覆盖 / default port 8200, override with PORT=xxxx
# 打开 http://127.0.0.1:8200 / open http://127.0.0.1:8200
```

把任意获奖仓库浅克隆进 `../source/`，刷新页面即自动出现。接口与说明见 `hub/README.md`。
Shallow-clone any award repo into `../source/` and it appears on refresh. API & details in `hub/README.md`.

---

## 说明与限制 / Notes & Limitations

- **`source/` 目录（约 632MB，含 6 个可运行获奖项目克隆）未纳入本仓库**（`.gitignore` 已排除）。如需本地源码浏览，按 `awards-source-index.html` 中的链接自行克隆。
  The `source/` directory (~632MB, 6 cloned award projects) is **not in this repo** (excluded by `.gitignore`). To browse source locally, clone per links in `awards-source-index.html`.
- 画廊运行时**完全离线**：数据内嵌、预览图本地、零 CDN / 外部 API 调用。
  The gallery is **fully offline at runtime**: embedded data, local previews, zero CDN / external API calls.
- 动画还原验证以首屏可见动画为准；部分站点需交互（悬停 / 滚动）才触发的动画，验证以「触发条件与表现一致」判定。
  Animation parity covers above-the-fold visible motion; interaction-triggered (hover/scroll) animations are judged by "same trigger + same behavior."
- 验证结果由 AI 在本地以系统 Chrome 实机生成对比，属尽力而为（best-effort），非像素级强制相等。
  Verification is AI-driven, locally screenshot-compared, best-effort — not pixel-enforced equality.

---

## 相关链接 / Links

- 🌐 在线画廊 / Live gallery：<https://wangkeyu-u.github.io/ui-gallery/preview-gallery.html>
- 📦 仓库 / Repo：`wangkeyu-u/ui-gallery`（GitHub Pages 自动部署 `main` 分支 / auto-deploys `main` via GitHub Pages）

---

<p align="center">
  <sub>策展式 UI 画廊 · 让 AI 学会「抄」顶级 UI / A curated UI gallery that teaches AI to "copy" top-tier UI</sub>
</p>

# 世界级 UI 画廊 · UI Gallery

> 230 个主流 UI 组件库 / 设计系统 + 世界级获奖网站的策展式画廊。每一项都附带**可被 AI 逐帧复现的高保真提示词**——复制提示词丢给任意 AI，就能重建出首屏一致、动画一致的页面。

[![items](https://img.shields.io/badge/收录-230%20项-blue)](https://wangkeyu-u.github.io/ui-gallery/preview-gallery.html)
[![verified](https://img.shields.io/badge/AI%20复现通过-194%2F204-brightgreen)](https://wangkeyu-u.github.io/ui-gallery/preview-gallery.html)
[![anim](https://img.shields.io/badge/动画还原-191%2F194-ff69b4)](https://wangkeyu-u.github.io/ui-gallery/preview-gallery.html)
[![offline](https://img.shields.io/badge/离线自包含-零外部调用-lightgrey)](https://wangkeyu-u.github.io/ui-gallery/preview-gallery.html)
[![pages](https://img.shields.io/badge/GitHub%20Pages-已部署-orange)](https://wangkeyu-u.github.io/ui-gallery/preview-gallery.html)

---

## 目录

- [项目简介](#项目简介)
- [核心特性](#核心特性)
- [在线预览](#在线预览)
- [整体架构](#整体架构)
- [项目结构](#项目结构)
- [数据集](#数据集)
- [AI 高保真复现验证（项目灵魂）](#ai-高保真复现验证项目灵魂)
  - [1. 提示词是怎么炼成的](#1-提示词是怎么炼成的)
  - [2. 验证闭环](#2-验证闭环)
  - [3. 结果聚合](#3-结果聚合)
- [使用指南](#使用指南)
- [验证结果](#验证结果)
- [脚本参考](#脚本参考)
- [如何扩展数据集](#如何扩展数据集)
- [本地源码浏览器（hub）](#本地源码浏览器hub)
- [说明与限制](#说明与限制)
- [相关链接](#相关链接)

---

## 项目简介

这个项目把「浏览优秀 UI」和「用 AI 重建优秀 UI」两件事合在了一起：

1. **画廊**：230 个站点的策展式浏览，分区、框架/主题筛选、点选收藏、一键复制。完全自包含，双击 `preview-gallery.html` 即用，运行时零外部 CDN / API 调用。
2. **高保真提示词**：每个站点都生成了一份**混合提示词**——自然语言首屏描述 + 站点**真实的动画代码**（`@keyframes`、transition 缓动/时长、动画库名）。提示词里还叠加了从社区扒来的「高质量 UI 生成提示词」技巧。
3. **AI 实机验证**：用 AI agent 把提示词重新生成单文件 HTML，与原始预览图逐帧对比，最多迭代 3 次，确认「首屏一致 + 动画一致」才标为通过。

一句话：**这是一个让 AI 能学会「抄」顶级 UI 的提示词库 + 验证体系。**

---

## 核心特性

- **离线自包含**：画廊 HTML 内嵌数据 JSON，预览图放本地 `previews/`，无需服务器、无需联网。
- **策展式编辑风 UI**：暖纸色背景、墨黑排版、朱砂红点缀；杂志版头、目录编号、发丝线、画框式卡片。
- **分区浏览**：组件库（177）与获奖项目（53）分块独立区域，默认全量摊开，纯滚动查看。
- **多维筛选**：类型切换（全部 / 组件库 / 获奖项目）、框架下拉、主题下拉，均显示各组卡片数量。
- **点选 + 持久化**：点击卡片选中（高亮 + ✓），选择存 localStorage，刷新不丢；右下角浮标显示已选数量。
- **复制提示词**：每张卡片一键复制该站点高保真提示词，可直接丢给任意 AI UI 生成器。
- **验证徽章**：每张卡片显示 AI 复现状态——`✓ 复现通过` / `✦ 动画还原` / `✕ 未复现` / `· 待验证`。
- **动画感知**：提示词直接包含站点真实动画规格，AI 生成结果经视觉对比核验动画一致。

---

## 在线预览

> **GitHub Pages**：<https://wangkeyu-u.github.io/ui-gallery/preview-gallery.html>

也可直接克隆后用浏览器打开本地 `preview-gallery.html`（推荐 Chrome / Edge）。

---

## 整体架构

```
                         ┌─────────────────────────────────────────┐
   真实站点 / 获奖源码     │           数据集与提示词管线             │
   (url / source/)        │                                         │
          │               │  build-dataset.js                       │
          ▼               │   └─ 66 旧库 + 新增库 + 获奖项目         │
   ┌────────────┐         │       └─► preview-data.json (230 项)    │
   │ 读取器      │         │                                         │
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

## 项目结构

```
ui-gallery/
├── preview-gallery.html      # 主画廊（自包含，数据内嵌 JSON + 本地预览图）
├── preview-data.json         # 统一数据源（230 项，含 hifi 提示词与验证结果）
├── gallery.template.html     # 画廊模板，含 /*ITEMS*/ 占位符（卡片/徽章逻辑在此）
├── build-dataset.js          # 数据集构建：旧库 + 新增库 + 获奖项目 → preview-data.json
├── gen-gallery.js            # 模板 + preview-data.json → 重建 preview-gallery.html
│
├── # —— AI 高保真复现管线 ——
├── assemble-hifi.js          # 组装混合高保真提示词（UNIVERSAL + NL + 动画附录 + WEB_EXTRA）
├── merge-hifi.js             # 把 prompt.hifi.md 合并写回 preview-data.json 的 prompt 字段
├── gen-hifi-batches.js       # 把高保真站点分 12 个/批，供并行验证
├── agg-hifi.js               # 聚合所有 result.hifi.json 写回 preview-data.json（hifiPassed/animOk）
├── repro-read2.js            # 动画感知读取器：抓真实 @keyframes / 首屏动画计算样式 / 动画库
├── repro-shot.js             # 把本地 HTML 按 1280×820 视口截图成 PNG（与参考图同视口）
├── web-prompts.md            # 社区优质 UI 生成提示词技巧（作为 WEB_EXTRA 注入每个提示词）
├── hifi-agent-prompt.md      # 验证 agent 的执行指令模板
│
├── # —— 辅助 / 报告 ——
├── test-functional.js        # 端到端功能测试（Playwright + 系统 Chrome）
├── verify-gallery.js         # 画廊验证脚本
├── ui-components-hub.html    # 66 库组件交叉索引（单文件）
├── ui-awards-report.html     # 获奖作品调研报告 + 提示词
├── advanced-demo.html        # Three.js + GSAP 高级 Demo
├── awards-source-index.html  # 各届获奖源码索引
├── repro-report.html         # 早期「读→写提示词→重建→对比」闭环报告
│
├── previews/                 # 230 张 PNG 预览图（与 HTML 同级）
├── repro/                    # 每站一个目录（细节见下）
│   ├── <id>/
│   │   ├── read.json         # 结构化首屏读取（230 站全有）
│   │   ├── anim.json         # 动画感知数据（206 站）
│   │   ├── prompt.hifi.md    # 混合高保真提示词（206 站）
│   │   ├── build.vN.html     # AI 生成的单文件重建版（验证产物）
│   │   ├── build.vN.png      # 重建版截图（与参考图对比用）
│   │   └── result.hifi.json  # 验证结果 {passed, animOk, attempts, notes}
│   └── hifi-batches.json     # 17 批并行验证批次
├── hub/                      # 零依赖 Node 服务（自动收录 source/ 获奖源码）
│   ├── server.js             # 静态服务 + 源码浏览器 API
│   ├── index.html
│   └── README.md
├── source/                   # 6 个可运行获奖项目克隆（~632MB，未纳入仓库）
└── node_modules/             # 仅 playwright（运行截图/读取器需要）
```

---

## 数据集

`preview-data.json`（230 项）由 `build-dataset.js` 汇总生成：

| 分区 | 数量 | 说明 |
|---|---|---|
| 📦 UI 组件库与设计系统 | 177 | React / Vue / Angular / Svelte / Solid / Qwik / Web Components / CSS / 大厂设计系统 |
| 🏆 世界级获奖项目 | 53 | Awwwards / FWA / CSSDA 等获奖网站，含可运行源码与真实预览 |

每条记录含：`id`、`name`、`vendor`、`fw`（框架）、`theme`（主题）、`link`、`repo`、`kind`（`item` / `proj`）、`img`（预览图路径）、`chips`（组件标签）、`prompt`（高保真提示词，207 项非空）、`hifiPassed` / `animOk`（验证结果）。

---

## AI 高保真复现验证（项目灵魂）

普通「提示词库」给出的是自然语言描述，AI 生成结果往往「神似形不似」，动画更是对不上。本项目的关键差异在于：**提示词里直接塞了站点真实的动画代码，并且每一份提示词都经过 AI 实机复现验证。**

### 1. 提示词是怎么炼成的

`assemble-hifi.js` 把四部分拼成 `repro/<id>/prompt.hifi.md`：

1. **UNIVERSAL 指令**（始终生效）：单文件 HTML、真实 hex 颜色、真实文案禁占位、逐字抄动画、1280px 桌面优先、生产级质量等硬约束。
2. **站点自然语言提示词**（bestNL）：首屏布局/配色/文案的 NL 描述。
3. **精确动画规格附录**（`buildAnimAppendix`）：来自 `repro-read2.js` 抓取的**真实** `@keyframes` 规则、首屏元素的 `animation` / `transition` 计算样式、检测到的动画库（GSAP / Framer / AOS / Lottie / Swiper / Canvas）。噪声 keyframe（加载圈、nprogress 等）会被 `isNoise()` 过滤。
4. **WEB_EXTRA**：从 `web-prompts.md` 注入——社区「AI 生成高保真 UI」提示词技巧（数值化约束、色彩系统、排版、间距、阴影、组件细节、动效、风格关键词、反模式）。

### 2. 验证闭环

每一份 `prompt.hifi.md` 交给 AI agent 执行：

```
读 prompt.hifi.md
  → 写单文件 build.vN.html（CSS/JS 全内联）
  → repro-shot.js 按 1280×820 截图
  → 与 previews/<id>.png 视觉对比（首屏 + 动画）
  → 不一致则修改 build.vN.html，最多迭代 3 次
  → 写 repro/<id>/result.hifi.json { passed, animOk, attempts, lastBuild, notes }
```

`gen-hifi-batches.js` 把带真实动画规格且本地有参考图的站点分成 12 个/批（共 17 批），供多个 agent 并行跑，验证幂等（已有 `result.hifi.json` 则跳过）。

### 3. 结果聚合

`agg-hifi.js` 读取全部 `result.hifi.json`，把 `hifiPassed` / `animOk` 写回 `preview-data.json`，随后 `gen-gallery.js` 重建画廊，卡片上即显示验证徽章。未参与验证的站点字段留空，画廊显示「待验证」，**不会误标失败**。

---

## 使用指南

### 浏览画廊

直接用浏览器打开 `preview-gallery.html`（推荐 Chrome / Edge）。预览图位于 `previews/`，与 HTML 同级。

### 用提示词让 AI 重建某个 UI

1. 在画廊里找到目标卡片，点「复制提示词」。
2. 把提示词丢给任意 AI UI 生成器（要求输出单文件 HTML）。
3. 生成结果的首屏与动画应与原站一致（动画规格是逐字抄的真实代码）。

### 运行管线脚本

环境要求：Node.js 22+，且安装 `playwright` + 系统 Chrome（读取器/截图器使用系统 Chrome 路径）。

```bash
# 1) 重新构建数据集（改完 build-dataset.js 后）
node build-dataset.js

# 2) 组装高保真提示词（依赖 repro/<id>/anim.json 与 web-prompts.md）
node assemble-hifi.js
node merge-hifi.js          # 合并写回 preview-data.json

# 3) 重建画廊
node gen-gallery.js

# 4) 分批 + 跑 AI 验证闭环（每批交给 agent 执行 hifi-agent-prompt.md）
node gen-hifi-batches.js    # 生成 repro/hifi-batches.json
#    → 由 agent 读取 repro/<id>/prompt.hifi.md 执行闭环（见上文）

# 5) 聚合验证结果并重建带徽章的画廊
node agg-hifi.js
node gen-gallery.js
```

---

## 验证结果

| 指标 | 数值 |
|---|---|
| 进入高保真复现验证的站点 | 204 |
| AI 实机复现通过（`hifiPassed`） | **194 / 204（100%）** |
| 动画逐帧还原（`animOk`） | **191 / 194（98.5%）** |
| 复现失败 | **0** |
| 带高保真提示词的站点 | 207 / 230 |
| 标注「待验证」 | 36（含尚未复现的站点，未误标失败） |

画廊卡片徽章含义：`✓ 复现通过`（绿）、`✦ 动画还原`（金）、`✕ 未复现`（朱砂红）、`· 待验证`（灰）。

> 注：验证由 AI agent 在本地以系统 Chrome 实机截图对比完成，迭代上限 3 次。动画还原判定以首屏 `@keyframes` / transition 一致性为准。

---

## 脚本参考

| 脚本 | 用途 |
|---|---|
| `build-dataset.js` | 汇总组件库 + 获奖项目 → `preview-data.json` |
| `gen-gallery.js` | 模板 + 数据 → 重建自包含 `preview-gallery.html` |
| `assemble-hifi.js` | 组装混合高保真提示词 → `repro/<id>/prompt.hifi.md` |
| `merge-hifi.js` | 把 `prompt.hifi.md` 合并回 `preview-data.json` 的 `prompt` 字段 |
| `gen-hifi-batches.js` | 把高保真站点分 12/批供并行验证 → `repro/hifi-batches.json` |
| `agg-hifi.js` | 聚合 `result.hifi.json` 写回 `hifiPassed` / `animOk` |
| `repro-read2.js` | 动画感知读取器：抓真实 `@keyframes` / 首屏动画 / 动画库 → `anim.json` |
| `repro-shot.js` | 本地 HTML 按 1280×820 截图 → PNG |
| `web-prompts.md` | 社区优质 UI 生成提示词技巧（WEB_EXTRA 注入位） |
| `hifi-agent-prompt.md` | 验证 agent 执行指令模板 |
| `test-functional.js` | Playwright 端到端功能测试 |
| `verify-gallery.js` | 画廊渲染验证 |

---

## 如何扩展数据集

1. 在 `build-dataset.js` 的 `NEW` 数组（或获奖项目数组）追加条目，元组格式：
   `[id, name, vendor, fw, theme, link, repo, license, chips]`
2. 运行 `node build-dataset.js` 重建 `preview-data.json`。
3. 生成该站预览图（`previews/<id>.png`），并确保本地有可访问 URL 供读取器抓取动画。
4. 跑 `assemble-hifi.js` → `merge-hifi.js` → 把新站纳入 `gen-hifi-batches.js` 批次 → 交 agent 验证 → `agg-hifi.js` → `gen-gallery.js`。

---

## 本地源码浏览器（hub）

`hub/` 是一个零依赖 Node 服务，自动扫描 `source/` 里克隆的获奖源码，提供**真实代码预览**与**源码浏览器**（内容逐字节一致，不做改写）。

```bash
cd hub
node server.js        # 默认端口 8200，可用 PORT=xxxx 覆盖
# 打开 http://127.0.0.1:8200
```

把任意获奖仓库浅克隆进 `../source/`，刷新页面即自动出现。接口与说明见 `hub/README.md`。

---

## 说明与限制

- **`source/` 目录（约 632MB，含 6 个可运行获奖项目克隆）未纳入本仓库**（`.gitignore` 已排除）。如需本地源码浏览，按 `awards-source-index.html` 中的链接自行克隆。
- 画廊运行时**完全离线**：数据内嵌、预览图本地、零 CDN / 外部 API 调用。
- 动画还原验证以首屏可见动画为准；部分站点需交互（悬停 / 滚动）才触发的动画，验证以「触发条件与表现一致」判定。
- 验证结果由 AI 在本地以系统 Chrome 实机生成对比，属尽力而为（best-effort），非像素级强制相等。

---

## 相关链接

- 🌐 在线画廊：<https://wangkeyu-u.github.io/ui-gallery/preview-gallery.html>
- 📦 仓库：`wangkeyu-u/ui-gallery`（GitHub Pages 自动部署 `main` 分支）

---

<p align="center">
  <sub>策展式 UI 画廊 · 让 AI 学会「抄」顶级 UI</sub>
</p>

# UI Gallery

桌面网页 UI 发现与复刻参考库。当前数据集包含 232 条记录，其中 155 个通过可视质量验收（152 个真实站点快照 + 3 个自包含纯 CSS 演示），其余失败、重复、被遮挡或语义不匹配的条目已隔离，不会出现在主画廊、搜索结果、AI 推荐或主题选择器中。3 个演示页（`demo-flat` / `demo-portfolio` / `demo-dashboard`）已跑通本地视觉验证并标记为 `passed`，用于证明复刻验证闭环可稳定认证通过。

## 产品原则

- 只做桌面网页参考，标准采集画布为 1280 × 820。
- 截图必须能直接判断页面结构；Cookie 遮挡、登录墙、空白页、加载页和错误页不能进入主库。
- 原站链接区分可访问、跳转、限制访问、已失效和待复核。
- 不承诺文字提示词能够 1:1 复刻网页。
- 每个验收条目提供“参考截图 + 已确认事实 + 桌面约束 + 截图差异验收”的复刻包。
- 首页 AI 助手默认使用本地搜索，无需部署 Worker；云端 AI 仅为可选增强。

## 当前规模

| 指标 | 数量 |
| --- | ---: |
| 总记录 | 232 |
| 主画廊已验收 UI | 155 |
| 隔离条目 | 77 |
| 新一轮真实桌面快照 | 95 |
| 可见风格/行业分类 | 26 |

新增覆盖 AI 产品、开发平台、金融科技、商业零售、汽车、文化博物馆、媒体编辑、教育、公共服务、设计机构、创意工具、娱乐内容、社区发现和健康等方向。

## 使用

```bash
npm install
npm run dev
```

生产构建与质量检查：

```bash
npm run audit                 # 校验已验收截图存在且为有效 PNG
npm run verify:data           # 校验数据、质量白名单、复刻状态与验证产物一致
npm run build                 # tsc + vite 生产构建
npm run test:smoke            # 浏览器验证搜索、筛选、预览、路由与响应式
npm run check:full            # 以上全部 + 全量复刻重验 + 高危依赖审计
```

`npm run audit` 会根据当前质量白名单检查所有已验收截图是否存在、是否为有效 PNG，并输出 [preview-audit.json](src/data/preview-audit.json)。

仓库内置 GitHub Actions：所有 push / PR 自动执行全量验证；`main` 通过同样检查后自动发布到 GitHub Pages。首次启用时需在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**（从旧的 branch 发布方式迁移时只需设置一次）。之后也可在 Actions 页面手动运行 Pages，或执行 `npm run deploy` 触发。

## UI 复刻任务包 + 本地视觉验证（模型无关）

本项目提供一套**与具体 AI 模型无关**的复刻流程：导出任务包 → 交给任意支持看图+写代码的 AI → 本地视觉验证还原度。**不调用任何付费 / OpenAI API**，验证全部在本地用开源工具完成（Playwright + pixelmatch + sharp + 本地 SSIM）。

> 本地优先使用系统已安装的 **Google Chrome / Chromium**；CI 使用 Playwright 安装的 Chromium。也可通过 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 显式指定浏览器。

### 1. 导出复刻任务包

```bash
npm run repro:pack -- --id v4-openai   # 单个项目
npm run repro:pack -- --all            # 全部已验收项目
```

产物写入 `repro/<project-id>/task/`：

| 文件 | 内容 |
| --- | --- |
| `reference.png` | 1280 × 820 参考截图（唯一视觉事实来源） |
| `brief.md` | 项目画像、硬性范围、执行步骤、验收标准、已知限制 |
| `project.json` | 结构化画像（id / name / viewport / styleFamily / colors / knownLimitations…） |
| `acceptance.json` | 机器可读验收规则、阈值与硬性失败项 |

详情页的「导出复刻包（ZIP）」按钮生成同样内容的 ZIP（含 `reference.png`）。

### 2. 本地视觉验证

```bash
npm run repro:validate -- --id v4-openai --candidate ./repro/v4-openai/candidate
# 加 --write-data 把结果写回 ui-projects.json
```

`--candidate` 支持三种形式：

- 单个 `.html` 文件（`file://` 打开）；
- 含可启动网页的目录（内置静态服务器托管）；
- `http(s)://` 本地 URL。

验证流程：固定视口 1280 × 820 → 等字体/图片加载 → 截 `candidate.png` → 与 `reference.png` 逐项对比 → 输出 `diff.png` 热力图 + `diff-overlay.png` 差异叠加热力图（暗化参考 + 红标不同处）+ `report.json` + `report.html`，全部写入 `repro/<project-id>/validation/`。

**批量与汇总**（无需逐个跑）：

```bash
npm run repro:validate-all -- --write-data   # 验证所有有 task+candidate 的项目
npm run repro:summary                         # 汇总已有 report.json → repro/SUMMARY.md + summary.json
```

**自包含通过样例（证明闭环能稳定产出 `passed`）**：仓库内置 3 个纯 CSS、无照片素材、完全可控的演示页，reference 与 candidate 均为手写、且刻意保留细微差异（圆角 / 间距 / 渐变色）以避免字节完全一致触发反作弊：

| 项目 | 风格 | SSIM | 像素差异 |
| --- | --- | --- | --- |
| `demo-flat` | SaaS 落地页（浅色） | 0.9926 | 0.33% |
| `demo-portfolio` | 作品集（浅色） | 0.9976 | 0.08% |
| `demo-dashboard` | 数据看板（深色） | 0.9996 | 0.02% |

演示页的 reference 由 `reference-src/index.html` 通过 `render-reference.cjs` 渲染成 `previews/<id>.png`（与验证器完全相同的 1280×820 取景），再复刻 candidate 后跑验证：

```bash
node scripts/render-reference.cjs --id demo-dashboard   # reference-src → previews/<id>.png（同时写入 task/reference.png）
node scripts/repro-pack.cjs --id demo-dashboard          # 生成 task 包
node scripts/repro-validate.cjs --id demo-dashboard --candidate ./repro/demo-dashboard/candidate --write-data
```

对比之下，`v4-openai / v4-tesla / v4-moma` 参考图是版权照片密集的品牌页，手写 CSS 无法达到 SSIM ≥ 0.90，按规则如实标记为 `failed` 并把照片记为限制项——不伪造通过。

### 3. 验证指标（保留全部原始值，不用单一综合分掩盖问题）

- 尺寸是否为 1280 × 820；
- 横向溢出（px）；
- 像素差异比例（pixelmatch）；
- SSIM 感知相似度（本地实现）；
- 主要颜色差异 + 结构差异（分块均值）+ 边缘密度差异（Sobel）；
- 反作弊：候选是否与参考字节一致 / 是否整页用参考截图（`img` 或 `background-image`）冒充复刻——命中直接 `failed`，即使 SSIM=1。

### 4. 通过规则（只有真跑过验证且产物存在才可标记）

| 状态 | 含义 |
| --- | --- |
| `截图已验收` | 仅表示参考快照可用，**不代表可 1:1 还原** |
| `复刻未验证`（untested） | 默认状态，尚未做任何本地比对 |
| `复刻已验证`（passed） | 截图 1280×820、无横向溢出、SSIM ≥ 0.90、像素差异 ≤ 12% |
| `未通过`（failed） | 尺寸错误 / 横向溢出 / 还原度过低 / 反作弊命中 |
| `需人工复核`（needs-review） | 自动指标接近但主布局或视觉重心仍存疑 |

字体抗锯齿、视频帧、无法取得的品牌图片允许有限容差并记录为限制项。**绝不因为 reference 与 candidate 是同一张静态图片就判定通过**；页面必须是真实 HTML/CSS/React 渲染。

## 主要文件

| 文件 | 作用 |
| --- | --- |
| `src/data/ui-projects.json` | UI 元数据与截图路径 |
| `src/data/style-families.json` | 分类与搜索词 |
| `src/utils/projectQuality.ts` | 质量准入与链接状态 |
| `src/utils/replicaBrief.ts` | 截图驱动的复刻任务文案 |
| `src/utils/reproPack.ts` | 前端 ZIP 复刻包导出 |
| `scripts/repro-pack-common.cjs` | brief/project/acceptance 单一事实来源（前后端共用） |
| `scripts/repro-pack.cjs` | 导出 `repro/<id>/task/` 任务包 |
| `scripts/repro-validate.cjs` | 本地视觉验证（无 AI API） |
| `scripts/migrate-repro.cjs` | 为所有项目补充 repro 字段（默认 untested） |
| `src/components/QuickPreview.tsx` | 完整桌面截图预览 |
| `src/components/ChatPanel.tsx` | 本地优先的选图助手 |
| `src/pages/Detail.tsx` | 证据拆解、复刻包导出、验证状态与报告入口 |

## 关于复刻

文字描述只负责约束，不负责替代截图。正确流程是：

1. 在画廊打开完整 UI 预览。
2. 进入详情页下载 1280 × 820 参考截图。
3. 复制复刻任务，并与截图一起交给支持图像输入的模型。
4. 在相同画布尺寸截图，与参考图叠加比较。
5. 至少修正一轮布局、间距、字号、取色和图片裁切。

字体、视频、3D、原始品牌资产和受版权保护的内容可能无法完全复现，详情页会把未知信息保留为“未采集”，不会用常见参数补齐。

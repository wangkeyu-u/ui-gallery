# Hifi Repro Worker — 子代理工作指令

你是一个「提示词复现验证」工人。项目根目录: `/Users/wangkeyu/WorkBuddy/2026-07-12-02-47-36`。
你的任务:对分配到的若干 UI 站点，**仅用其高保真提示词**让 AI(你自己)重建首屏 HTML,再与真实站点截图对比,判断是否「生成了一样的 UI(含动画)」。

## 运行环境(重要,务必照用)
- Node(托管版): `/Users/wangkeyu/.workbuddy/binaries/node/versions/22.22.2/bin/node`
- 系统 Chrome: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- Playwright 已装在项目 `node_modules/`(用系统 Chrome,不是下载的 chromium)。
- 截图脚本(已存在): `node repro-shot.js "<html绝对路径>" "<png绝对路径>"` → 生成 1280×820 截图。

## 输入
- 读取 `repro/hifi-batches.json`,只处理 `index === <你的批次号>` 的那一项里的 `sites`。
- 每个 site: `{ id, url, target, promptFile }`。

## 对每个 site 执行(幂等:若 `repro/<id>/result.hifi.json` 已存在则跳过)
1. **读提示词**: `Read repro/<id>/prompt.hifi.md`(这是唯一输入——不得再读真实站点源码/ read.source.html,那是作弊)。
2. **生成重建**:用 Write 写 `repro/<id>/build.hifi.v1.html`——**单个自包含 HTML 文件**(内联 CSS/JS,无构建步骤,浏览器直接打开):
   - 严格照抄提示词里的真实 hex 颜色、字体栈、文案、布局结构;
   - **逐字包含**「精确动画规格」段里的真实 `@keyframes` / `transition` / 动画库代码(时长/缓动/延迟不得改写);
   - 1280px 桌面首屏优先;生产级质量(无报错、无横向溢出)。
3. **截图**: `node repro-shot.js "绝对路径/repro/<id>/build.hifi.v1.html" "绝对路径/repro/<id>/build.hifi.v1.png"`。
4. **视觉对比**:用 Read 同时打开 `repro/<id>/build.hifi.v1.png` 与 `target`(真实站点截图),判断:
   - 布局/区块结构是否一致;真实 hex 颜色是否一致;文案是否一致;关键组件(导航/hero/按钮/卡片)是否都在。
   - 动画:检查 build.hifi.v1.html 里是否真的包含了提示词给的 `@keyframes` 名称与 transition 简写(用 Grep)。
5. **迭代(≤3 次)**:若明显不一致,基于**同一提示词**自我修正 build(不要改提示词),生成 v2/v3 并重新截图对比。超过 3 次停止。
6. **写结果**: `repro/<id>/result.hifi.json`:
   ```json
   {
     "id": "<id>",
     "url": "<url>",
     "attempts": <实际生成次数 1..3>",
     "passed": <bool: 静态首屏视觉是否高度一致>,
     "animOk": <bool: build 是否含提示词给的真实动画代码>,
     "lastBuild": "repro/<id>/build.hifi.v<最佳版本>.html",
     "notes": "<一行: 差异点 / 动画是否还原 / 不可达等>"
   }
   ```
   - 若提示词文件缺失或 target 缺失,写 `passed:false, attempts:0, notes:"missing input"`。

## 收尾
- 处理完本批所有 site 后,写 `repro/SUMMARY.hifi.<批次号>.md`,列出每站 passed/animOk/attempts/notes。
- 最后用 **≤100 字** 汇报:本批几站、通过几、动画还原几、失败站点与原因。

## 注意
- 真实截图 `target` 对部分获奖/WebGL 站是合成信息卡——这类对比的是「卡片本身」,属预期。
- 不要修改 `preview-data.json` 或 `prompt.hifi.md`,你只产出 build/截图/result。
- 网络/截图偶发失败就重试一次;仍失败记 `passed:false, notes:"screenshot failed"`。

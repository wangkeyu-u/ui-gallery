# 🖼️ 世界级 UI 预览画廊

收录 **230 项**主流 UI 组件库 / 设计系统 + 世界级获奖网站，每项都生成了本地预览图，可浏览、勾选、导出。**离线自包含，运行时零外部调用**——双击 `preview-gallery.html` 即用，不依赖任何服务器或 CDN。

## 内容

| 分区 | 数量 | 说明 |
|---|---|---|
| 📦 UI 组件库与设计系统 | 177 | React / Vue / Angular / Svelte / Solid / Qwik / Web Components / CSS / 大厂设计系统 |
| 🏆 世界级获奖项目 | 53 | Awwwards / FWA / CSSDA 等获奖网站，含可运行源码与真实预览 |

## 功能

- **分区浏览**：组件库与获奖项目分两块独立区域，默认全量摊开，纯滚动查看（无需搜索）。
- **类型切换**：全部 / 组件库 / 获奖项目。
- **框架下拉框**：按「前端框架 / 组件技术 / 样式方案 / 多框架」分组，显示每个框架的卡片数量。
- **主题下拉框**：按「3D / WebGL、Tailwind、Bootstrap、Material、企业 / 行业、无样式 / Headless、CSS / 原子化、作品集 / 创意、移动端」等品类分组。
- **点选 + 持久化**：点击卡片选中（高亮 + ✓），选择保存在 localStorage，刷新不丢。
- **复制已选**：一键复制所选项目名称 + 链接。
- **右下角小浮标**：选中栏缩在右下角，不遮挡页面。

## 使用

直接用浏览器打开 `preview-gallery.html` 即可（推荐 Chrome / Edge）。预览图位于 `previews/` 目录，与 HTML 同级。

> 在线版可访问 GitHub Pages（启用后见仓库 Settings → Pages）。

## 文件结构

```
preview-gallery.html   # 主画廊（自包含，数据内嵌 JSON）
preview-data.json      # 统一数据源（230 项）
previews/              # 230 张 PNG 预览图（11MB）
build-dataset.js       # 数据集构建脚本（旧库 + 新增 → preview-data.json）
test-functional.js     # 端到端功能测试（Playwright + 系统 Chrome）
verify-gallery.js      # 画廊验证脚本
ui-components-hub.html # 66 库组件交叉索引（单文件）
ui-awards-report.html  # 获奖作品调研报告 + 提示词
advanced-demo.html     # Three.js + GSAP 高级 Demo
awards-source-index.html # 各届获奖源码索引
hub/                   # 零依赖 Node 服务（自动收录 source/ 源码）
```

## 重新生成预览图

如需修改数据并重新生成预览图：

```bash
# 1. 编辑 build-dataset.js 中的数据数组
# 2. 重建数据集
node build-dataset.js
# 3. 生成预览图（需 Playwright + 系统 Chrome）
NODE_PATH=<playwright_module_path> node ~/.workbuddy/skills/preview-chooser/scripts/gen_previews.js
# 4. 重建画廊 HTML
node -e "const fs=require('fs');const t=fs.readFileSync('<template>','utf8');const d=fs.readFileSync('preview-data.json','utf8');fs.writeFileSync('preview-gallery.html',t.replace('/*ITEMS*/',d));"
# 5. 验证
node test-functional.js
```

> `source/` 目录（6 个可运行获奖项目克隆，~632MB）未包含在本仓库中。如需本地源码浏览，可按 `awards-source-index.html` 中的链接自行克隆。

## 验证

经 Playwright + 系统 Chrome 无头测试：230 项全部渲染、0 破碎图、0 控制台错误，分区 / 框架筛选 / 主题筛选 / 点选 / 复制 / 刷新持久化全部通过。

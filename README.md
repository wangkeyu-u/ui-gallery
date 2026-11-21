# UI Gallery

收录 230 个 UI 组件库、设计系统和获奖网站的静态画廊。支持框架/主题筛选、收藏和复制参考提示词。

[在线画廊](https://wangkeyu-u.github.io/ui-gallery/preview-gallery.html)，也可直接打开本地 `preview-gallery.html`。数据内嵌在页面中，预览图从 `previews/` 加载；访问条目的外部链接需要联网。

## 目录

```text
preview-data.json        画廊条目、来源链接、提示词及历史状态字段
gallery.template.html    页面模板
preview-gallery.html     GitHub Pages 使用的生成页面
previews/                条目预览图
scripts/                 构建、提取和数据维护工具
tests/                   Playwright 功能检查
reports/                 早期目录与复现报告
examples/                独立页面示例
hub/                     可选的本地源码浏览器
docs/                    维护说明和验证范围
```

## 构建与测试

Node.js 22+。从仓库根目录执行：

```bash
npm ci
npm run build
npx playwright install chromium
npm run test:embedded-data
npm test
npm run test:copy
```

也可设置 `CHROME_PATH` 使用已安装的 Chrome。构建只读取模板与已提交数据；不需要访问第三方站点。修改条目后，检查数据差异并重新生成页面。

功能检查覆盖卡片、图片、筛选、选择、持久化和复制。测试截图写入被忽略的 `.artifacts/`。它不评估提示词生成页面与原网站的视觉或动画一致程度。

`npm run test:embedded-data` 用 Chromium 解析真实模板生成的临时页面，检查提示词中的 `</script>`、HTML 注释、替换符号和 Unicode 分隔符能完整恢复为数据，且附加脚本不会执行。临时页面在测试结束后删除。

## 维护与记录

- [维护工具](docs/maintenance.md)：各脚本的输入、输出和运行范围。
- [历史验证范围](docs/validation.md)：现有状态字段与材料限制。
- [本地源码浏览器](hub/README.md)：需自行准备未入库的 `source/` 目录。
- [早期复现报告](reports/repro-report.html)和[获奖项目目录](reports/ui-awards-report.html)。

条目的原始项目和素材归各自作者所有；来源链接保存在数据中。提示词和 AI 辅助生成结果需要审查，不能保证复制后得到与原站一致的实现。

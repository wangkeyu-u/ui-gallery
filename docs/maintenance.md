# 数据维护工具

所有命令从仓库根目录运行。`npm run build` 是日常构建入口；不会重抓页面或更改条目。

| 工具 | 输入 | 输出/影响 |
| --- | --- | --- |
| `scripts/gen-gallery.js` | 模板、preview-data.json | preview-gallery.html |
| `scripts/build-dataset.js` | 早期 reports/ui-components-hub.html、脚本内条目、可选 repro 记录 | 重建 preview-data.json，可能覆盖后续编辑 |
| `scripts/merge-prompts.js` / `merge-hifi.js` | repro 下的提示词 | 更新数据中的 prompt |
| `scripts/agg-hifi.js` | repro 下的 result.hifi.json | 汇总历史结果字段，不自行执行视觉验收 |
| `scripts/assemble-hifi.js` | repro/accessible.json、anim.json、已有 NL 提示词、docs/prompt-guidelines.md | 组装 prompt.hifi.md、need-nl.json |
| `scripts/gen-hifi-batches.js` | 已提交提示词和预览图 | repro/hifi-batches.json，供人工安排评估 |
| `scripts/repro-read.js` / `repro-read2.js` | 单个 URL、输出文件路径 | 网页/动画/交互的观测记录，需要联网 |
| `scripts/read2-core.js` | 被读取器调用 | 共用提取模块，不是独立 CLI |
| `scripts/repro-shot.js` / `repro-shot-anim.js` | 本地 HTML、输出路径 | 静态或动画截图 |
| `scripts/run-anim-extract.js` | 并发数、可选清单路径 | 批量 anim.json，需要联网 |
| `scripts/rerun-read2.js` | 已有 anim.json 的条目 | 重新观测；失败时保留之前成功记录 |
| `scripts/gen-real-shots.js` | 条目 URL | 更新 previews/；空白时可能生成信息卡 |
| `scripts/gen-report.js` | repro/_rows.json | reports/repro-report.html |

`repro/accessible.json` 是用户准备的 `[{"id":"…","url":"https://…"}]` 清单，`repro/`、`source/` 与测试产物不提交。批量观测只应使用有权限访问的站点；本次结构清理未执行网络观测或重抓预览图。

示例：

```bash
mkdir -p repro/example
node scripts/repro-read2.js https://example.com repro/example/anim.json
node scripts/assemble-hifi.js repro/accessible.json
node scripts/run-anim-extract.js 4 repro/accessible.json
```

浏览器工具默认使用 Playwright Chromium，可用 `CHROME_PATH` 指定现有 Chrome。更新数据、历史字段或预览图后，应先审查差异，再重建画廊。状态字段来源于输入记录，不能代替人工核验。

# 见己 · Inner Atlas

一个把人格、依恋、亲密关系、原创情境探索和可选心理健康筛查放进同一流程的中文网站，包含静态前端与可选的DeepSeek综合分析后端。

**网站地址：[wangkeyu-u.github.io/ui-gallery/inner-atlas](https://wangkeyu-u.github.io/ui-gallery/inner-atlas/)**

最多178题、11章。默认142题；恋人／朋友／照顾者可关闭，PHQ-9／GAD-7与PCL-5默认关闭。报告默认进入AI综合分析：整合整份答卷、关系差异、背景与反例；本地计分结果作为可查阅的依据。AI未配置时仍可查看普通结果。

## 能做什么

- IPIP-50五维度；ECR-RS在总体、恋人、朋友和照顾者关系中的焦虑／回避。
- 8个原创探索维度、8个原创情境，不冒充验证量表。
- 可选PHQ-9、GAD-7；可选PCL-5只记录原始总分。
- 跳题、章节导航、回看修改、暂停、可选本机保存、JSON备份导入导出、Markdown报告、打印／另存PDF。
- 38条来源记录（原32条基础资料加6条评估方法资料）与工具取舍，明确哪些是原始研究、机构信息、开放教材、书籍目录或候选工具。
- DeepSeek综合画像、跨领域主题、12章分析、待验证循环、矛盾反例和行动；整合与复核两套提示词及27条策划知识摘要已包含。默认生成初稿后再作一次AI复核；这不是临床审核。
- 默认本地计分；主动授权才调用AI，健康题单独选择分享。无广告或第三方统计脚本。
- 开始答题前及报告页可查看分析服务状态，未配置时暂停AI提交；检测只读元数据。

## 重要测量限制

本项目译文、原创题和这个组合测试未做等值性、中国常模或临床验证。已发表的原版量表效度不能自动转移到本产品。结果不是诊断，也不能排除心理疾病。书籍研究限于公开目录／简介，不声称读完这些书。详情见[工具与许可](docs/INSTRUMENTS.md)和[研究取舍](docs/RESEARCH.md)。

计分检查与完整浏览器验证见[验证记录](docs/QA.md)。

## 本地运行

需要Node.js 22及以上，零npm运行时依赖。普通结果无需密钥；DeepSeek需要在后端配置密钥与独立访问口令，见[AI接入与部署](docs/AI_ANALYSIS.md)。

```bash
npm run dev
# 浏览器打开 http://localhost:4173
npm test
npm run build
npm run doctor  # 发布前检查后端配置，不输出密钥、不调用DeepSeek
```

不要直接以file://打开；ES模块需要HTTP服务。`dist/`是可部署的静态文件夹。

## GitHub Pages

本项目放在`wangkeyu-u/ui-gallery`仓库下的独立`inner-atlas/`目录，通过该仓库现有GitHub Pages发布。2026-11-16已通过GitHub文件接口恢复写入；原有画廊文件保持不变。DeepSeek后端仍需独立部署并配置密钥与访问口令，页面会显示实际就绪状态。

本目录自带`.github/workflows/pages.yml`作为独立部署配置。将本目录提取为新仓库根目录后，推送main会先执行计分测试，再构建及部署；嵌套目录内的工作流不会在父仓库自动运行。新仓库在Settings → Pages → Source选择GitHub Actions，或使用`gh api --method POST repos/OWNER/REPO/pages -f build_type=workflow`启用。静态前端没有平台私有依赖；AI调用还需要独立Node后端。请勿把DeepSeek密钥放在Pages中，详见[AI接入与部署](docs/AI_ANALYSIS.md)。

## 隐私

默认只在内存存答案，刷新即丢失；只有明确开启保存才写localStorage。共用设备、同源其他应用、浏览器扩展或能访问设备的程序可能读取它，这不等于加密存储。本地计分不上传答题值。主动确认AI分析后，选定范围的回答与背景会通过后端发送DeepSeek。后端不主动存储正文，但托管商和DeepSeek有各自处理政策。AI背景、报告与访问口令只在页面内存中；下载副本由用户管理。

## 维护入口

- `src/data.js`：题目、计分键、章节和选项。
- `src/engine.js`：严格计分、完整性、参考区间和备份验证。
- `src/app.js`：路由、答题、报告、隐私和导出。
- `src/sources.js`：可追溯来源及采纳／排除说明。
- `tests/engine.test.mjs`：计分和敏感边界回归检查。
- `ai/system-prompt.md`、`ai/review-prompt.md`、`ai/knowledge/psychology.v1.json`：综合提示词与有来源的27条知识摘要。
- `api/`：DeepSeek服务端调用与验证，密钥不进入前端。
- `docs/AI_ANALYSIS.md`：完整设计、配置与部署步骤。
- `scripts/doctor.mjs`：后端配置检查，可用 `npm run doctor -- --json` 输出不含秘密的检查结果。
- `src/ai-service.js`：服务连接检测，只有GET元数据请求。
- `docs/QA.md`：验证记录。

项目代码MIT；量表内容保留原作者归属及使用条件，见[工具与许可](docs/INSTRUMENTS.md)。

## 评估方法

综合分析增加持续时间、生活影响、具体互动和反例背景；区分自述事实与AI假设。专业工具方法对照、具体实现和验证缺口见[综合评估方法](docs/ASSESSMENT_METHOD.md)。

服务端密钥只使用Git忽略的`.env`或托管平台的秘密变量；不会放入前端或GitHub。真实模型检查与发现见[记录](docs/LIVE_EVALUATION.md)。`npm run eval:live`会调用付费API，不属于自动测试。

## 手机分享与虚拟人核对

支持同源后端的朋友演示模式，无需访客填写API配置；慢请求保活避免免费开发通道过早断开。见[免费分享](docs/FREE_SHARE.md)和[虚拟人盲测／实际对照](docs/PERSONA_CHECK.md)。

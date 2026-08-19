# Resume evidence

Source resume: `/Users/wangkeyu/Downloads/123简历.pdf` (SHA-256 `dc82b04dd8ca3d628c9b5c1b2cc17ed079c1b8356ea2079b7c44870be29ca4cb`). Status values are limited to `verified`, `implemented_unverified`, and `unsupported`.

## ui-data-quality — unsupported

> 独立设计并实现 UI Gallery（React、TypeScript、Vite），沉淀 232 条 UI 数据，建立质量准入体系，筛选出 155 个高质量可用参考

React/TypeScript/Vite and 232 unique records are verified, but rubric v2.0.0 independently yields 161, not 155, passing references.

- Code: `package.json`, `tsconfig.app.json`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx`, `src/gallery-schema.ts`, `scripts/quality-lib.ts`, `docs/quality-rubric.json`
- Reproduce: `npm run validate:data`; `npm run quality:data`; `npm run quality:data:check`; `npm run test -- --run src/quality-rubric.test.ts`
- Artifacts: `docs/generated/data-quality-report.json`, `docs/source-audit.json`
- Measurements: `{"total":232,"qualityPassed":161,"qualityFailed":71,"claimedQualityPassed":155}`

## visual-reconstruction — verified

> 基于 Playwright、Pixelmatch 与 SSIM 构建无模型依赖的视觉复刻验证系统，支持尺寸、溢出、颜色、结构、边缘及反作弊检测，3 个标准演示案例达到 0.9926–0.9996 SSIM

All three independently rendered cases fall inside the claimed interval and pass multidimensional and anti-cheat gates.

- Code: `public/reference-cases/`, `src/reconstructions/`, `tests/reconstruction.spec.ts`, `tests/reconstruction/metrics.ts`, `tests/reconstruction/anti-cheat.ts`
- Reproduce: `npm run test`; `npm run test:reconstructions:update-evidence`; `npm run test:reconstructions:review`; `npm run test:reconstructions`
- Artifacts: `docs/generated/reconstructions/report.json`, `docs/generated/reconstructions/ledger.reference.png`, `docs/generated/reconstructions/ledger.candidate.png`, `docs/generated/reconstructions/ledger.diff.png`, `docs/generated/reconstructions/ledger.edge-diff.png`, `docs/generated/reconstructions/orbit.reference.png`, `docs/generated/reconstructions/orbit.candidate.png`, `docs/generated/reconstructions/orbit.diff.png`, `docs/generated/reconstructions/orbit.edge-diff.png`, `docs/generated/reconstructions/fieldnotes.reference.png`, `docs/generated/reconstructions/fieldnotes.candidate.png`, `docs/generated/reconstructions/fieldnotes.diff.png`, `docs/generated/reconstructions/fieldnotes.edge-diff.png`
- Measurements: `{"claimedRange":{"min":0.9926,"max":0.9996},"actualRange":{"min":0.9944922833478732,"max":0.997806876905561},"cases":[{"id":"ledger","sourcePaths":{"reference":"public/reference-cases/ledger.html","candidate":["src/reconstructions/ReconstructionApp.tsx","src/reconstructions/reconstructions.css"]},"hashes":{"referenceSha256":"454a36a4e9f5f317083fe8a63ce4d46b532e2bf26ec11df7d5f02d60e8b200e1","candidateSha256":"a85b2f753c88c0eee1316e6257de0df5cc140309f60d5d7297f6b9a5f37cb3f0"},"dimensions":{"reference":[960,640],"candidate":[960,640],"matched":true},"overflow":{"reference":{"x":false,"y":false},"candidate":{"x":false,"y":false},"passed":true},"pixelmatch":{"diffCount":390,"diffRatio":0.000634765625},"edgePixelmatch":{"diffCount":2706,"diffRatio":0.004404296875},"ssim":0.9977235966762866,"color":{"referenceDominant":[{"rgb":[224,224,224],"share":0.95693359375},{"rgb":[32,32,32],"share":0.016484375},{"rgb":[160,64,32],"share":0.008040364583333333},{"rgb":[192,192,192],"share":0.0059375},{"rgb":[64,64,64],"share":0.0022395833333333334}],"candidateDominant":[{"rgb":[224,224,224],"share":0.959765625},{"rgb":[32,32,32],"share":0.015208333333333334},{"rgb":[160,64,32],"share":0.00662109375},{"rgb":[192,192,192],"share":0.0057421875},{"rgb":[96,96,96],"share":0.0017708333333333332}],"dominantMeanDelta":0.8106124174470484},"structure":{"tagCosineSimilarity":0.9892691104845074,"elementCountDelta":2,"maxDepthDelta":1},"antiCheat":{"images":0,"canvases":0,"backgroundImages":[],"passed":true},"artifacts":["ledger.reference.png","ledger.candidate.png","ledger.diff.png","ledger.edge-diff.png"]},{"id":"orbit","sourcePaths":{"reference":"public/reference-cases/orbit.html","candidate":["src/reconstructions/ReconstructionApp.tsx","src/reconstructions/reconstructions.css"]},"hashes":{"referenceSha256":"bc292f5b5f3909f2d60e64ef8b970799c31b3ce24c9a08d261ac411b1b4bf3e9","candidateSha256":"7a26332109d0504a4e9bbb897f13b2eb1eca28faa4cddf811d314ac7c9e33313"},"dimensions":{"reference":[960,640],"candidate":[960,640],"matched":true},"overflow":{"reference":{"x":false,"y":false},"candidate":{"x":false,"y":false},"passed":true},"pixelmatch":{"diffCount":407,"diffRatio":0.0006624348958333333},"edgePixelmatch":{"diffCount":1029,"diffRatio":0.0016748046875},"ssim":0.997806876905561,"color":{"referenceDominant":[{"rgb":[255,255,255],"share":0.39087890625},{"rgb":[224,255,255],"share":0.30654296875},{"rgb":[32,32,64],"share":0.1898828125},{"rgb":[128,160,224],"share":0.05541666666666667},{"rgb":[224,255,96],"share":0.030631510416666667}],"candidateDominant":[{"rgb":[255,255,255],"share":0.3911328125},{"rgb":[224,255,255],"share":0.3071419270833333},{"rgb":[32,32,64],"share":0.18900390625},{"rgb":[128,160,224],"share":0.05541666666666667},{"rgb":[224,255,96],"share":0.030631510416666667}],"dominantMeanDelta":0.301693912280369},"structure":{"tagCosineSimilarity":0.9958930423168653,"elementCountDelta":2,"maxDepthDelta":1},"antiCheat":{"images":0,"canvases":0,"backgroundImages":[],"passed":true},"artifacts":["orbit.reference.png","orbit.candidate.png","orbit.diff.png","orbit.edge-diff.png"]},{"id":"fieldnotes","sourcePaths":{"reference":"public/reference-cases/fieldnotes.html","candidate":["src/reconstructions/ReconstructionApp.tsx","src/reconstructions/reconstructions.css"]},"hashes":{"referenceSha256":"7413f86d3fa0d76125803f72d596d1f77516bf219a77422c35502aaa1ff04ee4","candidateSha256":"08dff8796a1c1393586541a57d1211ae147753f2104822d2c96350b8f0fc01ab"},"dimensions":{"reference":[960,640],"candidate":[960,640],"matched":true},"overflow":{"reference":{"x":false,"y":false},"candidate":{"x":false,"y":false},"passed":true},"pixelmatch":{"diffCount":613,"diffRatio":0.0009977213541666667},"edgePixelmatch":{"diffCount":3046,"diffRatio":0.004957682291666667},"ssim":0.9944922833478732,"color":{"referenceDominant":[{"rgb":[255,224,224],"share":0.7569010416666667},{"rgb":[224,192,160],"share":0.11897786458333333},{"rgb":[64,64,64],"share":0.06883463541666666},{"rgb":[224,224,192],"share":0.01845703125},{"rgb":[32,32,32],"share":0.012369791666666666}],"candidateDominant":[{"rgb":[255,224,224],"share":0.7595963541666667},{"rgb":[224,192,160],"share":0.11903645833333333},{"rgb":[64,64,64],"share":0.06849609375},{"rgb":[224,224,192],"share":0.018059895833333332},{"rgb":[224,96,64],"share":0.011360677083333333}],"dominantMeanDelta":3.1073003216293307},"structure":{"tagCosineSimilarity":0.9926198253344826,"elementCountDelta":2,"maxDepthDelta":1},"antiCheat":{"images":0,"canvases":0,"backgroundImages":[],"passed":true},"artifacts":["fieldnotes.reference.png","fieldnotes.candidate.png","fieldnotes.diff.png","fieldnotes.edge-diff.png"]}]}`

## regression-ci-cd — implemented_unverified

> 搭建数据一致性检查、桌面端与移动端浏览器回归测试及 GitHub Actions CI/CD 流程，实现自动构建及全量验证

Data consistency, desktop/mobile tests, CI gates and a GitHub Pages deployment job are implemented and pass locally. At evidence-generation time, no GitHub-hosted execution or deployment result was available, so hosted CI/CD remains unverified.

- Code: `scripts/validate-data.ts`, `tests/gallery.spec.ts`, `playwright.config.ts`, `.github/workflows/ci.yml`
- Reproduce: `npm run ci`; `npm run test:e2e`
- Artifacts: `dist/`, `test-results/`, `playwright-report/`
- Measurements: `{"localMatrix":["desktop-chromium 1280x820","Pixel 7 mobile-chromium"],"remoteWorkflowRun":false}`

## Data and comparator versions

- Gallery data `round2-232`: `ca57797c76b719bcf960d88a9ca5e8d8d7cd4121e96fe78d5ed8580f47a94945`
- Quality rubric `2.0.0`: `2d90639ae3a7da61b560e842abdefb59e8b337f69e2e2ce7a032daa47a9a5bd6`
- Reconstruction comparator `1.0.0`: `52db31f49d9b7e8226c182118bbc0fba926a12e60d60f08164c570412dda621a`

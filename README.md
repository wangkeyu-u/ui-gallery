# UI Gallery

232 个组件库、设计系统与获奖网站组成的本地策展画廊，使用 React 19 + TypeScript + Vite。现有 179 个组件库、53 个获奖项目、筛选、收藏持久化、复制提示词、仅看已选及移动端布局均被保留。

The gallery is a real React + TypeScript + Vite application with 232 uniquely identified entries and reproducible data, browser, reconstruction, and visual-quality gates.

## Quick start

Requires Node.js 22+.

```bash
npm ci
npm run dev
```

Production demo:

```bash
npm run build
npm run preview
```

`dist/` includes the application, bundled fonts, and all local preview images. Vite uses a relative base path so the result works below a GitHub Pages repository path.

## Quality commands

```bash
npm run validate:data   # Zod schema + duplicate IDs + 232 local images
npm run quality:data:check # reviewed per-item admission report
npm run test            # Vitest unit tests
npm run build           # validation + TypeScript + Vite production build
npm run test:e2e        # desktop and mobile Chromium device matrix
npm run test:visual     # Pixelmatch + SSIM against reviewed baselines
npm run test:reconstructions # three independent reference-to-React cases
npm run ci              # complete local quality gate
```

The browser matrix is intentionally desktop Chromium (1280×820) plus a Pixel 7 mobile profile. CI downloads Playwright's pinned Chromium binary. Pixel comparison uses one engine to avoid false failures from cross-engine font rasterization.

## Visual baseline review

Normal visual tests are read-only. They never replace a failed baseline.

To intentionally propose a visual change:

```bash
npm run test:visual:update
git diff --stat -- tests/visual/baselines
npm run test:visual
npm run test:visual:review
```

Review the changed PNGs and `visual-report/report.json`, then commit baseline changes separately or as an explicitly reviewed part of the UI change. The gate allows at most 0.5% Pixelmatch changed pixels and requires SSIM ≥ 0.99; PNG difference images and JSON metrics are emitted under `test-results/` and `visual-report/`.

The ordinary Gallery baseline check remains separate from reconstruction evidence. The reviewed three-case report records SSIM 0.997724 (Ledger), 0.997807 (Orbit), and 0.994492 (Fieldnotes). These values were computed from standalone reference HTML and separately authored React candidates with static and runtime anti-cheat gates. Run `npm run test:reconstructions:update-evidence` only when intentionally reviewing regenerated evidence, then `npm run test:reconstructions` for the normal CI gate.

## Data and project structure

```text
index.html                    Vite entry
src/App.tsx                  React gallery and interactions
src/gallery-schema.ts        Zod data contract
src/gallery-data.ts          validated JSON import
src/gallery-utils.ts         filter and persistence helpers
src/styles.css               responsive gallery presentation
preview-data.json            single source of 232 entries
previews/                    232 local preview images
tests/gallery.spec.ts        browser/device behavior tests
tests/visual.spec.ts         screenshot scenarios
tests/visual/baselines/      reviewed reference images
visual-report/report.json    generated machine-readable metrics (ignored)
.github/workflows/ci.yml     build/test/validation/visual gate
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for boundaries and determinism controls. Historical dataset and reproduction scripts remain in the repository for research continuity, but the shipped gallery runtime is the Vite application.

## Recovery

The migration was created from default branch `main` at `ee1bf47698f22772429ab3cbaa8a1d9dea7c35d8` on the isolated local branch `codex/interview-alignment`. No push or force operation is part of this work. Exact recovery commands are in [ROLLBACK.md](ROLLBACK.md).

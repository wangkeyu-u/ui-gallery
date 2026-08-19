# Architecture

## Runtime

`index.html` boots `src/main.tsx`, which renders the React application in `src/App.tsx`. The UI is fully data-driven: `preview-data.json` remains the single source for all 232 gallery entries, while the 232 preview images remain local under `previews/`.

The React layer owns filtering, selection persistence, clipboard actions, keyboard interaction, responsive rendering, and the back-to-top control. It does not duplicate or regenerate the gallery dataset.

## Data boundary

`src/gallery-schema.ts` defines a discriminated Zod schema for component-library and award-project entries. Both runtime import and `npm run validate:data` use this schema. The CLI validation adds filesystem checks for every referenced preview and returns a machine-readable JSON summary.

Invalid records, duplicate IDs, missing images, an unexpected item count, or an animation marked successful without a successful reproduction fail the quality gate before Vite builds.

Round 2 adds a target-count-independent admission rubric in `docs/quality-rubric.json`. It evaluates asset decoding and dimensions, source or license evidence, ID/link/image uniqueness, metadata completeness, and target usability. `docs/generated/data-quality-report.json` records every check and reason for all 232 entries. CI regenerates the report in memory and rejects stale committed evidence.

## Reproducible visual gate

Playwright runs the functional suite in two Chromium device profiles: desktop at 1280×820 and a Pixel 7 mobile profile. CI installs Playwright's pinned Chromium binary; local macOS runs may use installed Chrome when a CDN download is unavailable.

The visual suite uses Chromium at device scale factor 1 for desktop and mobile screenshots. Reproducibility controls are:

- Manrope and Noto Sans SC fonts are bundled with the app;
- locale is `zh-CN`, timezone is `Asia/Shanghai`, and color scheme is dark;
- viewport and device scale factor are explicit;
- `?visual=1` disables animation, transition, smooth scrolling, and caret rendering;
- screenshots wait for `document.fonts.ready` and the first gallery card;
- no network-hosted runtime assets are used.

`tests/visual/compare.ts` computes both Pixelmatch changed-pixel ratio and SSIM, writes PNG diff images, and feeds `visual-report/report.json`. The gates are:

- Pixelmatch changed-pixel ratio ≤ 0.5%;
- SSIM ≥ 0.99.

Only `npm run test:visual:update` can create or replace baselines. A normal failing run never writes baselines. Baseline changes must be inspected in `tests/visual/baselines/`, followed by `npm run test:visual` and `npm run test:visual:review`, before they are committed.

Browser engines rasterize fonts differently, so pixel metrics are intentionally measured on one pinned engine. Device-profile coverage tests responsive behavior without conflating engine rasterization with application regressions.

## Independent reconstruction evidence

Three standalone reference pages under `public/reference-cases/` are compared with separately authored React candidates under `src/reconstructions/`. The candidate cannot import reference code or assets. Static scans reject images, canvas pixel copying, base64/data URLs, reference imports, CSS URL images, and test overlays. Runtime checks require zero images, canvases, or URL backgrounds.

The comparator calculates screenshot dimensions, page overflow, dominant-color delta, DOM tag-vector similarity, full-image Pixelmatch, Sobel-edge Pixelmatch, and SSIM. It writes reference/candidate/diff/edge-diff PNGs and JSON. The capability gates are SSIM ≥ 0.99, changed pixels ≤ 0.5%, edge differences ≤ 1%, structure similarity ≥ 0.98, color delta ≤ 5, matched dimensions, no overflow, and clean anti-cheat results.

Normal CI writes transient reconstruction evidence under `test-results/`. Only `npm run test:reconstructions:update-evidence` refreshes reviewed evidence under `docs/generated/reconstructions/`.

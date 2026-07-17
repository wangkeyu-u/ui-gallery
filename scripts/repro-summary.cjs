// ============================================================
// repro-summary.cjs
// Aggregates existing repro/<id>/validation/report.json files into a
// single summary (repro/SUMMARY.md + repro/summary.json) WITHOUT
// re-running the browser. Useful for a bird's-eye view and for the
// final report. Only counts projects that actually have artifacts.
// ============================================================
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const { VALIDATOR_VERSION } = require('./repro-version.cjs');

function main() {
  const reproDir = path.join(root, 'repro');
  if (!fs.existsSync(reproDir)) { console.error('No repro/ directory found.'); process.exit(1); }
  const projects = JSON.parse(fs.readFileSync(path.join(root, 'src/data/ui-projects.json'), 'utf8'));

  const rows = [];
  for (const p of projects) {
    const reportPath = path.join(reproDir, p.id, 'validation', 'report.json');
    if (!fs.existsSync(reportPath)) continue;
    let r;
    try { r = JSON.parse(fs.readFileSync(reportPath, 'utf8')); } catch (_) { continue; }
    const hasArtifacts = ['reference.png', 'candidate.png', 'diff.png', 'diff-overlay.png', 'report.html']
      .every((f) => fs.existsSync(path.join(reproDir, p.id, 'validation', f)));
    rows.push({
      id: p.id,
      name: p.name,
      status: r.status,
      ssim: r.ssim,
      pixel: r.pixelDifference,
      color: r.colorDifference,
      edge: r.edgeDifference,
      overflow: r.overflowPixels,
      hasArtifacts,
      validatedAt: r.validatedAt,
      validatorVersion: r.validatorVersion,
    });
  }

  rows.sort((a, b) => {
    const order = { passed: 0, 'needs-review': 1, failed: 2, error: 3 };
    return (order[a.status] ?? 9) - (order[b.status] ?? 9) || a.id.localeCompare(b.id);
  });

  const summary = {
    generatedAt: new Date().toISOString(),
    validatorVersion: VALIDATOR_VERSION,
    total: rows.length,
    passed: rows.filter((r) => r.status === 'passed').length,
    failed: rows.filter((r) => r.status === 'failed').length,
    needsReview: rows.filter((r) => r.status === 'needs-review').length,
    withArtifacts: rows.filter((r) => r.hasArtifacts).length,
    projects: rows,
  };
  fs.writeFileSync(path.join(reproDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);

  const md = ['# 复刻验证汇总', '',
    `> 生成于 ${summary.generatedAt} · 验证器 ${summary.validatorVersion}`,
    '', `共 ${summary.total} 个项目有验证产物：通过 ${summary.passed} · 未通过 ${summary.failed} · 需复核 ${summary.needsReview} · 产物齐全 ${summary.withArtifacts}。`,
    '', '| 项目 | 名称 | 状态 | SSIM | 像素差异 | 颜色差异 | 边缘差异 | 溢出 | 产物 | 验证时间 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...rows.map((r) => `| ${r.id} | ${r.name} | ${r.status} | ${r.ssim} | ${(r.pixel * 100).toFixed(1)}% | ${r.color} | ${r.edge} | ${r.overflow}px | ${r.hasArtifacts ? '✓' : '✗'} | ${r.validatedAt || '-'} |`),
    '',
    '运行 `npm run repro:validate -- --id <id> --candidate <path> --write-data` 验证单个项目；`npm run repro:validate-all` 批量验证。',
  ].join('\n');
  fs.writeFileSync(path.join(reproDir, 'SUMMARY.md'), md + '\n');

  console.log(`汇总 ${summary.total} 个项目：通过 ${summary.passed} / 未通过 ${summary.failed} / 需复核 ${summary.needsReview}（产物齐全 ${summary.withArtifacts}）`);
  console.log('已写入 repro/SUMMARY.md 与 repro/summary.json');
}

main();

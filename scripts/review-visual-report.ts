import { readFile } from 'node:fs/promises';

interface Result { name: string; status: string; pixelDiffRatio: number; ssim: number }
const report = JSON.parse(await readFile('visual-report/report.json', 'utf8')) as { passed: boolean; results: Result[] };
console.table(report.results.map((result) => ({
  scenario: result.name,
  status: result.status,
  pixelDiffPercent: `${(result.pixelDiffRatio * 100).toFixed(4)}%`,
  ssim: result.ssim.toFixed(6),
})));
if (!report.passed) process.exitCode = 1;
if (report.results.some((result) => result.status === 'baseline-created')) {
  console.log('Baselines were created or updated. Inspect tests/visual/baselines and git diff --stat before committing.');
}

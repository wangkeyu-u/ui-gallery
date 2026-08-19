import { readFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';

const report = JSON.parse(await readFile('docs/generated/reconstructions/report.json', 'utf8')) as {
  results: Array<{ id: string; ssim: number; dimensions: { matched: boolean }; overflow: { passed: boolean }; antiCheat: { passed: boolean } }>;
};
if (report.results.length !== 3) throw new Error(`Expected three reconstruction results, received ${report.results.length}`);
for (const result of report.results) {
  if (!result.dimensions.matched || !result.overflow.passed || !result.antiCheat.passed) throw new Error(`${result.id} failed a capability or anti-cheat gate`);
}
const min = Math.min(...report.results.map((result) => result.ssim));
const max = Math.max(...report.results.map((result) => result.ssim));
console.log(JSON.stringify({ cases: report.results.length, ssim: report.results.map(({ id, ssim }) => ({ id, ssim })), range: { min, max } }, null, 2));
if (process.argv.includes('--compare-transient')) {
  const transient = JSON.parse(await readFile('test-results/reconstructions/report.json', 'utf8'));
  if (!isDeepStrictEqual(transient, report)) throw new Error('Transient reconstruction report differs from reviewed evidence. Run the explicit evidence update and review artifacts.');
}

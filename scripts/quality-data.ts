import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buildQualityReport, type QualityItem } from './quality-lib.ts';

const root = process.cwd();
const check = process.argv.includes('--check');
const dataBytes = await readFile(path.join(root, 'preview-data.json'));
const rubricBytes = await readFile(path.join(root, 'docs/quality-rubric.json'));
const items = JSON.parse(dataBytes.toString()) as QualityItem[];
const rubric = JSON.parse(rubricBytes.toString());
const report = await buildQualityReport(items, root, rubric, dataBytes);
const serialized = `${JSON.stringify(report, null, 2)}\n`;
const output = path.join(root, 'docs/generated/data-quality-report.json');

if (check) {
  const committed = await readFile(output, 'utf8').catch(() => '');
  if (committed !== serialized) {
    console.error('Data quality report is missing or stale. Run npm run quality:data and review the diff.');
    process.exit(1);
  }
} else {
  await writeFile(output, serialized);
}

console.log(JSON.stringify(report.summary, null, 2));

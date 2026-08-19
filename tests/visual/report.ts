import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { VisualResult } from './compare';

const reportDir = path.resolve('visual-report');
const pendingFile = path.join(reportDir, '.results.json');
const reportFile = path.join(reportDir, 'report.json');

export async function resetVisualReport() {
  await mkdir(reportDir, { recursive: true });
  await writeFile(pendingFile, '[]\n');
}

export async function writeVisualReport(result: VisualResult) {
  const results: VisualResult[] = JSON.parse(await readFile(pendingFile, 'utf8'));
  results.push(result);
  await writeFile(pendingFile, `${JSON.stringify(results, null, 2)}\n`);
}

export async function finalizeVisualReport() {
  const results: VisualResult[] = JSON.parse(await readFile(pendingFile, 'utf8'));
  const generatedAt = process.env.SOURCE_DATE_EPOCH
    ? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toISOString()
    : new Date().toISOString();
  const report = {
    schemaVersion: 1,
    generatedAt,
    browser: 'chromium',
    deterministic: { fonts: 'self-hosted', locale: 'zh-CN', timezone: 'Asia/Shanghai', animations: 'disabled', deviceScaleFactor: 1 },
    passed: results.every((item) => item.pixelDiffRatio <= item.thresholds.pixelDiffRatio && item.ssim >= item.thresholds.ssim),
    results,
  };
  await writeFile(reportFile, `${JSON.stringify(report, null, 2)}\n`);
}

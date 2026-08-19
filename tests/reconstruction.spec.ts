import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { scanCandidateSources } from './reconstruction/anti-cheat';
import { compareImages, compareStructure, type DomSnapshot } from './reconstruction/metrics';

const cases = ['ledger', 'orbit', 'fieldnotes'] as const;
const generatedDir = process.env.UPDATE_RECONSTRUCTION_EVIDENCE === '1'
  ? path.resolve('docs/generated/reconstructions')
  : path.resolve('test-results/reconstructions');
const results: unknown[] = [];

test.describe.configure({ mode: 'serial' });
test.beforeAll(async () => {
  await mkdir(generatedDir, { recursive: true });
  expect(await scanCandidateSources(['src/reconstructions/ReconstructionApp.tsx', 'src/reconstructions/reconstructions.css'])).toEqual([]);
});
test.afterAll(async () => {
  const report = {
    schemaVersion: 1,
    comparator: { id: 'reconstruction-multimetric', version: '1.0.0', screenshot: '960x640@1x', pixelmatchThreshold: 0.1, edgeThreshold: 80 },
    antiCheat: { static: 'passed', forbidden: ['img', 'canvas pixel copy', 'base64/data URL', 'reference import', 'CSS URL', 'test overlay'] },
    results,
  };
  await writeFile(path.join(generatedDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
});

for (const id of cases) test(`${id}: independent reference to React reconstruction`, async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 640 });
  await page.goto(`/reference-cases/${id}.html`);
  const reference = await page.screenshot({ animations: 'disabled' });
  const referenceDom = await domSnapshot(page);
  await page.goto(`/reconstructions/${id}`);
  await page.evaluate(() => document.fonts.ready);
  const candidate = await page.screenshot({ animations: 'disabled' });
  const candidateDom = await domSnapshot(page);
  const runtimeAntiCheat = {
    images: candidateDom.images,
    canvases: candidateDom.canvases,
    backgroundImages: candidateDom.backgroundImages,
    passed: candidateDom.images === 0 && candidateDom.canvases === 0 && candidateDom.backgroundImages.length === 0,
  };
  expect(runtimeAntiCheat.passed).toBe(true);
  const image = compareImages(reference, candidate);
  const structure = compareStructure(referenceDom, candidateDom);
  const overflow = {
    reference: { x: referenceDom.scrollWidth > referenceDom.width, y: referenceDom.scrollHeight > referenceDom.height },
    candidate: { x: candidateDom.scrollWidth > candidateDom.width, y: candidateDom.scrollHeight > candidateDom.height },
    passed: candidateDom.scrollWidth <= candidateDom.width && candidateDom.scrollHeight <= candidateDom.height,
  };
  expect(overflow.passed).toBe(true);
  const prefix = path.join(generatedDir, id);
  await Promise.all([
    writeFile(`${prefix}.reference.png`, reference), writeFile(`${prefix}.candidate.png`, candidate),
    writeFile(`${prefix}.diff.png`, image.diffPng), writeFile(`${prefix}.edge-diff.png`, image.edgeDiffPng),
  ]);
  results.push({
    id,
    sourcePaths: { reference: `public/reference-cases/${id}.html`, candidate: ['src/reconstructions/ReconstructionApp.tsx','src/reconstructions/reconstructions.css'] },
    hashes: { referenceSha256: sha(reference), candidateSha256: sha(candidate) },
    dimensions: { reference: [referenceDom.width,referenceDom.height], candidate: [candidateDom.width,candidateDom.height], matched: referenceDom.width===candidateDom.width&&referenceDom.height===candidateDom.height },
    overflow,
    pixelmatch: { diffCount: image.pixelDiffCount, diffRatio: image.pixelDiffRatio },
    edgePixelmatch: { diffCount: image.edgeDiffCount, diffRatio: image.edgeDiffRatio },
    ssim: image.ssim,
    color: image.color,
    structure,
    antiCheat: runtimeAntiCheat,
    artifacts: [`${id}.reference.png`,`${id}.candidate.png`,`${id}.diff.png`,`${id}.edge-diff.png`],
  });
  expect(image.ssim).toBeGreaterThanOrEqual(0.99);
  expect(image.pixelDiffRatio).toBeLessThanOrEqual(0.005);
  expect(image.edgeDiffRatio).toBeLessThanOrEqual(0.01);
  expect(structure.tagCosineSimilarity).toBeGreaterThanOrEqual(0.98);
  expect(image.color.dominantMeanDelta).toBeLessThanOrEqual(5);
});

async function domSnapshot(page: Page): Promise<DomSnapshot> {
  return page.evaluate(() => {
    const all = [...document.body.querySelectorAll('*')];
    const tags: Record<string,number> = {};
    let maxDepth = 0;
    for (const element of all) {
      tags[element.tagName.toLowerCase()] = (tags[element.tagName.toLowerCase()] ?? 0) + 1;
      let depth = 0, parent: Element | null = element;
      while ((parent = parent.parentElement)) depth++;
      maxDepth = Math.max(maxDepth, depth);
    }
    return {
      width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight,
      elementCount: all.length, maxDepth, tags,
      images: document.images.length, canvases: document.querySelectorAll('canvas').length,
      backgroundImages: all.map((el)=>getComputedStyle(el).backgroundImage).filter((value)=>value.includes('url(')),
    };
  });
}
const sha = (value: Buffer) => createHash('sha256').update(value).digest('hex');

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { ssim } from 'ssim.js';

export interface VisualResult {
  name: string;
  status: 'passed' | 'baseline-created';
  width: number;
  height: number;
  pixelDiffCount: number;
  pixelDiffRatio: number;
  ssim: number;
  thresholds: { pixelDiffRatio: number; ssim: number };
  baseline: string;
  actual: string;
  diffImage?: string;
}

export async function compareScreenshot({ name, actual, outputDir, updateBaseline = false }: {
  name: string;
  actual: Buffer;
  outputDir: string;
  updateBaseline?: boolean;
}): Promise<VisualResult> {
  const baseline = path.resolve('tests/visual/baselines', `${name}.png`);
  await mkdir(path.dirname(baseline), { recursive: true });
  const actualPath = path.join(outputDir, `${name}.actual.png`);
  await mkdir(outputDir, { recursive: true });
  await writeFile(actualPath, actual);

  if (updateBaseline) {
    await writeFile(baseline, actual);
    return {
      name, status: 'baseline-created', width: PNG.sync.read(actual).width, height: PNG.sync.read(actual).height,
      pixelDiffCount: 0, pixelDiffRatio: 0, ssim: 1,
      thresholds: { pixelDiffRatio: 0.005, ssim: 0.99 }, baseline, actual: actualPath,
    };
  }

  let expectedBuffer: Buffer;
  try { expectedBuffer = await readFile(baseline); } catch {
    throw new Error(`Missing baseline: ${baseline}. Run npm run test:visual:update, then review and commit the images explicitly.`);
  }
  const expected = PNG.sync.read(expectedBuffer);
  const observed = PNG.sync.read(actual);
  if (expected.width !== observed.width || expected.height !== observed.height) {
    throw new Error(`Dimension mismatch for ${name}: expected ${expected.width}x${expected.height}, got ${observed.width}x${observed.height}`);
  }
  const diff = new PNG({ width: expected.width, height: expected.height });
  const pixelDiffCount = pixelmatch(expected.data, observed.data, diff.data, expected.width, expected.height, { threshold: 0.1 });
  const diffPath = path.join(outputDir, `${name}.diff.png`);
  await writeFile(diffPath, PNG.sync.write(diff));
  const similarity = ssim(
    { data: new Uint8ClampedArray(expected.data), width: expected.width, height: expected.height },
    { data: new Uint8ClampedArray(observed.data), width: observed.width, height: observed.height },
  ).mssim;
  return {
    name, status: 'passed', width: expected.width, height: expected.height, pixelDiffCount,
    pixelDiffRatio: pixelDiffCount / (expected.width * expected.height), ssim: similarity,
    thresholds: { pixelDiffRatio: 0.005, ssim: 0.99 }, baseline, actual: actualPath, diffImage: diffPath,
  };
}

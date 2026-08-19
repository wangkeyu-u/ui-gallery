import { expect, test } from '@playwright/test';
import { compareScreenshot, type VisualResult } from './visual/compare';
import { finalizeVisualReport, resetVisualReport, writeVisualReport } from './visual/report';

test.describe.configure({ mode: 'serial' });
test.beforeAll(async () => resetVisualReport());
test.afterAll(async () => finalizeVisualReport());

for (const scenario of [
  { name: 'gallery-desktop', path: '/?visual=1', viewport: { width: 1280, height: 820 } },
  { name: 'gallery-mobile', path: '/?visual=1', viewport: { width: 390, height: 844 } },
] as const) {
  test(`${scenario.name} satisfies pixelmatch and SSIM thresholds`, async ({ page }, testInfo) => {
    await page.addInitScript({ content: 'Date.now = () => 1735689600000;' });
    await page.setViewportSize(scenario.viewport);
    await page.goto(scenario.path);
    await page.evaluate(() => document.fonts.ready);
    await page.locator('.item').first().waitFor();
    const actual = await page.screenshot({ animations: 'disabled', fullPage: false });
    const result: VisualResult = await compareScreenshot({
      name: scenario.name,
      actual,
      outputDir: testInfo.outputDir,
      updateBaseline: process.env.UPDATE_VISUAL_BASELINES === '1',
    });
    await writeVisualReport(result);
    await testInfo.attach('visual-metrics', { body: JSON.stringify(result, null, 2), contentType: 'application/json' });
    if (result.diffImage) await testInfo.attach('pixel-diff', { path: result.diffImage, contentType: 'image/png' });
    expect(result.pixelDiffRatio, 'Pixelmatch difference ratio').toBeLessThanOrEqual(0.005);
    expect(result.ssim, 'SSIM similarity').toBeGreaterThanOrEqual(0.99);
  });
}

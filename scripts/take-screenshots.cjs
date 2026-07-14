/**
 * Batch screenshot taker — uses Playwright to capture screenshots
 * of all candidate sites at 1280x820
 */

const { chromium } = require('/Users/wangkeyu/.workbuddy/binaries/node/workspace/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PREVIEWS_DIR = path.join(__dirname, '..', 'previews');

// Load accessible sites
const sites = JSON.parse(fs.readFileSync(path.join(__dirname, 'accessible-sites.json'), 'utf8'));

// Filter out sites that already have screenshots
const existingData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'preview-data.json'), 'utf8'));
const existingIds = new Set(existingData.map(d => d.id));

// Also filter duplicates from our candidate list
const dupeNames = new Set(['extra-active-theory', 'extra-buck', 'extra-huge', 'extra-resn', 'prod-shadcn', 'extra-github']);

const toScreenshot = sites.filter(s => !existingIds.has(s.id) && !dupeNames.has(s.id));

console.log(`Sites to screenshot: ${toScreenshot.length}`);

(async () => {
  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 820 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'en-US',
  });

  let success = 0;
  let failed = 0;

  for (let i = 0; i < toScreenshot.length; i++) {
    const site = toScreenshot[i];
    const screenshotPath = path.join(PREVIEWS_DIR, `${site.id}.png`);

    // Skip if already exists
    if (fs.existsSync(screenshotPath)) {
      console.log(`[${i + 1}/${toScreenshot.length}] SKIP (exists): ${site.id}`);
      continue;
    }

    const page = await context.newPage();
    try {
      await page.goto(site.url, {
        waitUntil: 'domcontentloaded',
        timeout: 25000,
      });
      
      // Wait for page to settle (fonts, images, animations)
      await page.waitForTimeout(3000);
      
      // Try to close cookie banners
      try {
        const cookieBtns = await page.$$('text=/Accept|Accept all|OK|Got it|Close|Dismiss|Reject/i');
        if (cookieBtns.length > 0) {
          await cookieBtns[0].click().catch(() => {});
          await page.waitForTimeout(500);
        }
      } catch {}

      await page.screenshot({
        path: screenshotPath,
        type: 'png',
      });
      
      success++;
      console.log(`[${i + 1}/${toScreenshot.length}] ✓ ${site.id} | ${site.name}`);
    } catch (error) {
      failed++;
      console.log(`[${i + 1}/${toScreenshot.length}] ✗ ${site.id} | ${error.message.slice(0, 80)}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log(`\n=== DONE ===`);
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total new screenshots: ${success}`);
})();

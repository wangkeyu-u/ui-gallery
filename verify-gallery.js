const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('console:' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror:' + e.message));

  // dispatch a real click without coordinate-based actionability (avoids sticky-bar overlap in headless)
  const clk = (sel) => page.evaluate(s => {
    const el = document.querySelector(s);
    if (!el) throw new Error('no el: ' + s);
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }, sel);

  await page.goto('file://' + path.resolve('preview-gallery.html'), { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  const broken = await page.$$eval('.item img', els => els.filter(e => e.naturalWidth === 0).map(e => e.alt));
  const total = await page.$$eval('.item', els => els.length);
  const stats = await page.$eval('#stats', el => el.textContent.replace(/\s+/g, ' ').trim());

  await clk('#kindSeg button[data-kind="proj"]');
  await page.waitForTimeout(300);
  const projN = await page.$$eval('.item', els => els.length);
  const projSub = await page.$eval('.item .vendor', el => el.textContent).catch(() => '');
  await clk('#kindSeg button[data-kind="all"]');
  await page.waitForTimeout(200);

  await clk('#fwChips .chip[data-fw="React"]');
  await page.waitForTimeout(300);
  const reactN = await page.$$eval('.item', els => els.length);
  await clk('#fwChips .chip[data-fw=""]');
  await page.waitForTimeout(200);

  const themeExpr = '#themeChips .chip[data-th]:not([data-th=""])';
  const tname = await page.$eval(themeExpr, el => el.getAttribute('data-th')).catch(() => null);
  let themeN = -1;
  if (tname) {
    await clk(themeExpr);
    await page.waitForTimeout(300);
    themeN = await page.$$eval('.item', els => els.length);
    await clk('#themeChips .chip[data-th=""]');
    await page.waitForTimeout(200);
  }

  await page.fill('#q', 'shadcn');
  await page.waitForTimeout(300);
  const searchN = await page.$$eval('.item', els => els.length);
  await page.fill('#q', '');
  await page.waitForTimeout(200);

  await clk('.item');
  await page.waitForTimeout(200);
  const selN = await page.$eval('#selN', el => el.textContent);
  const barOn = await page.$eval('#bar', el => el.classList.contains('on'));

  console.log('--- VERIFY ---');
  console.log('total cards:', total);
  console.log('broken images:', broken.length, broken.slice(0, 5));
  console.log('stats:', stats);
  console.log('proj count:', projN, '| sample subtitle:', projSub);
  console.log('react count:', reactN);
  console.log('theme "' + tname + '" ->', themeN);
  console.log('search "shadcn" ->', searchN);
  console.log('selection selN:', selN, '| bar on:', barOn);
  console.log('console/page errors:', errors.length, errors.slice(0, 5));

  await page.screenshot({ path: 'preview-gallery-verify.png' });
  await browser.close();
  const ok = broken.length === 0 && errors.length === 0 && total === 230 &&
             projN > 40 && reactN > 20 && searchN > 0 && barOn && themeN > 0;
  console.log(ok ? 'RESULT: PASS' : 'RESULT: FAIL');
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error('FATAL', e); process.exit(2); });

const { chromium } = require('playwright');
const EXEC = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
(async () => {
  const errs = [];
  const b = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox', '--use-gl=swiftshader'] });
  const p = await b.newPage();
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', e => errs.push('PAGEERR:' + e.message));
  await p.goto('file://' + process.cwd() + '/preview-gallery.html');
  await p.waitForTimeout(1000);
  const btns = await p.$$eval('.cprompt', els => els.length);
  let ok = true, txt = '';
  try { await p.click('.cprompt'); await p.waitForTimeout(200); txt = await p.$eval('.cprompt', e => e.textContent); }
  catch (e) { ok = false; errs.push('CLICK:' + e.message); }
  console.log('cprompt buttons:', btns, '| click ok:', ok, '| textAfter:', JSON.stringify(txt));
  console.log('console errors:', errs.length ? errs.slice(0, 5) : 'none');
  await b.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });

// repro-shot.js — 把本地 HTML 文件按 1280x820 视口截图成 PNG（与真实站点参考图同视口）
// 用法: node repro-shot.js "repro/<id>/build.v1.html" "repro/<id>/build.v1.png"
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const file = process.argv[2];
const out = process.argv[3];
const W = 1280, H = 820;

(async () => {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-webgl', '--hide-scrollbars', '--disable-blink-features=AutomationControlled']
  });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  try {
    await page.goto('file://' + path.resolve(file), { waitUntil: 'networkidle', timeout: 20000 });
  } catch (e) {
    await page.goto('file://' + path.resolve(file), { waitUntil: 'load', timeout: 20000 });
  }
  await page.waitForTimeout(900);
  await page.screenshot({ path: out, type: 'png' });
  await browser.close();
  console.log('shot', out);
})();

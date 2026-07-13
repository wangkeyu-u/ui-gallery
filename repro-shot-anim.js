// repro-shot-anim.js — 对本地重建 HTML 抓多帧,验证动画是否运行
// 用法: node repro-shot-anim.js "repro/<id>/build.hifi.html" "repro/<id>/anim-frames"
// 输出 anim-frames.0.png / .1.png / .2.png (0ms / 600ms / 1600ms)
const { chromium } = require('playwright');
const file = process.argv[2];
const outPrefix = process.argv[3];
(async () => {
  const b = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--hide-scrollbars']
  });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.goto('file://' + require('path').resolve(file));
  const waits = [0, 600, 1000]; // 累积到 0 / 600 / 1600 ms
  for (let i = 0; i < waits.length; i++) {
    await p.waitForTimeout(waits[i]);
    await p.screenshot({ path: outPrefix + '.' + i + '.png' });
  }
  await b.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });

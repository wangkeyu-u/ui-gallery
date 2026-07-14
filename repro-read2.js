// repro-read2.js — 动画 + 交互感知读取器(单站点,命令行版)
// 复用 read2-core.js 的提取逻辑,额外写入 :hover/:active/:focus 终态到 anim.json.interactions。
// 用法: node repro-read2.js "<url>" "repro/<id>/anim.json"
const fs = require('fs');
const { chromium } = require('playwright');
const { LAUNCH_ARGS, extract, navigate } = require('./read2-core');

const url = process.argv[2];
const outJson = process.argv[3];

(async () => {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: LAUNCH_ARGS
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.addInitScript(() => { try { Object.defineProperty(navigator, 'webdriver', { get: () => false }); } catch (e) {} });
  const info = { url, ok: false, err: null };
  try {
    await navigate(page, url);
    const data = await extract(page);
    Object.assign(info, data);
  } catch (e) {
    info.err = String(e && e.message ? e.message : e).split('\n')[0];
  }
  fs.writeFileSync(outJson, JSON.stringify(info, null, 2));
  await browser.close();
  console.log('ok=' + info.ok + ' interactions=' + ((info.interactions || []).length) + ' url=' + url);
})();

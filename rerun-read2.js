// rerun-read2.js — 全量安全重跑交互提取
// 单浏览器 + 4 并发页池;对全部已有 anim.json 的站点重跑 read2-core 提取(含 interactions),
// 安全合并:新跑成功则整体覆盖(含 interactions 字段);新跑失败但原文件 ok:true 则保留原文件不覆盖。
// 用法: node rerun-read2.js
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { LAUNCH_ARGS, extract, navigate } = require('./read2-core');

const DATA = 'preview-data.json';
const items = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const targets = items.filter(it => fs.existsSync(path.join('repro', it.id, 'anim.json')) && it.link);
const CONC = 4;
const LOG = '/tmp/rerun-read2.log';
const log = [];
function logLine(s) { log.push(s); fs.writeFileSync(LOG, log.join('\n') + '\n'); }

(async () => {
  logLine('START ' + new Date().toISOString() + ' targets=' + targets.length);
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: LAUNCH_ARGS
  });
  let done = 0;
  const queue = [...targets];
  async function worker() {
    while (queue.length) {
      const it = queue.shift();
      const id = it.id, url = it.link;
      const animPath = path.join('repro', id, 'anim.json');
      let prev = null; try { prev = JSON.parse(fs.readFileSync(animPath, 'utf8')); } catch (e) {}
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await page.addInitScript(() => { try { Object.defineProperty(navigator, 'webdriver', { get: () => false }); } catch (e) {} });
      let info = { url, id, ok: false, err: null };
      try {
        await navigate(page, url);
        const data = await extract(page);
        Object.assign(info, data);
      } catch (e) { info.err = String(e && e.message ? e.message : e).split('\n')[0]; }
      await page.close().catch(() => {});
      if (info.ok) {
        fs.writeFileSync(animPath, JSON.stringify(info, null, 2));
      } else if (prev && prev.ok) {
        logLine(`KEEP ${id} (new failed: ${info.err})`);
        done++; continue;
      } else {
        fs.writeFileSync(animPath, JSON.stringify(info, null, 2));
      }
      done++;
      logLine(`DONE ${done}/${targets.length} ${id} ok=${info.ok} inter=${(info.interactions || []).length} ${info.err ? ('err=' + info.err) : ''}`);
    }
  }
  const workers = [];
  for (let i = 0; i < CONC; i++) workers.push(worker());
  await Promise.all(workers);
  await browser.close();
  logLine('ALL DONE ' + new Date().toISOString() + ' ' + done + '/' + targets.length);
})().catch(e => { logLine('FATAL ' + String(e && e.message ? e.message : e)); process.exit(1); });

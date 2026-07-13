// gen-real-shots.js — 逐个访问每个条目的真实网址，把真实网站截图存到 previews/<id>.png
// 覆盖原先的合成风格卡。跳过本地已克隆的 8 个(proj-*.png，本就是真实运行截图)。
// 若实拍截图接近空白(纯 WebGL/动画站在无头下常渲染成黑屏)，回退为信息卡(名称/机构/奖项/技术)以便辨认。
// 兼容 TEST=1 仅跑少量做冒烟测试。
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ITEMS = JSON.parse(fs.readFileSync('preview-data.json', 'utf8'));
const OUT_DIR = 'previews';
const SKIP_PREFIX = 'previews/proj-';       // 保留本地克隆真实截图
const CONC = 4;                             // 并发页面数
const VIEWPORT = { width: 1280, height: 820 };
const WAIT = 3200;                          // 加载后等待(动画/懒加载)
const RETRY_WAIT = 2600;                    // 空白时二次等待
const TIMEOUT = 25000;
const BLANK_KB = 24;                        // 小于此值视为接近空白

const targets = ITEMS.filter(it =>
  !it.img.startsWith(SKIP_PREFIX) &&
  typeof it.link === 'string' &&
  /^https?:\/\//.test(it.link)
);

function pickAccent(s) {
  let h = 0; for (let i = 0; i < (s || '').length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return `hsl(${h} 70% 55%)`;
}

function infoCardHtml(it) {
  const accent = it.accent || pickAccent(it.name);
  const isProj = it.kind === 'proj';
  const sub = isProj ? ((it.agency || '') + (it.year ? ' · ' + it.year : '')) : ((it.vendor || '') + (it.theme ? ' · ' + it.theme : ''));
  const tags = (isProj ? (it.tech || []) : (it.chips || [])).slice(0, 6);
  const tagsHtml = tags.map(t => `<span>${t}</span>`).join('');
  const badge = isProj ? `<div class="badge">★ ${it.award || '获奖'}</div>` : `<div class="badge lib">库</div>`;
  return `<!doctype html><html lang="zh"><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{height:100%}
  body{font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;background:#0e1018;color:#eef;display:flex;align-items:center;justify-content:center;padding:40px}
  .card{width:100%;max-width:1080px;aspect-ratio:1280/820;border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:46px;background:
     radial-gradient(900px 500px at 88% -10%, ${accent}22, transparent 60%),
     linear-gradient(160deg,#13161f,#0c0e15);position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between}
  .top{display:flex;justify-content:space-between;align-items:flex-start;gap:20px}
  .kind{font-size:13px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:${accent}}
  .badge{font-size:12px;font-weight:800;padding:6px 12px;border-radius:999px;background:${accent}22;color:${accent};white-space:nowrap}
  .badge.lib{background:rgba(255,255,255,.1);color:#cdd}
  h1{font-size:clamp(34px,6vw,72px);font-weight:800;line-height:1.02;margin-top:18px;letter-spacing:-.02em}
  .sub{margin-top:14px;color:#9aa3b8;font-size:16px}
  .tags{display:flex;gap:8px;flex-wrap:wrap;margin-top:24px}
  .tags span{font-size:12px;font-weight:700;padding:6px 11px;border:1px solid rgba(255,255,255,.14);border-radius:8px;color:#c7cee0}
  .foot{margin-top:22px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#5b627a}
  </style></head><body><div class="card">
    <div class="top"><div class="kind">${isProj ? 'AWARD-WINNING' : 'COMPONENT LIBRARY'}</div>${badge}</div>
    <div>
      <h1>${it.name}</h1>
      <div class="sub">${sub}</div>
      <div class="tags">${tagsHtml}</div>
    </div>
    <div class="foot">实拍不可用 · 信息卡占位</div>
  </div></body></html>`;
}

if (process.env.TEST) {
  const pick = [
    targets.find(t => /ant\.design/.test(t.link)),
    targets.find(t => /github\.com/.test(t.link)),
    targets.find(t => /lusion\.com/.test(t.link))
  ].filter(Boolean).slice(0, 3);
  console.log('TEST mode, targets:', pick.map(p => p.id + ' -> ' + p.link).join(' | '));
  run(pick);
} else {
  run(targets);
}

async function run(list) {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-webgl', '--hide-scrollbars', '--disable-blink-features=AutomationControlled']
  });
  let done = 0, ok = 0, blank = 0, fail = 0;
  const queue = list.slice();
  const startTime = Date.now();

  async function worker() {
    const page = await browser.newPage({ viewport: VIEWPORT });
    await page.addInitScript(() => { try { Object.defineProperty(navigator, 'webdriver', { get: () => false }); } catch (e) {} });
    while (queue.length) {
      const it = queue.shift();
      const out = path.resolve(OUT_DIR, path.basename(it.img));
      try {
        const resp = await page.goto(it.link, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
        await page.waitForTimeout(WAIT);
        // 尝试关闭常见 cookie 同意横幅
        await page.evaluate(() => {
          const txt = (s) => (s || '').toLowerCase();
          document.querySelectorAll('button, a, div[role="button"]').forEach(b => {
            const t = txt(b.innerText) + txt(b.getAttribute('aria-label'));
            if (/(accept all|accept cookies|allow all|got it|agree|i agree|accept &|aceitar|alle akzeptieren|accepter|同意|接受)/.test(t)) { try { b.click(); } catch (e) {} }
          });
        }).catch(() => {});
        await page.waitForTimeout(350);
        await page.screenshot({ path: out, type: 'png' });
        let sz = fs.statSync(out).size;
        // 接近空白 -> 二次等待重试
        if (sz < BLANK_KB * 1024) {
          await page.waitForTimeout(RETRY_WAIT);
          await page.screenshot({ path: out, type: 'png' });
          sz = fs.statSync(out).size;
        }
        // 仍接近空白 -> 信息卡回退
        if (sz < BLANK_KB * 1024) {
          await page.setContent(infoCardHtml(it), { waitUntil: 'domcontentloaded' });
          await page.waitForTimeout(300);
          await page.screenshot({ path: out, type: 'png' });
          blank++;
          console.log('BLANK-CARD', it.id, it.link);
        } else {
          ok++;
        }
      } catch (e) {
        fail++;
        console.log('FAIL', it.id, it.link, '::', String(e.message).split('\n')[0]);
      }
      done++;
      if (done % 15 === 0) {
        const sec = ((Date.now() - startTime) / 1000).toFixed(0);
        console.log(`progress ${done}/${list.length} ok=${ok} blank=${blank} fail=${fail} ${sec}s`);
      }
    }
    await page.close();
  }

  const workers = Array.from({ length: Math.min(CONC, list.length) }, () => worker());
  await Promise.all(workers);
  await browser.close();
  const sec = ((Date.now() - startTime) / 1000).toFixed(0);
  console.log(`DONE total=${list.length} ok=${ok} blank=${blank} fail=${fail} ${sec}s`);
}

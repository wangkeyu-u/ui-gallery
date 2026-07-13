// repro-read.js — 读取一个真实网站的源码/结构，输出结构化 read.json + 渲染后的 source.html
// 用法: node repro-read.js "<url>" "repro/<id>/read.json"
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const url = process.argv[2];
const outJson = process.argv[3];
const VIEWPORT = { width: 1280, height: 820 };

(async () => {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-webgl', '--hide-scrollbars', '--disable-blink-features=AutomationControlled']
  });
  const page = await browser.newPage({ viewport: VIEWPORT });
  await page.addInitScript(() => { try { Object.defineProperty(navigator, 'webdriver', { get: () => false }); } catch (e) {} });
  const info = { url, ok: false, err: null };
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(3500);
    await page.evaluate(() => {
      const txt = s => (s || '').toLowerCase();
      document.querySelectorAll('button, a, div[role="button"]').forEach(b => {
        const t = txt(b.innerText) + txt(b.getAttribute('aria-label'));
        if (/(accept all|accept cookies|allow all|got it|agree|i agree|accept &|aceitar|alle akzeptieren|accepter|同意|接受)/.test(t)) { try { b.click(); } catch (e) {} }
      });
    }).catch(() => {});
    await page.waitForTimeout(400);

    const data = await page.evaluate(() => {
      const cs = el => el ? getComputedStyle(el) : {};
      const body = document.body; const bcs = cs(body);
      const header = document.querySelector('header') || document.querySelector('nav') || document.querySelector('[role="banner"]');
      const hcs = cs(header);
      const navLinks = [...document.querySelectorAll('header a, nav a')].slice(0, 12).map(a => (a.innerText || '').trim()).filter(Boolean);
      const h1s = [...document.querySelectorAll('h1')].slice(0, 3).map(h => (h.innerText || '').trim());
      const h2s = [...document.querySelectorAll('h2')].slice(0, 4).map(h => (h.innerText || '').trim());
      const btns = [...document.querySelectorAll('button, a.btn, a[class*="button"], a[role="button"]')].slice(0, 8).map(b => {
        const s = cs(b);
        return { text: (b.innerText || '').trim().slice(0, 40), bg: s.backgroundColor, borderRadius: s.borderRadius, color: s.color, border: s.border };
      });
      const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      const title = document.title;
      const sections = [...document.querySelectorAll('section')].slice(0, 3).map(s => (s.innerText || '').trim().slice(0, 140));
      return {
        title, metaDesc,
        bodyBg: bcs.backgroundColor, bodyColor: bcs.color, bodyFont: bcs.fontFamily,
        headerBg: hcs.backgroundColor, headerColor: hcs.color,
        navLinks, h1s, h2s, btns, sections, siteLang: document.documentElement.lang
      };
    });
    info.ok = true; Object.assign(info, data);
    const html = await page.content();
    fs.writeFileSync(outJson.replace(/\.json$/, '') + '.source.html', html);
  } catch (e) {
    info.err = String(e.message).split('\n')[0];
  }
  fs.writeFileSync(outJson, JSON.stringify(info, null, 2));
  await browser.close();
})();

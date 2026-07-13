// repro-read2.js — 动画感知读取器
// 在结构化数据之外,额外提取:@keyframes 规则、首屏元素的 animation/transition 计算样式、
// 动画库检测、hero 区真实 outerHTML 片段。
// 用法: node repro-read2.js "<url>" "repro/<id>/anim.json"
const fs = require('fs');
const { chromium } = require('playwright');

const url = process.argv[2];
const outJson = process.argv[3];
const VIEWPORT = { width: 1280, height: 900 };

(async () => {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-webgl', '--hide-scrollbars', '--disable-blink-features=AutomationControlled']
  });
  const page = await browser.newPage({ viewport: VIEWPORT });
  await page.addInitScript(() => { try { Object.defineProperty(navigator, 'webdriver', { get: () => false }); } catch (e) {} });
  const info = { url, ok: false, err: null };
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3800);
    // dismiss cookie banners
    await page.evaluate(() => {
      const txt = s => (s || '').toLowerCase();
      document.querySelectorAll('button, a, div[role="button"]').forEach(b => {
        const t = txt(b.innerText) + txt(b.getAttribute('aria-label'));
        if (/(accept all|accept cookies|allow all|got it|agree|i agree|accept &|aceitar|alle akzeptieren|accepter|同意|接受)/.test(t)) { try { b.click(); } catch (e) {} }
      });
    }).catch(() => {});
    await page.waitForTimeout(500);
    // trigger scroll to activate scroll-based animations, then back to top
    await page.evaluate(async () => {
      window.scrollTo(0, Math.min(1200, document.body.scrollHeight));
      await new Promise(r => setTimeout(r, 600));
      window.scrollTo(0, 0);
      await new Promise(r => setTimeout(r, 400));
    }).catch(() => {});

    const data = await page.evaluate(() => {
      const out = {};
      // ---- 1) 动画库检测 ----
      const libs = [];
      try {
        if (window.gsap || window.TweenMax || window.TweenLite) libs.push('GSAP');
        if (window.ScrollTrigger || (window.gsap && window.gsap.ScrollTrigger)) libs.push('GSAP ScrollTrigger');
        if (document.querySelector('[data-aos]')) libs.push('AOS (Animate On Scroll)');
        if (window.lottie || document.querySelector('lottie-player, [class*="lottie"]')) libs.push('Lottie');
        if (window.THREE || document.querySelector('canvas')) libs.push('Canvas/WebGL (three.js?)');
        if (window.__NEXT_DATA__ && document.querySelector('[style*="transform"]')) {/* maybe framer-motion */}
        if (document.querySelector('[data-framer-name], [data-projection-id]')) libs.push('Framer Motion');
        if (window.Splitting || document.querySelector('[data-splitting]')) libs.push('Splitting.js');
        if (window.Swiper || document.querySelector('.swiper, .swiper-container')) libs.push('Swiper');
        if (window.Lenis || window.locomotive || document.querySelector('[data-scroll]')) libs.push('Smooth-scroll (Lenis/Locomotive)');
        if (window.anime) libs.push('anime.js');
        if (window.Vivus) libs.push('Vivus (SVG line)');
        if (window.Rellax || document.querySelector('.rellax')) libs.push('Rellax parallax');
      } catch (e) {}
      out.libs = [...new Set(libs)];

      // ---- 2) 提取 @keyframes(same-origin sheets + <style> 文本)----
      const keyframes = {};
      const collectFromRules = (rules) => {
        for (const r of rules) {
          try {
            if (r.type === CSSRule.KEYFRAMES_RULE || (r.name && r.cssText && r.cssText.startsWith('@keyframes'))) {
              if (r.name && !keyframes[r.name]) keyframes[r.name] = r.cssText;
            } else if (r.cssRules && r.type === CSSRule.MEDIA_RULE) {
              collectFromRules(r.cssRules);
            } else if (r.cssRules && r.type === CSSRule.SUPPORTS_RULE) {
              collectFromRules(r.cssRules);
            }
          } catch (e) {}
        }
      };
      try {
        for (const sheet of document.styleSheets) {
          try { if (sheet.cssRules) collectFromRules(sheet.cssRules); } catch (e) { /* CORS */ }
        }
      } catch (e) {}
      // 也从 <style> 标签文本里正则抓 keyframes(能拿到 cross-origin 抓不到的内联)
      try {
        const styleText = [...document.querySelectorAll('style')].map(s => s.textContent || '').join('\n');
        const re = /@(?:-webkit-)?keyframes\s+([A-Za-z0-9_\-]+)\s*\{([\s\S]*?\}\s*)\}/g;
        let m; let guard = 0;
        while ((m = re.exec(styleText)) && guard < 200) {
          guard++;
          const name = m[1];
          if (!keyframes[name]) keyframes[name] = '@keyframes ' + name + ' {' + m[2] + '}';
        }
      } catch (e) {}
      out.keyframes = keyframes;

      // ---- 3) 首屏可见元素的 animation / transition 计算样式 ----
      const vh = window.innerHeight, vw = window.innerWidth;
      const seen = new Set();
      const anims = [];      // 有 animationName 的
      const transitions = []; // 有非空 transition 的
      const els = [...document.querySelectorAll('body *')];
      let scanned = 0;
      for (const el of els) {
        if (scanned > 4000) break; scanned++;
        let rect; try { rect = el.getBoundingClientRect(); } catch (e) { continue; }
        if (rect.width < 2 || rect.height < 2) continue;
        if (rect.top > vh || rect.bottom < 0 || rect.left > vw || rect.right < 0) continue; // 仅首屏
        const s = getComputedStyle(el);
        const tag = el.tagName.toLowerCase();
        const cls = (el.className && typeof el.className === 'string') ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
        const sig = tag + cls;
        // animation
        const an = s.animationName;
        if (an && an !== 'none') {
          const key = sig + '|' + an;
          if (!seen.has(key) && anims.length < 40) {
            seen.add(key);
            anims.push({
              sel: sig, name: an,
              duration: s.animationDuration, timing: s.animationTimingFunction,
              delay: s.animationDelay, iteration: s.animationIterationCount,
              direction: s.animationDirection, fill: s.animationFillMode,
              transform: s.transform !== 'none' ? s.transform.slice(0, 80) : '', opacity: s.opacity
            });
          }
        }
        // transition
        const tp = s.transitionProperty;
        if (tp && tp !== 'none' && tp !== 'all 0s ease 0s' && s.transitionDuration !== '0s') {
          const key2 = 'T|' + sig + '|' + tp;
          if (!seen.has(key2) && transitions.length < 30) {
            seen.add(key2);
            transitions.push({
              sel: sig, property: tp,
              duration: s.transitionDuration, timing: s.transitionTimingFunction, delay: s.transitionDelay
            });
          }
        }
      }
      out.animations = anims;
      out.transitions = transitions;

      // ---- 4) hero 区真实 HTML 片段(截断)----
      const heroCand = document.querySelector('main, header, section, [class*="hero"], [class*="Hero"], body > div');
      let heroHTML = '';
      try {
        if (heroCand) heroHTML = heroCand.outerHTML.replace(/\s+/g, ' ').slice(0, 4000);
      } catch (e) {}
      out.heroHTML = heroHTML;

      // ---- 5) canvas / video 存在性 ----
      out.hasCanvas = !!document.querySelector('canvas');
      out.hasVideo = !!document.querySelector('video');
      out.canvasCount = document.querySelectorAll('canvas').length;

      return out;
    });
    info.ok = true; Object.assign(info, data);
    // 统计摘要
    info.summary = {
      libs: info.libs, keyframeNames: Object.keys(info.keyframes || {}),
      animCount: (info.animations || []).length, transCount: (info.transitions || []).length,
      hasCanvas: info.hasCanvas, canvasCount: info.canvasCount
    };
  } catch (e) {
    info.err = String(e.message).split('\n')[0];
  }
  fs.writeFileSync(outJson, JSON.stringify(info, null, 2));
  await browser.close();
})();

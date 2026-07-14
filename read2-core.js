// read2-core.js — 动画 + 交互感知读取核心(供 repro-read2.js 与 rerun-read2.js 复用)
// 提取:
//   1) 动画库检测            2) @keyframes 真实代码(含跨域:从 <style> 内联文本正则抓)
//   3) 首屏 animation/transition 计算样式
//   4) hero 区真实 HTML 片段  5) canvas/video 存在性
//   6) 【交互状态终态】用真实鼠标/键盘输入触发 :hover / :active / :focus,
//      读取计算样式差值 —— 不受跨域 CSSOM 限制,能拿到真实的点击/hover 反馈。
const VIEWPORT = { width: 1280, height: 900 };
const LAUNCH_ARGS = ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-webgl', '--hide-scrollbars', '--disable-blink-features=AutomationControlled'];

// 浏览器内提取首屏结构/动画(keyframes 含内联文本正则兜底)
function pageExtractFn() {
  const out = {};
  const libs = [];
  try {
    if (window.gsap || window.TweenMax || window.TweenLite) libs.push('GSAP');
    if (window.ScrollTrigger || (window.gsap && window.gsap.ScrollTrigger)) libs.push('GSAP ScrollTrigger');
    if (document.querySelector('[data-aos]')) libs.push('AOS (Animate On Scroll)');
    if (window.lottie || document.querySelector('lottie-player, [class*="lottie"]')) libs.push('Lottie');
    if (window.THREE || document.querySelector('canvas')) libs.push('Canvas/WebGL (three.js?)');
    if (document.querySelector('[data-framer-name], [data-projection-id]')) libs.push('Framer Motion');
    if (window.Splitting || document.querySelector('[data-splitting]')) libs.push('Splitting.js');
    if (window.Swiper || document.querySelector('.swiper, .swiper-container')) libs.push('Swiper');
    if (window.Lenis || window.locomotive || document.querySelector('[data-scroll]')) libs.push('Smooth-scroll (Lenis/Locomotive)');
    if (window.anime) libs.push('anime.js');
    if (window.Vivus) libs.push('Vivus (SVG line)');
    if (window.Rellax || document.querySelector('.rellax')) libs.push('Rellax parallax');
  } catch (e) {}
  out.libs = [...new Set(libs)];

  const keyframes = {};
  const collectFromRules = (rules) => {
    for (const r of rules) {
      try {
        if (r.type === CSSRule.KEYFRAMES_RULE || (r.name && r.cssText && r.cssText.startsWith('@keyframes'))) {
          if (r.name && !keyframes[r.name]) keyframes[r.name] = r.cssText;
        } else if (r.cssRules && (r.type === CSSRule.MEDIA_RULE || r.type === CSSRule.SUPPORTS_RULE)) {
          collectFromRules(r.cssRules);
        }
      } catch (e) {}
    }
  };
  try {
    for (const sheet of document.styleSheets) {
      try { if (sheet.cssRules) collectFromRules(sheet.cssRules); } catch (e) {}
    }
  } catch (e) {}
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

  const vh = window.innerHeight, vw = window.innerWidth;
  const seen = new Set();
  const anims = [];
  const transitions = [];
  const els = [...document.querySelectorAll('body *')];
  let scanned = 0;
  for (const el of els) {
    if (scanned > 4000) break; scanned++;
    let rect; try { rect = el.getBoundingClientRect(); } catch (e) { continue; }
    if (rect.width < 2 || rect.height < 2) continue;
    if (rect.top > vh || rect.bottom < 0 || rect.left > vw || rect.right < 0) continue;
    const s = getComputedStyle(el);
    const tag = el.tagName.toLowerCase();
    const cls = (el.className && typeof el.className === 'string') ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    const sig = tag + cls;
    const an = s.animationName;
    if (an && an !== 'none') {
      const key = sig + '|' + an;
      if (!seen.has(key) && anims.length < 40) {
        seen.add(key);
        anims.push({ sel: sig, name: an, duration: s.animationDuration, timing: s.animationTimingFunction, delay: s.animationDelay, iteration: s.animationIterationCount, direction: s.animationDirection, fill: s.animationFillMode, transform: s.transform !== 'none' ? s.transform.slice(0, 80) : '', opacity: s.opacity });
      }
    }
    const tp = s.transitionProperty;
    if (tp && tp !== 'none' && tp !== 'all 0s ease 0s' && s.transitionDuration !== '0s') {
      const key2 = 'T|' + sig + '|' + tp;
      if (!seen.has(key2) && transitions.length < 30) {
        seen.add(key2);
        transitions.push({ sel: sig, property: tp, duration: s.transitionDuration, timing: s.transitionTimingFunction, delay: s.transitionDelay });
      }
    }
  }
  out.animations = anims;
  out.transitions = transitions;

  const heroCand = document.querySelector('main, header, section, [class*="hero"], [class*="Hero"], body > div');
  let heroHTML = '';
  try { if (heroCand) heroHTML = heroCand.outerHTML.replace(/\s+/g, ' ').slice(0, 4000); } catch (e) {}
  out.heroHTML = heroHTML;
  out.hasCanvas = !!document.querySelector('canvas');
  out.hasVideo = !!document.querySelector('video');
  out.canvasCount = document.querySelectorAll('canvas').length;
  return out;
}

// ---- 交互状态:用 CDP CSS 域取真实 :hover/:active/:focus 声明 ----
const INTERACTIVE = 'a[href], button, [role="button"], input, select, textarea, label, summary, [tabindex], [onclick], [data-click], [class*="btn"], [class*="card"], [class*="tab"], [class*="link"], [class*="item"], [class*="nav"], [class*="menu"], [class*="tile"], [class*="chip"], [class*="tile"]';

function sigOf(handle) {
  // 返回稳定可读选择器: tag + 前两个类
  return handle.evaluate(el => {
    const tag = el.tagName.toLowerCase();
    const id = el.id ? '#' + el.id : '';
    const cls = (el.className && typeof el.className === 'string') ? el.className.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(c => '.' + c) : [];
    if (id) return tag + id;
    if (cls.length >= 2) return tag + cls.join('');
    if (cls.length === 1) return tag + cls[0];
    return tag;
  });
}

// 用 Chrome DevTools Protocol 的 CSS 域直接取元素匹配的 :hover/:active/:focus 规则
// (含跨域样式表,无需真实鼠标模拟,速度快且拿到的是真实声明的终态值)
const IPROPS = ['transform', 'background-color', 'background', 'box-shadow', 'color', 'border-color', 'border-bottom-color', 'border-top-color', 'border-left-color', 'border-right-color', 'outline-color', 'outline', 'opacity', 'filter', 'text-decoration', 'text-decoration-color', 'text-shadow', 'scale', 'background-image'];
const PSEUDOS = [':hover', ':active', ':focus', ':focus-visible'];
// 仅保留可复现的具体值(排除 CSS 变量/关键字,避免提示词里出现 var(--x) 这类无法独立还原的值)
function isConcrete(val) {
  if (!val) return false;
  const v = val.trim();
  if (/var\(|color-mix|currentColor|-webkit-|inherit|initial|unset|revert|env\(/.test(v)) return false;
  if (/^(rgba?\([^)]*,\s*0\s*\)|transparent|none|auto|0px|0s|medium|thin)$/.test(v)) return false;
  // 4/8 位 hex 全透明: #0000, #00000000, #XXXX0 (alpha=0)
  if (/^#[0-9a-fA-F]{3}[0-9a-fA-F]$/i.test(v) && v.endsWith('0')) return false; // #XXX0
  if (/^#[0-9a-fA-F]{6}00$/i.test(v)) return false; // #XXXXXX00
  return true;
}
// 跳过纯 Tailwind/工具类选择器(它们不是有意义的复刻目标)
const UTILITY_PREFIX = ['flex', 'relative', 'absolute', 'fixed', 'sticky', 'hidden', 'block', 'inline', 'grid', 'w-', 'h-', 'p-', 'px-', 'py-', 'm-', 'mx-', 'my-', 'ml-', 'mr-', 'mt-', 'mb-', 'gap-', 'items-', 'justify-', 'content-', 'text-', 'bg-', 'border', 'rounded', 'top-', 'left-', 'right-', 'bottom-', 'object-', 'overflow-', 'cursor-', 'select-', 'opacity', 'z-', 'scale-', 'translate-', 'rotate-', 'leading-', 'tracking-', 'font-', 'shadow', 'outline', 'transition', 'duration', 'ease', 'animate', 'fill', 'stroke', 'size-', 'shrink-', 'grow-', 'aspect-', 'inset-', 'col-', 'row-', 'order-', 'min-w-', 'min-h-', 'max-w-', 'max-h-', 'place-', 'self-', 'pointer-events', 'whitespace', 'break-', 'truncate', 'line-clamp'];
function isUtilitySel(sel) {
  const base = sel.replace(/:.*$/, '').trim().replace(/^\./, '');
  return UTILITY_PREFIX.some(p => base === p || base.startsWith(p));
}
function pickSig(rules) {
  // 优先选含类名的、非纯工具类的匹配选择器
  for (const m of rules) {
    let st = ''; try { st = (m.rule.selectorList.text || '').split(',')[0].trim(); } catch (e) { continue; }
    const stripped = st.replace(/:hover|:active|:focus|:focus-visible/g, '').trim();
    if (stripped && stripped.includes('.') && !isUtilitySel(stripped)) return stripped;
  }
  for (const m of rules) {
    let st = ''; try { st = (m.rule.selectorList.text || '').split(',')[0].trim(); } catch (e) { continue; }
    const stripped = st.replace(/:hover|:active|:focus|:focus-visible/g, '').trim();
    if (stripped && !isUtilitySel(stripped)) return stripped;
  }
  return 'el';
}


async function simulateInteractions(page) {
  let client;
  try { client = await page.context().newCDPSession(page); await client.send('DOM.enable'); await client.send('CSS.enable'); }
  catch (e) { return []; }
  try {
    const { root } = await client.send('DOM.getDocument', { depth: -1, pierce: false });
    const { nodeIds } = await client.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: INTERACTIVE });
    if (!nodeIds || !nodeIds.length) return [];
    const collect = new Map();
    const bucketOf = p => p === ':hover' ? 'hover' : p === ':active' ? 'active' : p === ':focus' ? 'focus' : 'focusVisible';
    let processed = 0;
    for (const nodeId of nodeIds) {
      if (processed >= 60) break; // 上限,控制耗时
      // 强制伪类状态,使 :hover/:active/:focus 规则进入匹配集
      try { await client.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['hover', 'active', 'focus', 'focus-visible'] }); }
      catch (e) {}
      let matched;
      try { matched = await client.send('CSS.getMatchedStylesForNode', { nodeId }); }
      catch (e) { continue; }
      const rules = matched.matchedCSSRules || [];
      if (!rules.length) continue;
      // 选一个含类名、非工具类的稳定选择器作为 sig
      const sig = pickSig(rules);
      for (const m of rules) {
        let selText = '';
        try { selText = m.rule.selectorList.text || ''; } catch (e) { continue; }
        for (const pseudo of PSEUDOS) {
          if (selText.indexOf(pseudo) === -1) continue;
          const bucket = bucketOf(pseudo);
          if (!collect.has(sig)) collect.set(sig, { sel: sig, hover: {}, active: {}, focus: {}, focusVisible: {} });
          const target = collect.get(sig)[bucket];
          // 收集该规则里关注的、且可复现(具体值,非变量)的属性
          const props = m.rule.style.cssProperties || [];
          for (const pr of props) {
            const name = pr.name, val = (pr.value || '').trim();
            if (!name || !val) continue;
            if ((IPROPS.includes(name) || (name.startsWith('border') && name.includes('color'))) && isConcrete(val)) {
              target[name] = val;
            }
          }
        }
      }
      processed++;
    }
    // 仅保留有内容的;清理空 bucket;限制数量
    const out = [...collect.values()].filter(c => Object.keys(c.hover).length || Object.keys(c.active).length || Object.keys(c.focus).length || Object.keys(c.focusVisible).length).map(c => ({
      sel: c.sel,
      hover: c.hover, active: c.active, focus: c.focus,
      focusVisible: Object.keys(c.focusVisible).length ? c.focusVisible : undefined
    })).slice(0, 36);
    return out;
  } catch (e) { return []; }
  finally { try { await client.detach(); } catch (e) {} }
}

async function navigate(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3800);
  await page.evaluate(() => {
    const txt = s => (s || '').toLowerCase();
    document.querySelectorAll('button, a, div[role="button"]').forEach(b => {
      const t = txt(b.innerText) + txt(b.getAttribute('aria-label'));
      if (/(accept all|accept cookies|allow all|got it|agree|i agree|accept &|aceitar|alle akzeptieren|accepter|同意|接受)/.test(t)) { try { b.click(); } catch (e) {} }
    });
  }).catch(() => {});
  await page.waitForTimeout(500);
  await page.evaluate(async () => {
    window.scrollTo(0, Math.min(1200, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 600));
    window.scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 400));
  }).catch(() => {});
}

async function extract(page) {
  const info = { ok: false, err: null };
  try {
    const data = await page.evaluate(pageExtractFn);
    Object.assign(info, data);
    info.ok = true;
    // 交互状态(真实输入模拟)
    try { info.interactions = await simulateInteractions(page); } catch (e) { info.interactions = []; }
    info.summary = {
      libs: info.libs,
      keyframeNames: Object.keys(info.keyframes || {}),
      animCount: (info.animations || []).length,
      transCount: (info.transitions || []).length,
      interCount: (info.interactions || []).length,
      hasCanvas: info.hasCanvas,
      canvasCount: info.canvasCount
    };
  } catch (e) {
    info.err = String(e && e.message ? e.message : e).split('\n')[0];
  }
  return info;
}

module.exports = { VIEWPORT, LAUNCH_ARGS, extract, navigate, pageExtractFn, INTERACTIVE, simulateInteractions };

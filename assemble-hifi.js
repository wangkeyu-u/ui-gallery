// assemble-hifi.js — 组装混合高保真提示词
// prompt.hifi.md = 已有自然语言首屏提示词 + 从 anim.json 提取的真实动画代码块
// 用法: node assemble-hifi.js
const fs = require('fs');
const path = require('path');

// ===== 通用高保真生成指令（始终生效，写给任意 AI UI 生成器都能用）=====
// 提炼自业界高质量 UI 生成提示词的共性要求；web-prompts.md 会叠加从网上找到的「牛逼提示词」。
const UNIVERSAL = `# Universal high-fidelity build directives (apply to every generator)
- Output a SINGLE self-contained HTML file with inline CSS and JS. No build step, no external dependencies, opens directly in a browser.
- Use the EXACT hex colors and font stack given below. Never approximate or substitute a color.
- Use the REAL copy/text provided. Never use lorem ipsum or placeholder text.
- Replicate animations FRAME-ACCURATELY: paste the real @keyframes and transition values (duration, easing curve, delay) from the "Precise animation spec" section VERBATIM. Do not rewrite or simplify them.
- Preserve trigger timing: hover, scroll-reveal, and on-load entrance animations must fire at the same moments as the original (card lifts on hover, nav links shift color, hero elements fade+rise on load).
- **交互反馈是页面"活"的关键——每个可交互元素都必须有明确的 :hover、:active、:focus-visible 反馈:**
  - 按钮 :hover → 背景色加深 + 上浮 translateY(-1px); :active → 缩放 scale(0.98) + 背景再深一级; :focus-visible → 2px 主色 ring (box-shadow)。
  - 链接 :hover → 文字变色/下划线滑入; :active → 颜色再深一级。
  - 输入框 :focus → 边框变主色 + box-shadow ring。
  - 卡片 :hover → 上浮 4px + 阴影加深 + 图片 scale(1.02)。
  - 若下方"交互状态规格"提供了从真实站点提取的终态值,**必须以这些真实值为准**,上面的默认规则仅作补充(未列出时使用)。
- Target a 1280px desktop viewport, desktop-first. Match element sizes, spacing, radii, and layout exactly.
- Production quality: no console errors, no overflow, no blurry assets. Implement icons as inline SVG or pure CSS.
- Do not invent sections that are not described. Stay faithful to the specified above-the-fold content.`;

// 从网上找到的「牛逼 UI 提示词」注入位：把抓取到的优质指令/范例写进 web-prompts.md 即可自动合并
let WEB_EXTRA = '';
try {
  const wp = fs.readFileSync('web-prompts.md', 'utf8').trim();
  if (wp) WEB_EXTRA = '# Curated community UI-prompt techniques (sourced from the web)\n' + wp;
} catch (e) { /* web-prompts.md 不存在时跳过 */ }

const accessible = JSON.parse(fs.readFileSync('/tmp/accessible.json', 'utf8'));

// 找一个站点已有的最佳 NL 提示词
function bestNL(id) {
  const dir = 'repro/' + id;
  const rj = path.join(dir, 'result.json');
  if (fs.existsSync(rj)) {
    try {
      const r = JSON.parse(fs.readFileSync(rj, 'utf8'));
      if (r.finalPrompt && fs.existsSync(r.finalPrompt)) return fs.readFileSync(r.finalPrompt, 'utf8').trim();
    } catch (e) {}
  }
  // 回退:扫描 prompt.v*.md 取最高版本
  if (fs.existsSync(dir)) {
    const cands = fs.readdirSync(dir).filter(f => /^prompt\.v\d+\.md$/.test(f)).sort();
    if (cands.length) return fs.readFileSync(path.join(dir, cands[cands.length - 1]), 'utf8').trim();
    if (fs.existsSync(path.join(dir, 'prompt.hifi.md'))) {} // 不回读自身
  }
  return null;
}

// 判断 keyframe 是否"噪声"(第三方进度条/加载器等,复现价值低)
function isNoise(name) {
  return /nprogress|loadingCircle|spin(ner)?$|antBadge|antStatus|dashdraw|keepAlive|sp-k-/i.test(name);
}

function buildAnimAppendix(anim) {
  if (!anim || !anim.ok) return { text: '', hasData: false };
  const parts = [];
  const libs = anim.libs || [];
  const kfAll = anim.keyframes || {};
  const kfNames = Object.keys(kfAll);
  const transitions = anim.transitions || [];
  const animations = anim.animations || [];

  let hasData = false;

  parts.push('## 精确动画规格(从真实站点提取,请照此实现,力求逐帧一致)');
  parts.push('');

  if (libs.length) {
    hasData = true;
    parts.push('**检测到的动画技术/库:** ' + libs.join('、') + '。请用相同库或等价实现复刻其运动特征。');
    parts.push('');
  }
  if (anim.hasCanvas) {
    parts.push('> 注意:页面含 ' + (anim.canvasCount || 1) + ' 个 <canvas>(WebGL/2D 绘制),此类动态视觉无法用纯 CSS 逐帧复刻;若无法拿到原始 shader/绘制逻辑,请用相近的 canvas 动画或 CSS 渐变动效近似其氛围。');
    parts.push('');
  }

  // 首屏正在运行的 animation(带 keyframes)
  if (animations.length) {
    hasData = true;
    parts.push('**首屏进行中的 CSS 动画(元素 → 动画属性):**');
    for (const a of animations.slice(0, 12)) {
      parts.push('- `' + a.sel + '` → animation: ' + [a.name, a.duration, a.timing, a.delay, a.iteration, a.direction, a.fill].filter(x => x && x !== 'none' && x !== '0s').join(' '));
    }
    parts.push('');
  }

  // transitions(交互过渡)
  if (transitions.length) {
    hasData = true;
    parts.push('**交互过渡(hover/focus/状态切换时的 transition):**');
    const uniq = [];
    const seen = new Set();
    for (const t of transitions) {
      const k = t.property + '|' + t.duration + '|' + t.timing;
      if (seen.has(k)) continue; seen.add(k);
      uniq.push('- `' + t.sel + '` → transition: ' + [t.property, t.duration, t.timing, t.delay].filter(x => x && x !== '0s').join(' '));
      if (uniq.length >= 14) break;
    }
    parts.push(...uniq);
    parts.push('');
  }

  // 交互状态终态(:hover/:active/:focus 从真实站点 CDP 提取)
  const interactions = anim.interactions || [];
  if (interactions.length) {
    hasData = true;
    parts.push('## 交互状态规格(从真实站点提取的 :hover/:active/:focus 终态——必须照此实现)');
    parts.push('');
    for (const it of interactions.slice(0, 24)) {
      const buckets = [];
      if (Object.keys(it.hover || {}).length) buckets.push('**hover:** ' + Object.entries(it.hover).map(([k, v]) => k + ': ' + v).join('; '));
      if (Object.keys(it.active || {}).length) buckets.push('**active:** ' + Object.entries(it.active).map(([k, v]) => k + ': ' + v).join('; '));
      if (Object.keys(it.focus || {}).length) buckets.push('**focus:** ' + Object.entries(it.focus).map(([k, v]) => k + ': ' + v).join('; '));
      if (it.focusVisible && Object.keys(it.focusVisible).length) buckets.push('**focus-visible:** ' + Object.entries(it.focusVisible).map(([k, v]) => k + ': ' + v).join('; '));
      if (buckets.length) parts.push('- `' + it.sel + '`:\n  ' + buckets.join('\n  '));
    }
    parts.push('');
    parts.push('> 上述终态值是从真实站点 CSS 中提取的精确声明(已过滤跨域变量与工具类噪声)。请在对应的交互元素上逐条还原这些属性变化。对于未在列表中出现的交互元素,按 UNIVERSAL 指令中的默认规则(按钮点击缩放 0.98、悬停上浮、聚焦 ring 等)补全。');
    parts.push('');
  }

  // @keyframes 真实代码(去噪 + 限量 + 限长)
  const useful = kfNames.filter(n => !isNoise(n));
  const picked = (useful.length ? useful : kfNames).slice(0, 14);
  if (picked.length) {
    hasData = true;
    parts.push('**真实 @keyframes 代码(直接复制到你的 CSS 中):**');
    parts.push('```css');
    let budget = 3000;
    for (const n of picked) {
      let code = (kfAll[n] || '').replace(/\s+/g, ' ').trim();
      // 还原换行以便可读(在 { 和 ; 后)
      code = code.replace(/\{\s*/g, ' {\n  ').replace(/;\s*/g, ';\n  ').replace(/\}\s*\}/g, '}\n}');
      if (code.length > budget) { parts.push('/* ...(其余 keyframes 略) */'); break; }
      budget -= code.length;
      parts.push(code);
    }
    parts.push('```');
    parts.push('');
  }

  parts.push('实现要求:上述过渡时长/缓动函数/关键帧务必与数值一致;悬停/滚动/进入视口的触发时机也要还原(如卡片 hover 上浮、导航链接变色、首屏元素淡入上移)。交互状态规格中的 :hover/:active/:focus 终态值是真实提取的——必须逐条复刻,确保点击按钮时颜色变深+缩放、悬停时上浮+阴影、聚焦时出现 ring 等反馈与原站一致。');

  return { text: parts.join('\n'), hasData };
}

let assembled = 0, noNL = 0, noAnim = 0;
const needNL = [];
for (const s of accessible) {
  const id = s.id;
  const nl = bestNL(id);
  const animPath = 'repro/' + id + '/anim.json';
  let anim = null;
  if (fs.existsSync(animPath)) { try { anim = JSON.parse(fs.readFileSync(animPath, 'utf8')); } catch (e) {} }
  const appendix = buildAnimAppendix(anim);
  if (!appendix.hasData) noAnim++;

  if (!nl) { noNL++; needNL.push(id); }
  const base = nl || ('Reproduce the ' + id + ' (' + s.url + ') homepage above-the-fold UI at 1280px width. (Base description missing — infer from the animation specs below and the site URL.)');

  const full = UNIVERSAL + '\n\n' + base + '\n\n---\n\n' + appendix.text + (WEB_EXTRA ? '\n\n' + WEB_EXTRA : '') + '\n';
  fs.writeFileSync('repro/' + id + '/prompt.hifi.md', full);
  assembled++;
}
fs.writeFileSync('/tmp/need-nl.json', JSON.stringify(needNL));
console.log('assembled prompt.hifi.md:', assembled);
console.log('  had NO base NL prompt (need LLM):', noNL, needNL.length ? '=> ' + needNL.join(' ') : '');
console.log('  had NO usable anim data:', noAnim);

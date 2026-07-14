// gen-batch16.js — Generate all 12 batch-16 Awwwards gallery card HTML files
const fs = require('fs');
const path = require('path');

// ── Per-site configuration (calibrated against real preview screenshots) ──
const sites = [
  // ── Family A: trophy top-left, title ~72px ──
  {
    id: 'awd-balenciaga',
    family: 'A',  // trophy top-left
    bg: 'radial-gradient(140% 140% at 0% 0%, #0a0a0a 45%, #9ca3af 120%)',
    title: 'Balenciaga', subtitle: 'Balenciaga · 2022',
    pillBg: '#9ca3af', pillColor: '#fff', pillText: 'Awwwards',
    theme: '奢侈',
    tech: 'WebGL', techBg: 'rgba(0,0,0,0.45)', techBorder: 'none',
    awardBorder: 'rgba(255,255,255,0.6)', awardText: '#fff',
    contentLeft: 100,
  },
  {
    id: 'awd-louisvuitton',
    family: 'A',
    bg: 'radial-gradient(140% 140% at 0% 0%, #0a0a0a 45%, #c9a227 120%)',
    title: 'Louis Vuitton', subtitle: 'Louis Vuitton · 2023',
    pillBg: '#c9a227', pillColor: '#fff', pillText: 'Awwwards',
    theme: '奢侈',
    tech: 'Three.js', techBg: 'rgba(0,0,0,0.45)', techBorder: 'none',
    awardBorder: 'rgba(255,255,255,0.6)', awardText: '#fff',
    contentLeft: 100,
  },
  {
    id: 'awd-animade',
    family: 'A',
    bg: 'radial-gradient(130% 130% at 100% 0%, rgba(244,114,182,0.5) -10%, rgba(244,114,182,0) 55%), #0a0a0a',
    title: 'Animade', subtitle: 'Animade · 2021',
    pillBg: '#f472b6', pillColor: '#1a1a1a', pillText: 'Awwwards',
    theme: '创意',
    tech: 'GSAP', techBg: 'rgba(255,255,255,0.08)', techBorder: '1px solid rgba(255,255,255,0.15)',
    awardBorder: 'rgba(255,255,255,0.4)', awardText: '#fff',
    contentLeft: 100,
  },
  {
    id: 'awd-unseen',
    family: 'A',
    bg: 'radial-gradient(130% 130% at 100% 0%, rgba(167,139,250,0.5) -10%, rgba(167,139,250,0) 55%), #0a0a0a',
    title: 'Unseen', subtitle: 'Unseen · 2023',
    pillBg: '#a78bfa', pillColor: '#1a1a1a', pillText: 'Awwwards',
    theme: '机构',
    tech: 'WebGL', techBg: 'rgba(255,255,255,0.08)', techBorder: '1px solid rgba(255,255,255,0.15)',
    awardBorder: 'rgba(255,255,255,0.4)', awardText: '#fff',
    contentLeft: 100,
  },
  {
    id: 'awd-haus',
    family: 'A',
    bg: 'radial-gradient(140% 140% at 50% 0%, rgba(245,158,11,0.45) -20%, rgba(245,158,11,0) 60%), #0a0a0a',
    title: 'Haus', subtitle: 'Haus · 2023',
    pillBg: '#f59e0b', pillColor: '#1a1a1a', pillText: 'Awwwards',
    theme: '品牌',
    tech: 'Three.js', techBg: 'rgba(255,255,255,0.08)', techBorder: '1px solid rgba(255,255,255,0.15)',
    awardBorder: 'rgba(255,255,255,0.4)', awardText: '#fff',
    contentLeft: 100,
  },
  {
    id: 'awd-buck',
    family: 'A',
    bg: 'radial-gradient(130% 130% at 100% 0%, rgba(96,165,250,0.5) -10%, rgba(96,165,250,0) 55%), #0a0a0a',
    title: 'Buck', subtitle: 'Buck · 2022',
    pillBg: '#60a5fa', pillColor: '#1a1a1a', pillText: 'Awwwards',
    theme: '创意',
    tech: 'WebGL', techBg: 'rgba(255,255,255,0.08)', techBorder: '1px solid rgba(255,255,255,0.15)',
    awardBorder: 'rgba(255,255,255,0.4)', awardText: '#fff',
    contentLeft: 100,
  },
  {
    id: 'awd-raggededge',
    family: 'A',
    bg: 'radial-gradient(130% 130% at 100% 0%, rgba(52,211,153,0.5) -10%, rgba(52,211,153,0) 55%), #0a0a0a',
    title: 'Ragged Edge', subtitle: 'Ragged Edge · 2022',
    pillBg: '#34d399', pillColor: '#1a1a1a', pillText: 'Awwwards',
    theme: '品牌',
    tech: 'Web', techBg: 'rgba(255,255,255,0.08)', techBorder: '1px solid rgba(255,255,255,0.15)',
    awardBorder: 'rgba(255,255,255,0.4)', awardText: '#fff',
    contentLeft: 100,
  },
  {
    id: 'awd-studio-lumio',
    family: 'A',
    bg: 'radial-gradient(130% 130% at 100% 0%, rgba(52,211,153,0.5) -10%, rgba(52,211,153,0) 55%), #0a0a0a',
    title: 'Studio Lumio', subtitle: 'Lumio · 2023',
    pillBg: '#34d399', pillColor: '#1a1a1a', pillText: 'Awwwards',
    theme: '工作室',
    tech: 'Three.js', techBg: 'rgba(255,255,255,0.08)', techBorder: '1px solid rgba(255,255,255,0.15)',
    awardBorder: 'rgba(255,255,255,0.4)', awardText: '#fff',
    contentLeft: 100,
  },

  // ── Family B: NO trophy, title ~46px ──
  {
    id: 'awd-apple',
    family: 'B',
    bg: '#1b1b1f',
    title: 'Apple', subtitle: 'Apple · 2023',
    pillBg: 'rgba(255,255,255,0.12)', pillColor: '#eee', pillText: 'Awwwards',
    theme: '产品',
    tech: 'WebGL', techBg: 'rgba(255,255,255,0.08)', techBorder: '1px solid rgba(255,255,255,0.15)',
    awardBorder: 'rgba(255,255,255,0.25)', awardText: '#ccc',
    contentLeft: 64, awardSmall: true,
  },
  {
    id: 'awd-instrument',
    family: 'B',
    bg: 'linear-gradient(135deg, #1a1e2e 0%, #12151f 100%)',
    title: 'Instrument', subtitle: 'Instrument · 2022',
    pillBg: '#3b82f6', pillColor: '#fff', pillText: 'Awwwards',
    theme: '数字代理',
    tech: 'WebGL', techBg: 'rgba(255,255,255,0.08)', techBorder: '1px solid rgba(255,255,255,0.15)',
    awardBorder: 'rgba(255,255,255,0.22)', awardText: '#bbb',
    contentLeft: 64, awardSmall: true,
  },
  {
    id: 'awd-field',
    family: 'B',
    bg: 'linear-gradient(135deg, #0f2027 0%, #1a3a3a 50%, #142a2a 100%)',
    title: 'Field.io', subtitle: 'Field · 2022',
    pillBg: '#06b6d4', pillColor: '#fff', pillText: 'Awwwards',
    theme: '创意',
    tech: 'Three.js', techBg: 'rgba(255,255,255,0.08)', techBorder: '1px solid rgba(255,255,255,0.15)',
    awardBorder: 'rgba(255,255,255,0.22)', awardText: '#bbb',
    contentLeft: 64, awardSmall: true,
  },
  {
    id: 'awd-verve',
    family: 'B',
    bg: '#1a1035',
    title: 'Verve', subtitle: 'Verve · 2023',
    pillBg: '#7b5cd0', pillColor: '#fff', pillText: 'Awwwards',
    theme: '音乐',
    tech: 'WebGL', techBg: '#251540', techBorder: '1px solid rgba(139,92,208,0.25)',
    awardBorder: '#9080b0', awardText: '#9080b0',
    contentLeft: 80, awardSmall: true,
  },
];

function extractKeyframes(id) {
  const promptPath = `repro/${id}/prompt.hifi.md`;
  if (!fs.existsSync(promptPath)) return '';
  const prompt = fs.readFileSync(promptPath, 'utf8');
  // Match @keyframes blocks (including -webkit- variants) in the precise animation spec
  const re = /真实\s*@keyframes[^`]*```css\s*\n([\s\S]*?)```/g;
  let cssBlocks = [];
  let m;
  while ((m = re.exec(prompt)) !== null) {
    cssBlocks.push(m[1]);
  }
  return cssBlocks.join('\n');
}

function generateHTML(s, kfCSS) {
  const isA = s.family === 'A';
  const isB = s.family === 'B';
  const smallAward = s.awardSmall;
  const trophySize = isA ? 64 : 48; // B doesn't show trophy but we keep config

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=1280">
<title>${s.title} — Gallery Card</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1280px;height:820px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,s-serif;-webkit-font-smoothing:antialiased}
.stage{
  width:1280px;height:820px;
  position:relative;
  background:${s.bg};
  overflow:hidden;
}

${isA ? `
.trophy-tl{
  position:absolute;top:80px;left:80px;
  width:${trophySize}px;height:${trophySize}px;
}` : ''}

.award-pill{
  position:absolute;
  ${smallAward ? 'top:28px;right:28px;' : 'top:80px;right:80px;'}
  display:inline-flex;align-items:center;gap:6px;
  background:transparent;
  border:1px solid ${s.awardBorder};
  border-radius:${smallAward ? '20px' : '999px'};
  padding:${smallAward ? '8px 18px' : '12px 24px'};
  color:${s.awardText};
  font-size:${smallAward ? '13px' : '14px'};
  font-weight:500;
  letter-spacing:${smallAward ? '1px' : '0'};
  white-space:nowrap;
}
.award-pill svg{width:${smallAward ? '14' : '15'}px;height:${smallAward ? '14' : '15'}px;flex-shrink:0}

.content{
  position:absolute;
  top:46%;
  transform:translateY(-50%);
  left:${s.contentLeft}px;
}

${isA ? `.title{font-size:72px;font-weight:700;color:#fff;line-height:1.1;margin-bottom:12px;letter-spacing:-0.02em}` :
       `.title{font-size:46px;font-weight:700;color:#fff;line-height:1.15;margin-bottom:10px;letter-spacing:-0.5px}`}
.subtitle{font-size:${isA ? '22px' : '17px'};color:rgba(255,255,255,0.7);margin-bottom:20px;font-weight:400}

.pill-tag{
  display:inline-block;
  background:${s.pillBg};
  color:${s.pillColor};
  font-size:${isA ? '16px' : '14px'};
  font-weight:600;
  padding:${isA ? '10px 22px' : '6px 18px'};
  border-radius:${isA ? '999px' : '20px'};
  margin-bottom:16px;
  white-space:nowrap;
}

.theme-text{
  font-size:${isA ? '16px' : '15px'};
  color:rgba(255,255,255,0.5);
  margin-bottom:0;
}

.tech-tag{
  position:absolute;
  bottom:80px;
  left:80px;
  display:inline-flex;
  align-items:center;
  background:${s.techBg};
  ${s.techBorder !== 'none' ? `border:${s.techBorder};` : ''}
  border-radius:${s.id === 'awd-verve' ? '8px' : (isA ? '999px' : '8px')};
  padding:${s.id === 'awd-verve' ? '6px 14px' : (isA ? '10px 20px' : '8px 16px')};
  font-size:${s.id === 'awd-verve' ? '13px' : (isA ? '14px' : '13px')};
  color:rgba(255,255,255,0.75);
  font-weight:500;
}

/* ── Verbatim @keyframes from real site (dormant — not applied to visible elements) ── */
${kfCSS}
</style>
</head>
<body>
<div class="stage">

${isA ? `<div class="trophy-tl">
<svg viewBox="0 0 64 64" fill="#fbbf24" width="64" height="64"><path d="M32 4C26 4 21 9 21 15v2h-4c-2.2 0-4 1.8-4 4v6c0 2.2 1.8 4 4 4h1.2c.8 4 3.4 7.4 7 9.2V44H18v4h8v8c0 2.2 1.8 4 4 4h12c2.2 0 4-1.8 4-4v-8h8v-4h-7.2v-3.8c3.6-1.8 6.2-5.2 7-9.2H49c2.2 0 4-1.8 4-4v-6c0-2.2-1.8-4-4-4h-4v-2C45 9 40 4 32 4zm0 4c4.4 0 8 3.6 8 8v4H24v-4c0-4.4 3.6-8 8-8zM17 19h30v4H17v-4zm2 8h26c-.8 3.4-3.2 6-6.2 7.4l-1.8.8V44h-10v-8.8l-1.8-.8C23.2 33 20.8 30.4 20 27z"/></svg>
</div>` : ''}

<div class="award-pill">
<svg viewBox="0 0 24 24" fill="${s.awardText}" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l2.39 5.93 6.38.54-4.86 4.17 1.51 6.27L12 15.89l-5.42 3.02 1.51-6.27-4.86-4.17 6.38-.54z"/></svg>
AWARD
</div>

<div class="content">
<h1 class="title">${s.title}</h1>
<p class="subtitle">${s.subtitle}</p>
<span class="pill-tag">${s.pillText}</span>
<p class="theme-text">${s.theme}</p>
</div>

<div class="tech-tag">${s.tech}</div>

</div>
</body>
</html>`;
}

// ── Main: generate all sites ──
for (const s of sites) {
  const dir = `repro/${s.id}`;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const kf = extractKeyframes(s.id);
  const html = generateHTML(s, kf);
  const outPath = `${dir}/build.hifi.v1.html`;
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`✓ ${s.id} (${kf.length > 0 ? 'kf:' + (kf.match(/@keyframes/g)||[]).length + ' keyframes' : 'no keyframes'}) → ${outPath}`);
}
console.log('\nDone: all 12 HTML files generated.');

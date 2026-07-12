'use strict';
/*
 * AwardCode Hub — 零依赖 Node 应用
 * 自动扫描 ../source 里克隆的获奖源码，按主题分类，提供：
 *   - 主题筛选的画廊
 *   - 真实代码预览（iframe 直接跑 source/ 里的原始文件）
 *   - 源码浏览器（逐文件查看/复制，字节未改动）
 * 所有展示/服务的代码都来自 source/ 的原始文件，保证与获奖代码一致。
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;                       // hub/
const SOURCE = path.join(ROOT, '..', 'source');
const PORT = process.env.PORT || 8200;

/* ---------- 元数据（仅描述信息，不影响源码本身） ---------- */
const META = {
  '2024-gentlerain': { name: 'Gentlerain.ai', year: 2024, award: 'Awwwards Winner', studio: 'Gentlerain AI',
    desc: 'Canvas 英雄区 + Lottie 叙事落地页，Lenis 平滑滚动。', live: 'https://gentlerain.ai/',
    themes: ['平滑滚动', '产品落地页', '极简'], runCmd: 'cd source/2024-gentlerain && python3 -m http.server 8081' },
  '2021-two-good-co': { name: 'Two-Good-Co', year: 2022, award: 'Awwwards Featured', studio: 'Two Good Co',
    desc: '极简排版 + Locomotive 平滑滚动 + GSAP 揭示动画。', live: 'https://www.awwwards.com/',
    themes: ['极简', '平滑滚动', '作品集'], runCmd: 'cd source/2021-two-good-co && python3 -m http.server 8082' },
  '2023-obys': { name: 'Obys Agency', year: 2023, award: 'Studio SOTY（高保真复刻）', studio: 'Obys',
    desc: 'GSAP + Lenis + Shery.js 的滚动叙事与图像扭曲特效。', live: 'https://obys.agency/',
    themes: ['创意机构', '平滑滚动', '图像特效'], runCmd: 'cd source/2023-obys && python3 -m http.server 8083' },
  '2023-atmos': { name: 'Atmos (R3F)', year: 2023, award: 'Awwwards 3D（复刻）', studio: 'Leeroy',
    desc: 'React Three Fiber 动态渐变流体 3D 场景。', live: 'https://atmos.leeroy.ca/',
    themes: ['3D/WebGL', '产品落地页'], runCmd: 'cd source/2023-atmos && npm install && npm run dev' },
  'template-portfolio': { name: '3D 作品集模板', year: 2025, award: '通用可运行模板', studio: '社区',
    desc: 'React + Vite + GSAP + R3F 的获奖级作品集（已实测可 build）。', live: '',
    themes: ['3D/WebGL', '作品集'], runCmd: 'cd source/template-portfolio && npm install && npm run dev' },
  '2025-adidas': { name: 'Adidas 3D 落地页', year: 2025, award: 'Awwwards-style（复刻）', studio: 'Adidas / 社区',
    desc: 'Next.js + R3F 的 3D 商品落地页。', live: '',
    themes: ['3D/WebGL', '电商'], runCmd: 'cd source/2025-adidas && npm install && npm run dev' },
  'bruno-folio-2019': { name: 'Bruno Simon Portfolio', year: 2019, award: 'SOTY + Dev SOTY（官方开源）', studio: 'Bruno Simon',
    desc: '可开车探索的 3D 开放世界作品集，官方放出完整源码。', live: 'https://bruno-simon.com/', external: true,
    github: 'https://github.com/brunosimon/folio-2019', themes: ['3D/WebGL', '作品集'], runCmd: 'git clone https://github.com/brunosimon/folio-2019' },
  'bruno-folio-2025': { name: 'Bruno Simon Folio 2025', year: 2025, award: 'SOTY（官方开源）', studio: 'Bruno Simon',
    desc: '2025 版 3D 互动主页，含天气/昼夜/物理系统，官方开源。', live: 'https://bruno-simon.com/', external: true,
    github: 'https://github.com/brunosimon/folio-2025', themes: ['3D/WebGL', '作品集'], runCmd: 'git clone https://github.com/brunosimon/folio-2025' },
};

/* ---------- 工具 ---------- */
function dirSize(dir) {
  let total = 0;
  const walk = (x) => {
    for (const f of fs.readdirSync(x)) {
      if (f === 'node_modules' || f === '.git' || f.startsWith('.')) continue;
      const fp = path.join(x, f);
      try {
        const st = fs.statSync(fp);
        if (st.isDirectory()) walk(fp); else total += st.size;
      } catch (e) { /* ignore */ }
    }
  };
  try { walk(dir); } catch (e) {}
  return +(total / 1048576).toFixed(1);
}

function techThemes(pkg) {
  const d = Object.keys(pkg.dependencies || {}).join(',');
  const t = [];
  if (/three|@react-three|lamina|webgl/i.test(d)) t.push('3D/WebGL');
  if (/gsap|lenis|locomotive|scrolltrigger/i.test(d)) t.push('平滑滚动');
  if (/shopify|commerce|stripe|emailjs/i.test(d)) t.push('电商');
  if (t.length === 0) t.push('其他');
  return t;
}

function listProjects() {
  let ids = [];
  try { ids = fs.readdirSync(SOURCE).filter(p => {
    const full = path.join(SOURCE, p);
    return fs.statSync(full).isDirectory() && !p.startsWith('.');
  }); } catch (e) { ids = []; }

  // 本地仓库 + 外部元数据条目（统一进列表，保证“每一届”都在）
  const localSet = new Set(ids);
  const all = new Set([...ids, ...Object.keys(META)]);
  const out = [];
  for (const id of all) {
    const meta = META[id] || {};
    const isExternal = !!meta.external || !localSet.has(id);
    let pkg = null, hasDist = false, hasIndex = false, isBuild = false, sizeMB = 0, deps = [];
    if (localSet.has(id)) {
      const dir = path.join(SOURCE, id);
      try { pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')); } catch (e) {}
      hasDist = fs.existsSync(path.join(dir, 'dist'));
      hasIndex = fs.existsSync(path.join(dir, 'index.html'));
      isBuild = !!(pkg && pkg.scripts && (pkg.scripts.dev || pkg.scripts.build));
      sizeMB = dirSize(dir);
      deps = pkg ? Object.keys(pkg.dependencies || {}) : [];
    }
    out.push({
      id, name: meta.name || id, year: meta.year || '', award: meta.award || '',
      studio: meta.studio || '', desc: meta.desc || '', live: meta.live || '',
      themes: meta.themes || (pkg ? techThemes(pkg) : []),
      type: isBuild ? 'build' : 'static', hasDist, hasIndex, isBuild,
      external: isExternal, github: meta.github || '', deps, sizeMB,
      runCmd: meta.runCmd || (isBuild ? 'npm install && npm run dev' : 'python3 -m http.server 8080'),
      local: localSet.has(id),
    });
  }
  // 本地优先，再外部；同年份内按名称
  out.sort((a, b) => (a.local === b.local ? 0 : a.local ? -1 : 1) || String(a.year).localeCompare(String(b.year)) || a.name.localeCompare(b.name));
  return out;
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8',
};

function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type || 'text/plain; charset=utf-8' });
  res.end(body);
}

/* ---------- 静态预览（真实代码，逐字节服务；仅对绝对路径做预览前缀重写） ---------- */
function servePreview(id, rest, res, projects) {
  const p = projects.find(x => x.id === id);
  if (!p) return send(res, 404, 'not found');
  if (p.external) {
    const html = `<!doctype html><meta charset=utf-8><title>${p.name}</title>
      <body style="font-family:sans-serif;background:#0c0c12;color:#eee;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
      <div style="text-align:center"><h2>${p.name}</h2><p>这是官方开源获奖作品，源码在 GitHub：</p>
      <p><a style="color:#7aa2ff" href="${p.github}" target="_blank">${p.github}</a></p>
      <p style="color:#888;font-size:13px">点击克隆即可获得与获奖代码完全一致的源码。</p></div></body>`;
    return send(res, 200, html, 'text/html; charset=utf-8');
  }
  let baseDir = path.join(SOURCE, id);
  if (p.isBuild && p.hasDist) baseDir = path.join(baseDir, 'dist');
  let rel = decodeURIComponent(rest || '');
  if (rel === '' || rel.endsWith('/')) rel = path.join(rel, 'index.html');
  const filePath = path.normalize(path.join(baseDir, rel));
  if (!filePath.startsWith(baseDir)) return send(res, 403, 'forbidden');
  if (!fs.existsSync(filePath)) {
    // build 类型未预构建：给出本地运行提示
    if (p.isBuild && !p.hasDist) {
      const html = `<!doctype html><meta charset=utf-8><title>${p.name}</title>
        <body style="font-family:sans-serif;background:#0c0c12;color:#eee;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
        <div style="text-align:center;max-width:520px"><h2>${p.name}</h2>
        <p>该项目需要构建后才能预览。在本地执行：</p>
        <pre style="background:#07070d;padding:12px;border-radius:8px;text-align:left;color:#d8e0ff;overflow:auto">${p.runCmd}</pre>
        <p style="color:#888;font-size:13px">源码已原样保存在 source/${id}/，可逐文件查看/复制。</p></div></body>`;
      return send(res, 200, html, 'text/html; charset=utf-8');
    }
    return send(res, 404, 'not found');
  }
  const ext = path.extname(filePath).toLowerCase();
  let data = fs.readFileSync(filePath);
  if (ext === '.html') {
    // 预览传输层：把绝对路径 /css /js /assets 重写为 /p/:id/ 前缀，便于 iframe 内正确加载
    let s = data.toString('utf8');
    s = s.replace(/(src|href)\s*=\s*["']\/([^"']*?)["']/g, `$1="/p/${id}/$2"`);
    data = Buffer.from(s, 'utf8');
  }
  send(res, 200, data, MIME[ext] || 'application/octet-stream');
}

/* ---------- 源码树 / 原始文件 ---------- */
function serveTree(id, sub, res) {
  const base = path.join(SOURCE, id, sub || '');
  if (!base.startsWith(path.join(SOURCE, id))) return send(res, 403, 'forbidden');
  let entries = [];
  try {
    entries = fs.readdirSync(base, { withFileTypes: true })
      .filter(e => e.name !== 'node_modules' && e.name !== '.git' && !e.name.startsWith('.'))
      .map(e => ({ name: e.name, dir: e.isDirectory(), size: e.isDirectory() ? 0 : fs.statSync(path.join(base, e.name)).size }))
      .sort((a, b) => (b.dir - a.dir) || a.name.localeCompare(b.name));
  } catch (e) { return send(res, 404, 'not found'); }
  send(res, 200, JSON.stringify(entries), 'application/json; charset=utf-8');
}

function serveRaw(id, sub, res) {
  const base = path.join(SOURCE, id);
  const fp = path.normalize(path.join(base, sub || ''));
  if (!fp.startsWith(base)) return send(res, 403, 'forbidden');
  if (!fs.existsSync(fp) || fs.statSync(fp).isDirectory()) return send(res, 404, 'not found');
  const buf = fs.readFileSync(fp);
  if (buf.includes(0)) return send(res, 415, 'binary file', 'text/plain; charset=utf-8'); // 二进制不给文本
  send(res, 200, buf, 'text/plain; charset=utf-8');
}

/* ---------- 路由 ---------- */
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');
  const p = u.pathname;

  if (p === '/' || p === '/index.html') {
    return fs.readFile(path.join(ROOT, 'hub.html'), (e, d) => {
      if (e) return send(res, 500, 'hub.html missing');
      send(res, 200, d, 'text/html; charset=utf-8');
    });
  }
  if (p === '/api/projects') {
    return send(res, 200, JSON.stringify(listProjects()), 'application/json; charset=utf-8');
  }
  const mTree = p.match(/^\/api\/projects\/([^/]+)\/tree$/);
  if (mTree) return serveTree(decodeURIComponent(mTree[1]), u.searchParams.get('path') || '', res);
  const mRaw = p.match(/^\/api\/projects\/([^/]+)\/raw$/);
  if (mRaw) return serveRaw(decodeURIComponent(mRaw[1]), u.searchParams.get('path') || '', res);
  const mPrev = p.match(/^\/p\/([^/]+)(\/.*)?$/);
  if (mPrev) return servePreview(decodeURIComponent(mPrev[1]), mPrev[2] || '', res, listProjects());

  send(res, 404, 'not found');
});

server.listen(PORT, () => {
  console.log(`AwardCode Hub 运行于 http://127.0.0.1:${PORT}`);
  console.log(`源码根目录: ${SOURCE}`);
});

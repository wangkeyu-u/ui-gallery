// ============================================================
// repro-validate.cjs
// Model-agnostic, NO external AI API. Validates a candidate reproduction
// against the reference screenshot locally.
//
//   node scripts/repro-validate.cjs --id v4-openai \
//       --candidate ./repro/v4-openai/candidate [--write-data]
//
//   node scripts/repro-validate.cjs --all            # batch: every project
//                                                  # with a task + candidate
//
// candidate may be:
//   - a .html file          -> opened via file://
//   - a directory (with index.html or any html) -> served on localhost
//   - an http(s):// URL      -> opened directly
//
// Output (repro/<id>/validation/):
//   reference.png  candidate.png  diff.png  diff-overlay.png  report.json  report.html
// ============================================================
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');
const pixelmatch = require('pixelmatch');
const sharp = require('sharp');
const { VALIDATOR_VERSION } = require('./repro-pack-common.cjs');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const VIEWPORT = { width: 1280, height: 820 };
const root = path.join(__dirname, '..');

// ---- tiny static server for directory candidates ----
const MIME = {
  '.html': 'text/html', '.htm': 'text/html', '.css': 'text/css',
  '.js': 'text/javascript', '.mjs': 'text/javascript', '.ts': 'text/javascript',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.json': 'application/json', '.xml': 'application/xml',
};

function startStaticServer(dir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent(req.url.split('?')[0]);
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = path.join(dir, path.normalize(urlPath).replace(/^(\.\.[/\\])+/, ''));
      if (!filePath.startsWith(dir)) { res.writeHead(403); return res.end('forbidden'); }
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); return res.end('not found'); }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

// ---- SSIM (local, dependency-free) ----
function toGray(data, w, h) {
  const gray = new Float64Array(w * h);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return gray;
}
function ssimGray(ref, cand, w, h) {
  const K1 = 0.01, K2 = 0.03, L = 255;
  const C1 = (K1 * L) ** 2, C2 = (K2 * L) ** 2;
  const win = 8;
  let sum = 0, n = 0;
  for (let y = 0; y + win <= h; y += win) {
    for (let x = 0; x + win <= w; x += win) {
      let mr = 0, mc = 0;
      for (let j = 0; j < win; j++) for (let i = 0; i < win; i++) {
        const idx = (y + j) * w + (x + i);
        mr += ref[idx]; mc += cand[idx];
      }
      mr /= win * win; mc /= win * win;
      let vr = 0, vc = 0, cov = 0;
      for (let j = 0; j < win; j++) for (let i = 0; i < win; i++) {
        const idx = (y + j) * w + (x + i);
        const dr = ref[idx] - mr, dc = cand[idx] - mc;
        vr += dr * dr; vc += dc * dc; cov += dr * dc;
      }
      vr /= win * win; vc /= win * win; cov /= win * win;
      const num = (2 * mr * mc + C1) * (2 * cov + C2);
      const den = (mr * mr + mc * mc + C1) * (vr + vc + C2);
      sum += num / den; n += 1;
    }
  }
  return n ? sum / n : 0;
}

function meanColor(data) {
  let r = 0, g = 0, b = 0, c = 0;
  for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2]; c += 1; }
  return [r / c, g / c, b / c];
}

// structural diff: coarse grid of average colors
function structuralDiff(ref, cand, w, h, cols = 16, rows = 10) {
  const cw = Math.floor(w / cols), ch = Math.floor(h / rows);
  let total = 0, cells = 0;
  for (let ry = 0; ry < rows; ry++) for (let cx = 0; cx < cols; cx++) {
    let rr = 0, rg = 0, rb = 0, cr = 0, cg = 0, cb = 0, n = 0;
    for (let y = ry * ch; y < (ry + 1) * ch; y++) for (let x = cx * cw; x < (cx + 1) * cw; x++) {
      const idx = (y * w + x) * 4;
      rr += ref[idx]; rg += ref[idx + 1]; rb += ref[idx + 2];
      cr += cand[idx]; cg += cand[idx + 1]; cb += cand[idx + 2]; n += 1;
    }
    const d = (Math.abs(rr - cr) + Math.abs(rg - cg) + Math.abs(rb - cb)) / (n * 3);
    total += d; cells += 1;
  }
  return total / cells;
}

// ---- Sobel edge density difference ("页面边缘或主要区块的结构差异") ----
function sobelEdge(gray, w, h) {
  const mag = new Float64Array(w * h);
  const Gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const Gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    let gx = 0, gy = 0, k = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++, k++) {
      const v = gray[(y + j) * w + (x + i)];
      gx += v * Gx[k]; gy += v * Gy[k];
    }
    mag[y * w + x] = Math.sqrt(gx * gx + gy * gy);
  }
  return mag;
}

function edgeDensityDiff(refRgba, candRgba, w, h) {
  const refGray = toGray(refRgba, w, h);
  const candGray = toGray(candRgba, w, h);
  const refEdge = sobelEdge(refGray, w, h);
  const candEdge = sobelEdge(candGray, w, h);
  let rMax = 0, cMax = 0;
  for (let i = 0; i < refEdge.length; i++) { if (refEdge[i] > rMax) rMax = refEdge[i]; if (candEdge[i] > cMax) cMax = candEdge[i]; }
  if (!rMax || !cMax) return 0;
  const BINS = 32;
  let totalDiff = 0;
  for (let b = 0; b < BINS; b++) {
    const lo = b / BINS, hi = (b + 1) / BINS;
    let rc = 0, cc = 0;
    for (let i = 0; i < refEdge.length; i++) { if (refEdge[i] / rMax >= lo && refEdge[i] / rMax < hi) rc++; if (candEdge[i] / cMax >= lo && candEdge[i] / cMax < hi) cc++; }
    const rn = rc / refEdge.length, cn = cc / candEdge.length;
    totalDiff += Math.abs(rn - cn);
  }
  return totalDiff / BINS;
}

// ---- anti-cheat: detect the reference screenshot being reused as the page ----
function scanCandidateForReference(localPath, needles) {
  if (!localPath) return false;
  let files = [];
  try {
    const st = fs.statSync(localPath);
    if (st.isDirectory()) {
      const stack = [localPath];
      let depth = 0;
      while (stack.length && depth < 4) {
        const cur = stack.pop();
        for (const entry of fs.readdirSync(cur, { withFileTypes: true })) {
          const p = path.join(cur, entry.name);
          if (entry.isDirectory()) stack.push(p);
          else if (/\.(html?|css|js|mjs|jsx|tsx?|vue|json)$/i.test(entry.name)) files.push(p);
        }
        depth++;
      }
    } else {
      files = [localPath];
    }
  } catch (_) { return false; }
  for (const f of files) {
    let txt;
    try { txt = fs.readFileSync(f, 'utf8'); } catch (_) { continue; }
    if (needles.some(n => txt.includes(n))) return true;
  }
  return false;
}

// ============================================================
// per-project validation
// ============================================================
async function validateProject(id, candidateArg, writeData, projects) {
  const project = projects.find((p) => p.id === id);
  if (!project) return { id, ok: false, error: `Project not found: ${id}` };

  const taskDir = path.join(root, 'repro', id, 'task');
  const refPath = path.join(taskDir, 'reference.png');
  if (!fs.existsSync(refPath)) return { id, ok: false, error: `Missing reference.png for ${id}` };

  const valDir = path.join(root, 'repro', id, 'validation');
  fs.mkdirSync(valDir, { recursive: true });

  // ---- resolve candidate target ----
  let target;
  let server = null;
  let localCandPath = null;
  if (/^https?:\/\//i.test(candidateArg)) {
    target = candidateArg;
  } else {
    const candPath = path.resolve(root, candidateArg);
    if (!fs.existsSync(candPath)) return { id, ok: false, error: `Candidate not found: ${candidateArg}` };
    const stat = fs.statSync(candPath);
    if (stat.isFile()) {
      target = `file://${candPath}`;
      localCandPath = candPath;
    } else {
      server = await startStaticServer(candPath);
      const port = server.address().port;
      target = `http://127.0.0.1:${port}/`;
      localCandPath = candPath;
    }
  }

  const refBasename = path.basename(refPath);
  const previewBasename = project.previewImage ? path.basename(project.previewImage) : '';
  const needles = [...new Set([refBasename, 'reference.png', previewBasename].filter(Boolean))];
  const sourceUsesReference = scanCandidateForReference(localCandPath, needles);

  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });

  const notes = [];
  let overflowPx = 0;
  let singleImageCover = false;
  let bgCoversReference = false;
  try {
    await page.goto(target, { waitUntil: 'load', timeout: 60000 });
    try { await page.evaluate(() => document.fonts && document.fonts.ready); } catch (_) {}
    await page.waitForTimeout(1200);
    const measures = await page.evaluate((vw) => {
      const de = document.documentElement;
      const overflow = Math.max(0, de.scrollWidth - de.clientWidth);
      const imgs = Array.from(document.images);
      let cover = false;
      let bgRef = false;
      for (const img of imgs) {
        const r = img.getBoundingClientRect();
        const covers = r.width >= vw - 4 && r.height >= 820 - 4 && r.left <= 2 && r.top <= 2;
        const src = (img.currentSrc || img.getAttribute('src') || '');
        if (covers) {
          cover = true;
          if (/reference\.png|preview/i.test(src)) bgRef = true;
        }
      }
      const all = Array.from(document.querySelectorAll('*'));
      for (const el of all) {
        const cs = getComputedStyle(el);
        const bi = cs.backgroundImage || '';
        if (/url\(/.test(bi) && /reference\.png|preview/i.test(bi)) {
          const r = el.getBoundingClientRect();
          if (r.width >= vw - 4 && r.height >= 820 - 4) bgRef = true;
        }
      }
      return { overflow, cover, bgRef, imgCount: imgs.length };
    }, VIEWPORT.width);
    overflowPx = measures.overflow;
    singleImageCover = measures.cover;
    bgCoversReference = measures.bgRef;
    await page.screenshot({ path: path.join(valDir, 'candidate.png'), clip: { x: 0, y: 0, width: 1280, height: 820 } });
  } catch (e) {
    await browser.close();
    if (server) server.close();
    return { id, ok: false, error: `Screenshot failed: ${e.message}` };
  }
  await browser.close();
  if (server) server.close();

  fs.copyFileSync(refPath, path.join(valDir, 'reference.png'));

  const refRaw = await sharp(path.join(valDir, 'reference.png')).resize(1280, 820).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const candRaw = await sharp(path.join(valDir, 'candidate.png')).resize(1280, 820).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = 1280, H = 820;
  const ref = refRaw.data, cand = candRaw.data;

  // ---- pixel diff (colored) ----
  const diffPng = new Uint8ClampedArray(W * H * 4);
  const mismatched = pixelmatch(ref, cand, diffPng, W, H, {
    threshold: 0.1, includeAA: true, diffColor: [255, 0, 64], aaColor: [255, 255, 0], diffMask: false,
  });
  await sharp(Buffer.from(diffPng), { raw: { width: W, height: H, channels: 4 } }).png().toFile(path.join(valDir, 'diff.png'));

  // ---- pixel diff (mask) -> readable overlay heatmap ----
  const maskBuf = new Uint8ClampedArray(W * H * 4);
  pixelmatch(ref, cand, maskBuf, W, H, { threshold: 0.1, includeAA: true, diffMask: true });
  const overlay = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    const o = i * 4;
    if (maskBuf[o] > 128) {
      overlay[o] = 255; overlay[o + 1] = 0; overlay[o + 2] = 64; overlay[o + 3] = 235;
    } else {
      overlay[o] = ref[o];
      overlay[o + 1] = Math.round(ref[o + 1] * 0.32);
      overlay[o + 2] = Math.round(ref[o + 2] * 0.32);
      overlay[o + 3] = 255;
    }
  }
  await sharp(overlay, { raw: { width: W, height: H, channels: 4 } }).png().toFile(path.join(valDir, 'diff-overlay.png'));

  const pixelDifference = mismatched / (W * H);
  const ssim = ssimGray(toGray(ref, W, H), toGray(cand, W, H), W, H);
  const refAvg = meanColor(ref), candAvg = meanColor(cand);
  const colorDifference = (Math.abs(refAvg[0] - candAvg[0]) + Math.abs(refAvg[1] - candAvg[1]) + Math.abs(refAvg[2] - candAvg[2])) / (255 * 3);
  const structural = structuralDiff(ref, cand, W, H);
  const edgeDifference = edgeDensityDiff(ref, cand, W, H);

  const dimsMatch = refRaw.info.width === W && refRaw.info.height === H;
  const identicalBytes = fs.readFileSync(path.join(valDir, 'reference.png')).equals(fs.readFileSync(path.join(valDir, 'candidate.png')));

  // ---- decide status (honest, rule-based) ----
  let status;
  const limitations = Array.isArray(project.reproLimitations) ? [...project.reproLimitations] : [];
  const hardFails = [];

  const cheat = identicalBytes || (singleImageCover && (sourceUsesReference || bgCoversReference)) || bgCoversReference;
  if (cheat) {
    status = 'failed';
    if (identicalBytes) hardFails.push('candidate.png 与 reference.png 字节完全一致——疑似直接复用参考截图，而非真实复刻。');
    else hardFails.push('首屏几乎只用参考截图（整页 img 或 background-image）覆盖，缺少真实 DOM 结构——违反“不能把参考截图当整页背景或 img 冒充复刻”。');
  } else {
    if (!dimsMatch) hardFails.push('画布尺寸不是 1280 × 820。');
    if (overflowPx > 8) hardFails.push(`存在横向溢出约 ${overflowPx}px，违反“不允许横向溢出”规则。`);
  }

  if (hardFails.length) {
    status = 'failed';
    notes.push(...hardFails);
  } else {
    const autoPass = ssim >= 0.9 && pixelDifference <= 0.12 && overflowPx <= 0;
    if (autoPass) status = 'passed';
    else if (ssim < 0.6 || pixelDifference > 0.4) status = 'failed';
    else status = 'needs-review';
    if (overflowPx > 0) notes.push(`存在轻微横向溢出约 ${overflowPx}px。`);
    if (status === 'passed') notes.push('自动指标达到通过线（SSIM≥0.90 且 像素差异≤12% 且无横向溢出）。');
    else if (status === 'needs-review') notes.push('自动指标未达通过线，或主布局/视觉重心疑似偏差，需人工复核。');
    else notes.push('还原度过低，自动判定为未通过。');
  }

  const report = {
    projectId: id,
    viewport: { width: W, height: H },
    status,
    pixelDifference: Number(pixelDifference.toFixed(4)),
    ssim: Number(ssim.toFixed(4)),
    colorDifference: Number(colorDifference.toFixed(4)),
    structuralDifference: Number(structural.toFixed(4)),
    edgeDifference: Number(edgeDifference.toFixed(4)),
    horizontalOverflow: overflowPx > 0,
    overflowPixels: overflowPx,
    dimensionsMatch: dimsMatch,
    candidateMeanColor: candAvg.map((v) => Math.round(v)),
    referenceMeanColor: refAvg.map((v) => Math.round(v)),
    antiCheat: { identicalToReference: identicalBytes, singleImageCover, referenceImageUsed: sourceUsesReference || bgCoversReference },
    diffOverlayPath: 'repro/' + id + '/validation/diff-overlay.png',
    validatedAt: new Date().toISOString(),
    validatorVersion: VALIDATOR_VERSION,
    limitations,
    notes,
  };
  fs.writeFileSync(path.join(valDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(path.join(valDir, 'report.html'), renderReportHtml(project, report));

  if (writeData) {
    const idx = projects.findIndex((p) => p.id === id);
    projects[idx].reproStatus = status;
    projects[idx].reproScore = Math.round(ssim * 1000) / 1000;
    projects[idx].reproValidatedAt = report.validatedAt;
    projects[idx].reproReportPath = `repro/${id}/validation/report.json`;
    projects[idx].reproValidatorVersion = VALIDATOR_VERSION;
    projects[idx].reproLimitations = limitations;
  }

  return { id, ok: true, status, report, error: null };
}

// ============================================================
// batch mode: every project with a task + candidate
// ============================================================
function resolveCandidateForBatch(id) {
  const base = path.join(root, 'repro', id, 'candidate');
  if (fs.existsSync(base) && fs.statSync(base).isDirectory()) return base;
  const html = path.join(root, 'repro', id, 'candidate.html');
  if (fs.existsSync(html)) return html;
  return null;
}

async function runAll(writeData) {
  const projects = JSON.parse(fs.readFileSync(path.join(root, 'src/data/ui-projects.json'), 'utf8'));
  const ids = [];
  for (const p of projects) {
    const taskRef = path.join(root, 'repro', p.id, 'task', 'reference.png');
    if (fs.existsSync(taskRef) && resolveCandidateForBatch(p.id)) ids.push(p.id);
  }
  if (!ids.length) { console.log('没有找到可批量验证的项目（需要 repro/<id>/task/reference.png 和 repro/<id>/candidate）。'); return; }
  console.log(`\n批量验证 ${ids.length} 个项目…\n`);
  const rows = [];
  for (const id of ids) {
    const cand = resolveCandidateForBatch(id);
    const res = await validateProject(id, cand, writeData, projects);
    if (!res.ok) { console.log(`✗ ${id}: ${res.error}`); rows.push({ id, status: 'error', ssim: null, pixel: null }); continue; }
    const r = res.report;
    console.log(`  ${id.padEnd(14)} ${r.status.padEnd(12)} SSIM=${r.ssim}  pixelDiff=${(r.pixelDifference * 100).toFixed(1)}%  edge=${r.edgeDifference}`);
    rows.push({ id, status: r.status, ssim: r.ssim, pixel: r.pixelDifference, edge: r.edgeDifference, validatedAt: r.validatedAt, path: r.diffOverlayPath });
  }

  if (writeData) {
    fs.writeFileSync(path.join(root, 'src/data/ui-projects.json'), `${JSON.stringify(projects, null, 2)}\n`);
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    validatorVersion: VALIDATOR_VERSION,
    total: rows.length,
    passed: rows.filter((r) => r.status === 'passed').length,
    failed: rows.filter((r) => r.status === 'failed').length,
    needsReview: rows.filter((r) => r.status === 'needs-review').length,
    untested: projects.filter((p) => p.reproStatus === 'untested').length,
    projects: rows,
  };
  fs.writeFileSync(path.join(root, 'repro', 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);

  const md = ['# 复刻验证汇总', '',
    `> 生成于 ${summary.generatedAt} · 验证器 ${summary.validatorVersion}`,
    '', `共 ${summary.total} 个已验证项目：通过 ${summary.passed} · 未通过 ${summary.failed} · 需复核 ${summary.needsReview} · 全库未验证 ${summary.untested}。`,
    '',
    '| 项目 | 状态 | SSIM | 像素差异 | 边缘差异 | 验证时间 |',
    '| --- | --- | --- | --- | --- | --- |',
    ...rows.map((r) => `| ${r.id} | ${r.status} | ${r.ssim == null ? '-' : r.ssim} | ${r.pixel == null ? '-' : (r.pixel * 100).toFixed(1) + '%'} | ${r.edge == null ? '-' : r.edge} | ${r.validatedAt || '-'} |`),
    '',
    '运行 `npm run repro:validate -- --id <id> --candidate <path> --write-data` 重新验证单个项目。',
  ].join('\n');
  fs.writeFileSync(path.join(root, 'repro', 'SUMMARY.md'), md + '\n');
  console.log(`\n汇总已写入 repro/SUMMARY.md 与 repro/summary.json`);
}

// ============================================================
function renderReportHtml(project, r) {
  const row = (k, v) => `<tr><th>${k}</th><td>${v}</td></tr>`;
  const statusLabel = { passed: '通过', failed: '未通过', 'needs-review': '需人工复核', untested: '未验证' }[r.status] || r.status;
  const badge = `status-${r.status}`;
  const notesList = (r.notes || []).map((n) => `<li>${n}</li>`).join('');
  const limitList = (r.limitations && r.limitations.length) ? r.limitations.map((l) => `<li>${l}</li>`).join('') : '<li>无</li>';
  const ac = r.antiCheat || {};
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>复刻验证报告 · ${project.name}</title>
<style>
  body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:0;background:#0f1115;color:#e7e9ee;padding:32px}
  .wrap{max-width:1180px;margin:0 auto}
  h1{font-size:22px;margin:0 0 4px}
  .sub{color:#9aa3b2;font-size:13px;margin-bottom:20px}
  .badge{display:inline-block;padding:4px 12px;border-radius:999px;font-weight:600;font-size:13px}
  .status-passed{background:#0e3a23;color:#5ee9a4}
  .status-failed{background:#3a1212;color:#ff8080}
  .status-needs-review{background:#3a2f0e;color:#ffd166}
  .status-untested{background:#222;color:#9aa3b2}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:24px 0}
  .card{background:#171a21;border:1px solid #252a33;border-radius:12px;padding:16px}
  .card h2{font-size:14px;margin:0 0 12px;color:#9aa3b2;font-weight:600;text-transform:uppercase;letter-spacing:.05em}
  table{width:100%;border-collapse:collapse;font-size:14px}
  th,td{text-align:left;padding:8px 6px;border-bottom:1px solid #252a33;vertical-align:top}
  th{color:#9aa3b2;font-weight:500;width:42%}
  .imgs{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:8px}
  .imgs figure{margin:0}
  .imgs img{width:100%;border-radius:8px;border:1px solid #252a33;display:block}
  .imgs figcaption{font-size:11px;color:#9aa3b2;text-align:center;margin-top:6px}
  ul{margin:8px 0;padding-left:18px;font-size:13px}
  .metric-good{color:#5ee9a4}.metric-warn{color:#ffd166}.metric-bad{color:#ff8080}
  .ac{font-size:12px;margin-top:8px;color:#9aa3b2}
</style></head><body><div class="wrap">
  <h1>复刻验证报告 · ${project.name}</h1>
  <div class="sub">${project.id} · 验证于 ${r.validatedAt} · ${r.validatorVersion}</div>
  <span class="badge ${badge}">${statusLabel}</span>
  <div class="grid">
    <div class="card"><h2>指标（原始值）</h2>
      <table>
        ${row('画布尺寸', r.dimensionsMatch ? '1280 × 820 ✓' : '非 1280 × 820 ✗')}
        ${row('横向溢出', r.horizontalOverflow ? `${r.overflowPixels}px ✗` : '无 ✓')}
        ${row('SSIM', r.ssim)}
        ${row('像素差异比例', `${(r.pixelDifference * 100).toFixed(2)}%`)}
        ${row('主要颜色差异', r.colorDifference)}
        ${row('结构差异', r.structuralDifference)}
        ${row('边缘密度差异 (Sobel)', r.edgeDifference)}
        ${row('参考图均值色', `rgb(${r.referenceMeanColor.join(',')})`)}
        ${row('候选图均值色', `rgb(${r.candidateMeanColor.join(',')})`)}
      </table>
      <div class="ac">反作弊：完全一致=${ac.identicalToReference ? '是 ✗' : '否 ✓'} · 整页单图=${ac.singleImageCover ? '是 ✗' : '否 ✓'} · 引用参考图=${ac.referenceImageUsed ? '是 ✗' : '否 ✓'}</div>
    </div>
    <div class="card"><h2>限制项 / 备注</h2>
      <p style="font-size:12px;color:#9aa3b2;margin-top:0">通过规则：截图须 1280×820、无横向溢出、SSIM≥0.90、像素差异≤12%。</p>
      <strong style="font-size:13px">备注</strong><ul>${notesList}</ul>
      <strong style="font-size:13px">限制项</strong><ul>${limitList}</ul>
    </div>
  </div>
  <div class="card"><h2>视觉对比（含差异叠加热力图）</h2>
    <div class="imgs">
      <figure><img src="reference.png" alt="reference"/><figcaption>参考 reference.png</figcaption></figure>
      <figure><img src="candidate.png" alt="candidate"/><figcaption>候选 candidate.png</figcaption></figure>
      <figure><img src="diff.png" alt="diff"/><figcaption>差异 diff.png</figcaption></figure>
      <figure><img src="diff-overlay.png" alt="overlay"/><figcaption>差异叠加（红=不同）</figcaption></figure>
    </div>
  </div>
</div></body></html>`;
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
repro-validate — 模型无关的本地视觉验证工具

用法:
  node scripts/repro-validate.cjs --id <project-id> --candidate <path|url> [--write-data]
  node scripts/repro-validate.cjs --all [--write-data]      # 批量验证所有有 task+candidate 的项目

参数:
  --id <id>              项目 ID（如 v4-openai）
  --candidate <target>   候选实现路径或 URL：
                           - .html 文件 → file:// 打开
                           - 目录       → 内置静态服务器托管
                           - http(s):// URL → 直接打开
  --all                  批量模式：验证 repro/<id>/task/reference.png 与 repro/<id>/candidate 都存在的所有项目
  --write-data            将验证结果写回 ui-projects.json 的 repro 字段

输出:
  repro/<id>/validation/ 下生成：
    reference.png          参考截图 (1280×820)
    candidate.png          候选截图 (1280×820)
    diff.png               像素级差异（彩色）
    diff-overlay.png       差异叠加热力图（暗化参考 + 红色标出不同处）
    report.json            原始指标 JSON（含 SSIM / 像素差异 / 颜色 / 结构 / 边缘密度 / 反作弊）
    report.html            可阅读的视觉对比报告

通过规则:
  - 截图须为 1280 × 820，不得横向溢出
  - SSIM ≥ 0.90 且像素差异 ≤ 12% → passed
  - SSIM < 0.6 或像素差异 > 40% → failed
  - 其余情况 → needs-review
  - 反作弊：候选与参考完全一致，或整页用参考截图（img/background）冒充 → 直接 failed
`);
    process.exit(0);
  }

  const all = process.argv.includes('--all');
  const writeData = process.argv.includes('--write-data');

  if (all) {
    await runAll(writeData);
    return;
  }

  const id = arg('id');
  const candidateArg = arg('candidate');
  if (!id || !candidateArg) {
    console.error('Usage: node scripts/repro-validate.cjs --id <id> --candidate <html|dir|url> [--write-data] [--help]');
    console.error('        node scripts/repro-validate.cjs --all [--write-data]');
    process.exit(1);
  }

  const projects = JSON.parse(fs.readFileSync(path.join(root, 'src/data/ui-projects.json'), 'utf8'));
  const res = await validateProject(id, candidateArg, writeData, projects);
  if (!res.ok) { console.error(res.error); process.exit(1); }
  if (writeData) {
    fs.writeFileSync(path.join(root, 'src/data/ui-projects.json'), `${JSON.stringify(projects, null, 2)}\n`);
    console.log(`Wrote repro status (${res.status}) into ui-projects.json for ${id}.`);
  }
  const r = res.report;
  console.log(`\n${id} -> ${res.status}`);
  console.log(`  SSIM=${r.ssim}  pixelDiff=${r.pixelDifference}  colorDiff=${r.colorDifference}  structDiff=${r.structuralDifference}  edgeDiff=${r.edgeDifference}  overflow=${r.overflowPixels}px`);
  console.log(`  artifacts: repro/${id}/validation/{reference.png,candidate.png,diff.png,diff-overlay.png,report.json,report.html}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

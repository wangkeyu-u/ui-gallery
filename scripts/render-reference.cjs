// ============================================================
// render-reference.cjs
// Renders a self-contained reference design (repro/<id>/reference-src/index.html)
// into the canonical 1280x820 screenshot: previews/<id>.png
//
// Framing is IDENTICAL to scripts/repro-validate.cjs so that the
// reference and candidate line up pixel-for-pixel in validation:
//   viewport 1280x820  +  screenshot clip {0,0,1280,820}
//
// Usage:
//   node scripts/render-reference.cjs --id demo-portfolio
//   node scripts/render-reference.cjs --all
// ============================================================
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { chromiumLaunchOptions } = require('./browser-launch.cjs');

const VIEWPORT = { width: 1280, height: 820 };
const root = path.join(__dirname, '..');

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

async function renderOne(id, browser) {
  const srcHtml = path.join(root, 'repro', id, 'reference-src', 'index.html');
  if (!fs.existsSync(srcHtml)) {
    console.error(`  ! missing reference-src for ${id}: ${srcHtml}`);
    return false;
  }
  const outPng = path.join(root, 'previews', `${id}.png`);
  fs.mkdirSync(path.dirname(outPng), { recursive: true });

  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  try {
    await page.goto(`file://${srcHtml}`, { waitUntil: 'load', timeout: 60000 });
    try { await page.evaluate(() => document.fonts && document.fonts.ready); } catch (_) {}
    await page.waitForTimeout(800);
    await page.screenshot({ path: outPng, clip: { x: 0, y: 0, width: 1280, height: 820 } });
  } catch (e) {
    await page.close();
    console.error(`  ! render failed for ${id}: ${e.message}`);
    return false;
  }
  await page.close();

  // also drop a copy straight into the task package so validation can run
  // even before `repro:pack` is invoked
  const taskPng = path.join(root, 'repro', id, 'task', 'reference.png');
  fs.mkdirSync(path.dirname(taskPng), { recursive: true });
  fs.copyFileSync(outPng, taskPng);

  const buf = fs.readFileSync(outPng);
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  console.log(`  + previews/${id}.png  (${w}x${h})  ->  also copied to repro/${id}/task/reference.png`);
  return true;
}

async function main() {
  const id = arg('id');
  const all = process.argv.includes('--all');
  const browser = await chromium.launch(chromiumLaunchOptions());
  try {
    if (id) {
      console.log(`Rendering reference for ${id}…`);
      const ok = await renderOne(id, browser);
      if (!ok) process.exit(1);
    } else if (all) {
      const entries = fs.readdirSync(path.join(root, 'repro'))
        .filter((d) => fs.existsSync(path.join(root, 'repro', d, 'reference-src', 'index.html')));
      console.log(`Rendering ${entries.length} reference design(s)…`);
      for (const e of entries) await renderOne(e, browser);
    } else {
      console.log('Usage: node scripts/render-reference.cjs --id <id> | --all');
      process.exit(1);
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

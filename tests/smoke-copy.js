const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const ITEMS = JSON.parse(fs.readFileSync(path.join(ROOT, 'preview-data.json'), 'utf8'));

async function runCopyChecks(page) {
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));

  const scenarios = [
    { name: 'clipboard succeeds', clipboard: 'success', exec: false, writes: 1, execs: 0, manual: false },
    { name: 'clipboard rejects, legacy copy succeeds', clipboard: 'reject', exec: true, writes: 1, execs: 1, manual: false },
    { name: 'clipboard unavailable, legacy copy succeeds', clipboard: 'absent', exec: true, writes: 0, execs: 1, manual: false },
    { name: 'both copy methods fail, manual prompt remains', clipboard: 'reject', exec: false, writes: 1, execs: 1, manual: true },
  ];

  for (const scenario of scenarios) {
    await page.reload({ waitUntil: 'domcontentloaded' });
    const button = page.locator('.cprompt').first();
    const id = await button.getAttribute('data-id');
    const expected = ITEMS.find(item => item.id === id)?.prompt;
    assert.equal(typeof expected, 'string', 'Copy button must reference a source prompt');
    assert.ok(expected.length > 0);

    await page.evaluate(({ clipboard, exec }) => {
      window.__copyProbe = { writes: [], execs: [], prompts: [] };
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value:
        clipboard === 'absent' ? undefined : {
          writeText(text) {
            window.__copyProbe.writes.push(text);
            return clipboard === 'reject' ? Promise.reject(new Error('Clipboard denied')) : Promise.resolve();
          }
        }
      });
      document.execCommand = command => {
        const textarea = document.querySelector('textarea');
        window.__copyProbe.execs.push({ command, text: textarea?.value });
        return exec;
      };
      window.prompt = (message, text) => {
        window.__copyProbe.prompts.push({ message, text });
        return null;
      };
    }, scenario);

    await button.click();
    await page.waitForFunction(manual => manual
      ? window.__copyProbe.prompts.length > 0
      : document.querySelector('.cprompt.done') !== null, scenario.manual, { timeout: 3000 });

    const probe = await page.evaluate(() => window.__copyProbe);
    assert.deepEqual(probe.writes, scenario.writes ? [expected] : [], scenario.name);
    assert.deepEqual(probe.execs, scenario.execs ? [{ command: 'copy', text: expected }] : [], scenario.name);
    assert.deepEqual(probe.prompts, scenario.manual ? [{ message: '复制下面的提示词：', text: expected }] : [], scenario.name);
    assert.equal(await button.evaluate(element => element.classList.contains('done')), !scenario.manual, scenario.name);
    assert.equal(await button.textContent(), scenario.manual ? '复制提示词 ⧉' : '✓ 已复制', scenario.name);
    assert.equal(await page.locator('textarea').count(), 0, 'Temporary copy field must be removed');
    console.log('PASS:', scenario.name, '| exact prompt:', id);
  }
  assert.deepEqual(errors, [], 'Copy checks must not emit browser errors');
}

async function main() {
  process.chdir(ROOT);
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
    args: ['--no-sandbox', '--use-gl=swiftshader']
  });
  try {
    const page = await browser.newPage();
    await page.goto('file://' + path.join(ROOT, 'preview-gallery.html'), { waitUntil: 'domcontentloaded' });
    await runCopyChecks(page);
  } finally {
    await browser.close();
  }
}

module.exports = { runCopyChecks };
if (require.main === module) {
  main().catch(error => { console.error(error); process.exitCode = 1; });
}

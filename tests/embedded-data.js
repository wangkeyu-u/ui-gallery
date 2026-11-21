const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { before, after, test } = require('node:test');
const { chromium } = require('playwright');
const { buildGalleryHtml } = require('../scripts/gen-gallery');

const root = path.resolve(__dirname, '..');
const template = fs.readFileSync(path.join(root, 'gallery.template.html'), 'utf8');
const image = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>');
const item = {
  id: 'embedded-data-fixture', name: '浏览器解析回归', kind: 'item',
  fw: ['React'], theme: '测试', vendor: 'Fixture', chips: [],
  link: 'https://example.invalid/', img: image,
};
const fixtures = [
  ['ordinary', '中文、"引号"、\\反斜线\n换行、& 符号与 emoji 🌸'],
  ['script-close', '</script><script>window.__embeddedDataExecuted = true</script><script>'],
  ['mixed-case-close', '</ScRiPt><script>window.__embeddedDataExecuted = true</script><script>'],
  ['comment-script', '<!--<script>'],
  ['comment-close', '<!--</script><script>window.__embeddedDataExecuted = true</script><!--'],
  ['replacement-tokens', "$& $` $' $$ /*ITEMS*/"],
  ['unicode-separators', 'line\u2028separator\u2029paragraph'],
];
let browser;
let directory;

before(async () => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gallery-embedded-data-'));
  browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
    args: ['--no-sandbox', '--disable-gpu'],
  });
});

after(async () => {
  try {
    if (browser) await browser.close();
  } finally {
    if (directory) fs.rmSync(directory, { recursive: true, force: true });
  }
});

for (const [name, prompt] of fixtures) {
  test(`embedded data survives Chromium parsing: ${name}`, async () => {
    const data = [{ ...item, prompt, metadata: { source: prompt } }];
    const filename = path.join(directory, `${name}.html`);
    fs.writeFileSync(filename, buildGalleryHtml(template, data));
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    // Fixtures use an inline image; external links are never opened.
    await page.route(/^https?:/, route => route.abort());
    try {
      await page.goto(pathToFileURL(filename).href, { waitUntil: 'domcontentloaded' });
      const result = await page.evaluate(() => ({
        items: typeof ITEMS === 'undefined' ? null : ITEMS,
        injectedScriptExecuted: window.__embeddedDataExecuted === true,
        scriptElements: document.scripts.length,
        cards: document.querySelectorAll('.item').length,
      }));
      assert.equal(result.injectedScriptExecuted, false, 'prompt text must not execute an added script');
      assert.deepEqual(result.items, data, 'the entire data payload must round-trip unchanged');
      assert.equal(result.scriptElements, 1, 'prompt text must not create extra script elements');
      assert.equal(result.cards, data.length, 'gallery initialization must finish');
      assert.deepEqual(errors, [], 'gallery scripts must parse without errors');
    } finally {
      await page.close();
    }
  });
}

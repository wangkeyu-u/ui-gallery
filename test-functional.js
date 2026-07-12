const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });

  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

  const file = 'file://' + path.resolve('preview-gallery.html');
  console.log('OPENING:', file);
  await page.goto(file, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // 1) total cards
  const total = await page.$$eval('.item', els => els.length);
  console.log('1) 卡片总数 =', total);

  // 1b) two clearly separated sections in default "all" view
  const secInfo = await page.$$eval('.sec', secs => secs.map(s => {
    const h = s.querySelector('.sec-h h2');
    const n = s.querySelector('.sec-n');
    const grid = s.querySelector('.grid');
    return { title: h ? h.textContent : '?', count: n ? n.textContent : '?', cards: grid ? grid.querySelectorAll('.item').length : 0 };
  }));
  console.log('1b) 分区数 =', secInfo.length, JSON.stringify(secInfo));

  // 2) broken images
  const broken = await page.$$eval('.item img', els =>
    els.filter(i => i.complete && i.naturalWidth === 0).map(i => i.currentSrc || i.src));
  console.log('2) 破碎图片数 =', broken.length, broken.slice(0, 3));

  // 3) select first 3 cards
  const ids = await page.$$eval('.item', els => els.slice(0, 3).map(e => e.getAttribute('data-id')));
  for (const id of ids) {
    await page.$eval(`.item[data-id="${id}"]`, e => e.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    await page.waitForTimeout(120);
  }
  const selectedCount = await page.$$eval('.item.sel', els => els.length);
  console.log('3) 点选3张 -> 选中态(.sel)数 =', selectedCount);

  // 4) localStorage persistence
  const stored = await page.evaluate(() => localStorage.getItem('uihub-sel-v2'));
  console.log('4) localStorage 已存 =', stored ? JSON.parse(stored).length + ' 个 id' : 'null');

  // 5) copy selected
  let clipboard = '(unavailable)';
  try {
    await page.evaluate(() => {
      window.__clip = null;
      navigator.clipboard.writeText = (t) => { window.__clip = t; return Promise.resolve(); };
    });
    await page.$eval('#copySel', e => e.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    await page.waitForTimeout(200);
    clipboard = await page.evaluate(() => (window.__clip || '(empty)'));
  } catch (e) { clipboard = 'ERR ' + e.message; }
  console.log('5) 复制已选 -> 行数:', String(clipboard).split('\n').length, '| 预览:', String(clipboard).slice(0, 70).replace(/\n/g, ' '));

  // 6) reload -> selection persists
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  const afterReload = await page.$$eval('.item.sel', els => els.length);
  console.log('6) 刷新后选中数 (应=3) =', afterReload);

  // 7) framework filter -> React
  await page.$eval('#fwChips .chip[data-fw="React"]', e => e.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await page.waitForTimeout(300);
  const reactN = await page.$$eval('.item', els => els.length);
  console.log('7) 框架筛选 React -> 显示', reactN, '张');
  await page.$eval('#fwChips .chip[data-fw=""]', e => e.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await page.waitForTimeout(200);

  // 8) kind filter -> 获奖项目
  await page.$eval('#kindSeg button[data-kind="proj"]', e => e.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await page.waitForTimeout(300);
  const projN = await page.$$eval('.item', els => els.length);
  console.log('8) 类型筛选 获奖项目 -> 显示', projN, '张');
  await page.$eval('#kindSeg button[data-kind="all"]', e => e.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await page.waitForTimeout(200);

  // 9) search removed per user request (browse-only) — verify no #q exists
  const hasSearch = await page.$('#q');
  console.log('9) 搜索框已移除（应为 null）=', hasSearch === null ? 'null ✅' : '仍存在 ⚠️');

  // 10) theme filter
  const themeName = await page.$$eval('#themeChips .chip[data-th]:not([data-th=""])', els => els[0] ? els[0].getAttribute('data-th') : null);
  if (themeName) {
    await page.$eval(`#themeChips .chip[data-th="${themeName}"]`, e => e.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    await page.waitForTimeout(300);
    const themeN = await page.$$eval('.item', els => els.length);
    console.log('10) 主题筛选 "' + themeName + '" -> 显示', themeN, '张');
    await page.$eval('#themeChips .chip[data-th=""]', e => e.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    await page.waitForTimeout(200);
  }

  // 11) clear selection
  await page.$eval('#clearSel', e => e.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await page.waitForTimeout(200);
  const afterClear = await page.$$eval('.item.sel', els => els.length);
  console.log('11) 清空后选中数 (应=0) =', afterClear);

  await page.screenshot({ path: 'test-functional-proof.png', fullPage: false });
  console.log('12) 截图已保存 test-functional-proof.png');
  // 12b) selection bar is a small bottom-right pill (not covering grid)
  await page.$eval('.item', e => e.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await page.waitForTimeout(200);
  const barBox = await page.$eval('#bar', el => { const r = el.getBoundingClientRect(); return { right: Math.round(r.right), bottom: Math.round(r.bottom), w: Math.round(r.width), vw: window.innerWidth }; });
  console.log('12b) 选中栏 right=' + barBox.right + ' (视口宽 ' + barBox.vw + ') w=' + barBox.w + ' -> 贴右下角且窄:', (barBox.right >= barBox.vw - 40 && barBox.w < barBox.vw * 0.6) ? '是 ✅' : '否 ⚠️');
  await page.$eval('#clearSel', e => e.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await page.waitForTimeout(150);

  console.log('13) 控制台错误数 =', errors.length, errors.slice(0, 3));

  await browser.close();
  const ok = total === 230 && broken.length === 0 && selectedCount === 3 && afterReload === 3 && afterClear === 0 && errors.length === 0;
  console.log('\n=== RESULT:', ok ? 'PASS ✅ 全部可用' : 'CHECK ⚠️', '===');
})();

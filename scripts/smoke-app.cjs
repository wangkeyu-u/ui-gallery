const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');
const { chromiumLaunchOptions } = require('./browser-launch.cjs');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const mime = {
  '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2',
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const requested = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
      const filePath = path.resolve(dist, requested);
      if (!filePath.startsWith(`${dist}${path.sep}`) && filePath !== path.join(dist, 'index.html')) {
        response.writeHead(403).end('forbidden');
        return;
      }
      fs.readFile(filePath, (error, data) => {
        if (error) {
          response.writeHead(404).end('not found');
          return;
        }
        response.writeHead(200, { 'Content-Type': mime[path.extname(filePath)] || 'application/octet-stream' });
        response.end(data);
      });
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function pageHealth(page) {
  return page.evaluate(() => ({
    brokenImages: [...document.images].filter(image => image.complete && image.naturalWidth === 0).map(image => image.getAttribute('src')),
    overflow: document.documentElement.scrollWidth - innerWidth,
  }));
}

async function main() {
  assert(fs.existsSync(path.join(dist, 'index.html')), 'dist 不存在，请先运行 npm run build');
  const server = await startServer();
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}/`;
  const browser = await chromium.launch(chromiumLaunchOptions());
  const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });
  const runtimeErrors = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') runtimeErrors.push(`${message.text()} @ ${message.location().url || page.url()}`);
  });

  try {
    await page.goto(base, { waitUntil: 'load' });
    await page.waitForSelector('.gallery-entry');
    let health = await pageHealth(page);
    assert(health.overflow === 0, `桌面首页横向溢出 ${health.overflow}px`);
    assert(health.brokenImages.length === 0, `桌面首页存在破图: ${health.brokenImages.join(', ')}`);
    assert(await page.locator('.gallery-entry').count() === 24, '首页首批卡片数量不是 24');

    const passedFilter = page.getByRole('button', { name: '已验证3', exact: true });
    assert(await passedFilter.count() === 1, '已验证筛选应显示 3 条通过演示');
    await passedFilter.click();
    await page.waitForFunction(() => document.querySelectorAll('.gallery-entry').length === 3);
    assert(await page.locator('.gallery-entry').count() === 3, '已验证筛选结果不是 3 条');

    await page.goto(base);
    const search = page.getByRole('searchbox', { name: '描述你想找的 UI' });
    await search.fill('金属 汽车');
    await page.getByRole('button', { name: '开始查找' }).click();
    await page.waitForFunction(() => location.hash.includes('q='));
    assert(page.url().includes('q='), '搜索没有写入 URL');
    assert(await page.locator('.gallery-entry').count() > 0, '搜索没有返回结果');

    await page.locator('button[aria-label^="放大预览"]').first().click();
    assert(await page.getByRole('dialog').count() === 1, '快速预览未打开');
    await page.getByRole('button', { name: '关闭预览' }).press('Escape');
    assert(await page.getByRole('dialog').count() === 0, 'Escape 未关闭快速预览');

    await page.goto(`${base}#/detail/demo-flat`);
    await page.waitForSelector('.repro-badge--passed');
    health = await pageHealth(page);
    assert(health.brokenImages.length === 0, '通过演示详情存在破图');
    assert(await page.getByRole('link', { name: '查看验证报告' }).count() === 1, '详情页缺少验证报告入口');

    await page.evaluate(() => { location.hash = '#/detail/not-a-real-id'; });
    await page.getByRole('heading', { name: '没有找到这个 UI' }).waitFor();
    assert(await page.getByRole('heading', { name: '没有找到这个 UI' }).count() === 1, 'SPA 切换到无效详情没有显示空状态');
    await page.evaluate(() => { location.hash = '#/detail/demo-dashboard'; });
    await page.locator('.repro-badge--passed').waitFor();

    for (const route of ['#/components', '#/themes', '#/detail/v4-openai']) {
      await page.goto(`${base}${route}`);
      health = await pageHealth(page);
      assert(health.overflow === 0, `${route} 桌面端横向溢出 ${health.overflow}px`);
      assert(health.brokenImages.length === 0, `${route} 存在破图`);
    }

    await page.setViewportSize({ width: 390, height: 844 });
    for (const route of ['', '#/components', '#/themes', '#/detail/v4-openai']) {
      await page.goto(`${base}${route}`);
      health = await pageHealth(page);
      assert(health.overflow === 0, `${route || '#/'} 移动端横向溢出 ${health.overflow}px`);
      assert(health.brokenImages.length === 0, `${route || '#/'} 移动端存在破图`);
    }

    assert(runtimeErrors.length === 0, `浏览器运行时错误:\n${runtimeErrors.join('\n')}`);
    console.log('浏览器冒烟通过：首页、搜索、筛选、预览、详情、空状态、组件、主题及 390px 响应式均正常。');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exit(1);
});

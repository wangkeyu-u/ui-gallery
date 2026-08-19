import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/?visual=1');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
});

test('renders the complete collection and filters by kind and framework', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'UI Gallery' })).toBeVisible();
  await expect(page.getByTestId('visible-count')).toHaveText('232');

  await page.getByRole('button', { name: '组件库', exact: true }).click();
  await expect(page.getByTestId('visible-count')).toHaveText('179');

  await page.getByLabel('框架').selectOption('React');
  const reactCount = await page.locator('option[value="React"]').textContent();
  const count = reactCount?.match(/\((\d+)\)/)?.[1];
  expect(count).toBeTruthy();
  await expect(page.getByTestId('visible-count')).toHaveText(count!);
});

test('persists selection and supports the selected-only view', async ({ page }) => {
  const card = page.locator('[data-id="antd"]');
  await card.click();
  await expect(card).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('已选项目操作')).toContainText('已选 1');
  await page.reload();
  await expect(page.locator('[data-id="antd"]')).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: '仅看已选' }).click();
  await expect(page.getByTestId('visible-count')).toHaveText('1');
  await expect(page.locator('[data-id="antd"]')).toBeVisible();
});

test('has no runtime errors or failed local assets', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.reload();
  await page.locator('.item').first().waitFor();
  expect(errors).toEqual([]);
});

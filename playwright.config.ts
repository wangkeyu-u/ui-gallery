import { defineConfig, devices } from '@playwright/test';

const localChrome = process.platform === 'darwin' && !process.env.CI ? { channel: 'chrome' as const } : {};

export default defineConfig({
  testDir: './tests',
  outputDir: 'test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    colorScheme: 'dark',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], ...localChrome, viewport: { width: 1280, height: 820 } }, testIgnore: /visual\.spec\.ts/ },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'], ...localChrome }, testIgnore: /visual\.spec\.ts/ },
    { name: 'visual-chromium', use: { ...devices['Desktop Chrome'], ...localChrome, viewport: { width: 1280, height: 820 }, deviceScaleFactor: 1 }, testMatch: /(?:visual|reconstruction)\.spec\.ts/ },
  ],
});

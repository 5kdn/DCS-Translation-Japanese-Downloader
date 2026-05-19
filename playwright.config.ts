import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const APP_URL = 'http://127.0.0.1:4173';
const PLAYWRIGHT_OUTPUT_DIR = join(tmpdir(), 'dcs-translation-japanese-downloader', 'playwright');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  outputDir: PLAYWRIGHT_OUTPUT_DIR,
  reporter: 'list',
  use: {
    baseURL: APP_URL,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  webServer: {
    command: 'pnpm exec vite --host 127.0.0.1 --port 4173',
    url: APP_URL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});

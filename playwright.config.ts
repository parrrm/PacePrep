import { defineConfig } from '@playwright/test';

const sites = process.env.PACEPREP_E2E_PLATFORM === 'sites';
const port = sites ? 8787 : 4173;
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  outputDir: `test-results/${sites ? 'sites' : 'vercel'}`,
  reporter: [
    ['list'],
    [
      'html',
      {
        open: 'never',
        outputFolder: `playwright-report/${sites ? 'sites' : 'vercel'}`,
      },
    ],
  ],
  use: {
    baseURL,
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    {
      name: 'phone',
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: sites
      ? 'pnpm exec wrangler dev --config dist/server/wrangler.json --port 8787 --ip localhost --local'
      : 'PACEPREP_PLATFORM=vercel NITRO_PRESET=vercel pnpm exec vite preview --host localhost --port 4173 --strictPort',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      NEXT_PUBLIC_CLOUD_AUTH_READY: 'false',
      WRANGLER_SEND_METRICS: 'false',
    },
  },
});

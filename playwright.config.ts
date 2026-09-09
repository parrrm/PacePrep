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
    {
      name: 'desktop',
      testIgnore: '**/d1.spec.ts',
      use: { viewport: { width: 1440, height: 1000 } },
    },
    {
      name: 'phone',
      testIgnore: '**/d1.spec.ts',
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    ...(sites ? [{ name: 'database', testMatch: '**/d1.spec.ts' }] : []),
  ],
  webServer: {
    command: sites
      ? 'node scripts/e2e-sites-server.mjs'
      : 'PACEPREP_PLATFORM=vercel NITRO_PRESET=vercel pnpm exec vite preview --host localhost --port 4173 --strictPort',
    url: baseURL,
    reuseExistingServer: false,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 10_000 },
    timeout: 60_000,
    env: {
      NEXT_PUBLIC_CLOUD_AUTH_READY: 'false',
      WRANGLER_SEND_METRICS: 'false',
    },
  },
});

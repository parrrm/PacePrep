// Run with Playwright installed, or set PACEPREP_PLAYWRIGHT_PATH to a bundled package.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { BASELINE_FACTS } from '../lib/baseline.ts';
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.PACEPREP_PLAYWRIGHT_PATH || 'playwright',
);
const origin = process.env.PACEPREP_TEST_URL || 'http://localhost:3000';
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PACEPREP_BROWSER
    ? { executablePath: process.env.PACEPREP_BROWSER }
    : {}),
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
await context.route('**/api/progress', (route) =>
  route.fulfill({
    status: 401,
    contentType: 'application/json',
    body: '{"authenticated":false}',
  }),
);
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('response', (response) => {
  if (response.status() >= 400 && !response.url().includes('/api/progress'))
    errors.push(`HTTP ${response.status()} ${response.url()}`);
});
try {
  await page.goto(origin);
  await page.waitForLoadState('networkidle');
  await page
    .getByRole('button', { name: 'Start my 60-second baseline' })
    .click();
  for (let i = 0; i < BASELINE_FACTS.length; i++) {
    await page
      .getByRole('heading', { name: `Fact ${i + 1} of 12`, exact: true })
      .waitFor();
    await page
      .locator('.baseline-options button')
      .nth(BASELINE_FACTS[i].choices.indexOf(BASELINE_FACTS[i].a))
      .click();
  }
  await page.getByRole('heading', { name: 'This is your baseline.' }).waitFor();
  assert.match(await page.locator('.baseline-results').innerText(), /100/);
  assert.equal(
    await page.evaluate(() => localStorage.getItem('paceprep-progress')),
    null,
    'Diagnostic must not persist before consent',
  );
  await page
    .getByRole('button', { name: 'Save my baseline & see my plan' })
    .click();
  await page.getByRole('checkbox').check();
  await page
    .getByRole('button', { name: 'Continue as guest', exact: true })
    .click();
  await page.locator('.dashboard-scoreboard').waitFor();
  await page.waitForFunction(
    () =>
      JSON.parse(localStorage.getItem('paceprep-progress') || '{}').history
        ?.length === 12,
  );
  await page.reload();
  await page.locator('.dashboard-scoreboard').waitFor();
  assert.equal(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('paceprep-progress')).history.length,
    ),
    12,
    'Baseline must not import twice',
  );
  assert.match(await page.locator('.weakest-callout').innerText(), /on track/);
  await page
    .getByRole('button', { name: 'Open learner profile and settings' })
    .click();
  await page.getByRole('dialog').waitFor();
  await page.keyboard.press('Tab');
  assert.equal(
    await page.evaluate(
      () => !!document.activeElement.closest('[role="dialog"]'),
    ),
    true,
    'Profile focus stays in dialog',
  );
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  await page.getByRole('link', { name: 'Fractions ↔ percentages', exact: true }).click();
  await page.getByRole('button', { name: /10-question benchmark/ }).click();
  await page.locator('.qcard').waitFor();
  await page.getByRole('button', { name: 'Type', exact: true }).click();
  await page.getByRole('textbox', { name: 'Your answer' }).fill('0');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await page.locator('.feedback.no').waitFor();
  await page.getByRole('button', { name: 'End session', exact: true }).click();
  await page.getByRole('button', { name: 'View detailed analysis' }).waitFor();
  assert.equal(await page.locator('#session-analysis').isVisible(), false);
  await page.getByRole('button', { name: 'View detailed analysis' }).click();
  assert.equal(await page.locator('.answer-review').isVisible(), true);
  await page.waitForTimeout(3400);
  assert.equal(
    await page.locator('.summary').isVisible(),
    true,
    'Auto-next must not leave ended session',
  );
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
    'Mobile report must not overflow',
  );
  await page.getByRole('button', { name: 'Back to dashboard' }).click();
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
    'Mobile hub must not overflow',
  );
  await page.getByRole('link', { name: 'Tables', exact: true }).click();
  await page.getByRole('button', { name: /Timed sprint/ }).click();
  await page.getByRole('textbox', { name: 'Your answer' }).fill('0');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await page.getByRole('button', { name: 'End session', exact: true }).click();
  assert.match(
    await page.locator('.sprint').innerText(),
    /1 answered in [\d.]+s/,
  );
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  await mobile.route('**/api/progress', (route) =>
    route.fulfill({ status: 401, body: '{}' }),
  );
  const phone = await mobile.newPage();
  await phone.goto(origin);
  await phone.waitForLoadState('networkidle');
  await phone
    .getByRole('button', { name: 'Start my 60-second baseline' })
    .waitFor();
  assert.equal(
    await phone
      .getByRole('button', { name: 'Sign in', exact: true })
      .isVisible(),
    false,
    'Unavailable cloud sign-in must be hidden on mobile',
  );
  assert.equal(
    await phone.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
    'Mobile landing must not overflow',
  );
  await phone.getByRole('link', { name: 'Install app', exact: true }).click();
  await phone
    .getByRole('heading', { name: 'One tap closer to your next drill.' })
    .waitFor();
  assert.equal(
    await phone.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
    'Install help must not overflow',
  );
  if (origin.includes('8787')) {
    await phone.evaluate(() => navigator.serviceWorker.ready);
    await phone.waitForFunction(() => !!navigator.serviceWorker.controller);
    const cdp = await mobile.newCDPSession(phone);
    const manifest = await cdp.send('Page.getAppManifest');
    assert.equal(
      manifest.errors.length,
      0,
      'Manifest must parse without browser errors',
    );
    await mobile.setOffline(true);
    await phone.goto(origin, { waitUntil: 'domcontentloaded' });
    await phone.getByRole('heading', { name: /A quick reconnect/ }).waitFor();
  }
  assert.deepEqual(errors, []);
  const account = await browser.newContext();
  const methods = [];
  const saved = { history: [{ ...BASELINE_FACTS[0], raw: '43.75%', correct: true, ms: 2000, at: Date.now(), answerMode: 'mcq' }], stats: {}, completedSessions: 1 };
  await account.route('**/api/progress', (route) => {
    methods.push(route.request().method());
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(route.request().method() === 'GET' ? { user: { userId: 'test-user', displayName: 'Test learner', email: 'test@example.invalid', fullName: null }, progress: saved } : { saved: true, deleted: true }) });
  });
  const signed = await account.newPage();
  await signed.goto(origin);
  await signed.locator('.dashboard-scoreboard').waitFor();
  await signed.getByRole('button', { name: 'Open learner profile and settings' }).click();
  await signed.getByRole('heading', { name: 'Test learner' }).waitFor();
  signed.once('dialog', (dialog) => dialog.accept());
  await signed.getByRole('button', { name: 'Delete progress', exact: true }).click();
  await signed.getByRole('dialog').waitFor({ state: 'hidden' });
  await signed.waitForTimeout(1000);
  assert.ok(methods.includes('DELETE'));
  assert.equal(methods.slice(methods.indexOf('DELETE') + 1).includes('PUT'), false, 'Autosave must not recreate a deleted progress record');
  await account.close();
  console.log(
    'PASS: live baseline, consent/save/deduplication, honest weak filtering, profile focus, category drill, feedback, summary disclosure, timer cleanup, mobile layout, install help, offline fallback, deletion/autosave safety.',
  );
  await mobile.close();
} catch (error) {
  console.error('Browser errors:', errors);
  console.error((await page.locator('body').innerText()).slice(0, 2200));
  console.error(
    await page.locator('.practiceHead').evaluateAll((nodes) =>
      nodes.map((node) => ({
        html: node.outerHTML,
        style: getComputedStyle(node).display,
        rect: node.getBoundingClientRect().toJSON(),
      })),
    ),
  );
  throw error;
} finally {
  await browser.close();
}

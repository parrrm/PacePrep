import { test as base, expect, type Page } from '@playwright/test';
import { BASELINE_FACTS } from '../../lib/baseline';

const sites = process.env.PACEPREP_E2E_PLATFORM === 'sites';
const test = base.extend<{ pageErrors: string[] }>({
  pageErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await use(errors);
      expect(errors, 'No uncaught browser errors').toEqual([]);
    },
    { auto: true },
  ],
});
const progress = (page: Page, key = 'paceprep-progress') =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '{}'), key);
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
async function enterGuest(page: Page, path = '/?practice=tables') {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.getByRole('checkbox').check();
  await page
    .getByRole('button', { name: 'Continue as guest', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Open learner profile and settings' }),
  ).toBeVisible();
}
async function tableDrill(page: Page) {
  await page.getByRole('button', { name: /FOUNDATION Direct recall/ }).click();
  await expect(page.locator('.qcard h1')).toBeVisible();
}

test('baseline consent, scoring, import and profile survive reload', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Start my 1-minute check', exact: true })
    .click();
  for (const [index, fact] of BASELINE_FACTS.entries()) {
    await expect(
      page.getByRole('heading', {
        name: `Fact ${index + 1} of 12`,
        exact: true,
      }),
    ).toBeVisible();
    await page
      .locator('.baseline-options button')
      .nth(fact.choices.indexOf(fact.a))
      .click();
  }
  await expect(
    page.getByRole('heading', { name: 'This is your baseline.', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.baseline-results')).toContainText('100');
  expect(
    await page.evaluate(() => localStorage.getItem('paceprep-progress')),
  ).toBeNull();
  await page
    .getByRole('button', { name: 'Save my baseline & see my plan' })
    .click();
  await expect(
    page.getByRole('button', { name: 'Continue as guest', exact: true }),
  ).toBeDisabled();
  await page.getByRole('checkbox').check();
  await page
    .getByRole('button', { name: 'Continue as guest', exact: true })
    .click();
  await expect
    .poll(async () => (await progress(page)).history?.length)
    .toBe(12);
  await page.reload();
  await expect(page.locator('.dashboard-scoreboard')).toBeVisible();
  expect((await progress(page)).history).toHaveLength(12);
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem('paceprep-pending-baseline'),
    ),
  ).toBeNull();
  await expect(page.locator('.weakest-callout')).toContainText('on track');
  await page
    .getByRole('button', { name: 'Open learner profile and settings' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Guest learner', exact: true }),
  ).toBeInViewport();
  await expect(
    page.getByRole('button', { name: 'Type', exact: true }),
  ).toBeInViewport();
  await page.keyboard.press('Tab');
  expect(
    await page.evaluate(
      () => !!document.activeElement?.closest('[role="dialog"]'),
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Type', exact: true }).click();
  await page
    .getByRole('button', { name: 'Save preferences', exact: true })
    .click();
  await page.reload();
  await page
    .getByRole('button', { name: 'Open learner profile and settings' })
    .click();
  await expect(
    page.getByRole('button', { name: 'Type', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await noOverflow(page);
});

test('hub category, incorrect answer and ended-session timer stay consistent', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/practice');
  await expect(page.locator('a button')).toHaveCount(0);
  await noOverflow(page);
  await page.getByRole('link', { name: /^Tables / }).click();
  await page.getByRole('checkbox').check();
  await page
    .getByRole('button', { name: 'Continue as guest', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Choose a tables drill' }),
  ).toBeVisible();
  await page.getByRole('button', { name: /10-question benchmark/ }).click();
  await page.getByRole('button', { name: 'Type', exact: true }).click();
  await page.getByRole('textbox', { name: 'Your answer' }).fill('0');
  await page.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(page.locator('.feedback.no')).toBeVisible();
  await page.getByRole('button', { name: 'End session', exact: true }).click();
  await expect(page.locator('#session-analysis')).toBeHidden();
  await page.getByRole('button', { name: 'View detailed analysis' }).click();
  await expect(page.locator('.answer-review')).toBeVisible();
  await page.clock.fastForward(4000);
  await expect(page.locator('.summary')).toBeVisible();
  expect((await progress(page)).history).toHaveLength(1);
  await noOverflow(page);
});

test('operations accepts numeric equivalents once and returns from results', async ({
  page,
}) => {
  await page.goto('/ops?family=addition');
  await page.getByRole('button', { name: /10-question drill/ }).click();
  const question = await page.locator('.qcard h1').innerText();
  expect(question).toMatch(/^\d+(\s*\+\s*\d+)+\s*=\s*\?$/);
  const answer = question
    .split('=')[0]
    .split('+')
    .reduce((sum, value) => sum + Number(value.trim()), 0);
  await page.getByRole('textbox', { name: 'Your answer' }).fill(`0${answer}.0`);
  // Dispatch twice in one event loop turn to exercise the synchronous lock.
  await page.locator('.qcard form').evaluate((form) => {
    form.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    form.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
  });
  await expect(page.locator('.feedback.yes')).toBeVisible();
  await page.getByRole('button', { name: 'End session', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Session review' }),
  ).toBeVisible();
  await expect(page.locator('main')).toContainText('1 answered');
  await expect(page.locator('main')).toContainText('100% accuracy');
  expect((await progress(page)).history).toHaveLength(1);
  await noOverflow(page);
  await page.getByRole('button', { name: 'Back to operations' }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Add, subtract, multiply, divide in your head',
    }),
  ).toBeVisible();
});

test('a no-answer operation sprint expires without inventing results', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/ops?family=division');
  await page.getByRole('button', { name: /Timed sprint/ }).click();
  await expect(
    page.getByRole('button', { name: 'Skip', exact: true }),
  ).toBeVisible();
  await page.clock.fastForward(60_001);
  await expect(
    page.getByRole('heading', { name: 'Session review' }),
  ).toBeVisible();
  await expect(page.locator('main')).toContainText('0 answered');
  await expect(page.locator('main')).toContainText(
    'No accuracy or pace measured',
  );
  expect((await progress(page)).completedSessions || 0).toBe(0);
  await noOverflow(page);
});

test('cross-tab reset stops stale recall and allows fresh saved practice', async ({
  page,
  context,
}) => {
  await enterGuest(page);
  const mirror = await context.newPage();
  await mirror.goto('/?grok-test=1');
  // Both tabs use the isolated QA key so this flow never needs a real account.
  await page.goto('/?grok-test=1&practice=tables');
  await tableDrill(page);
  await page.getByRole('button', { name: 'Type', exact: true }).click();
  await page.getByRole('textbox', { name: 'Your answer' }).fill('0');
  await page.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect
    .poll(
      async () => (await progress(page, 'paceprep-grok-test')).history?.length,
    )
    .toBe(1);
  await mirror
    .getByRole('button', { name: 'Open learner profile and settings' })
    .click();
  await expect(mirror.getByRole('dialog')).toContainText('1 answers');
  mirror.once('dialog', (dialog) => dialog.accept());
  await mirror
    .getByRole('button', { name: 'Delete progress', exact: true })
    .click();
  await expect(page.locator('.dashboard-scoreboard')).toBeVisible();
  expect((await progress(page, 'paceprep-grok-test')).history).toHaveLength(0);
  const resetAt = (await progress(page, 'paceprep-grok-test')).resetAt;
  expect(resetAt).toBeGreaterThan(0);
  await page
    .getByRole('button', { name: 'Start 2-minute practice', exact: true })
    .click();
  await page.getByRole('button', { name: 'Type', exact: true }).click();
  await page.getByRole('textbox', { name: 'Your answer' }).fill('0');
  await page.getByRole('button', { name: 'Check answer', exact: true }).click();
  await page.getByRole('button', { name: 'End session', exact: true }).click();
  await expect(page.locator('.summary')).toBeVisible();
  await mirror.reload();
  await expect(mirror.locator('.dashboard-scoreboard')).toBeVisible();
  const after = await progress(mirror, 'paceprep-grok-test');
  expect(after.history).toHaveLength(1);
  expect(after.resetAt).toBe(resetAt);
  await mirror.close();
});

test('public pages, manifest and production offline fallback', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Sign in', exact: true }),
  ).toBeVisible();
  await noOverflow(page);
  for (const path of [
    '/pricing',
    '/faq',
    '/privacy',
    '/terms',
    '/contact',
    '/install',
    '/signin',
  ]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
    await noOverflow(page);
  }
  await page.goto('/install');
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  const cdp = await context.newCDPSession(page);
  const manifest = await cdp.send('Page.getAppManifest');
  expect(manifest.errors).toEqual([]);
  await context.setOffline(true);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(
    page.getByRole('heading', { name: /A quick reconnect/ }),
  ).toBeVisible();
});

test('Sites mocked identity preserves reset revisions and saves after deletion', async ({
  page,
}) => {
  test.skip(
    !sites,
    'Sites identity transport only; this is not live Supabase authentication.',
  );
  let saved: Record<string, unknown> = {
    history: [
      {
        ...BASELINE_FACTS[0],
        raw: '43.75%',
        correct: true,
        ms: 2000,
        at: Date.now(),
        answerMode: 'mcq',
      },
    ],
    stats: {},
    completedSessions: 1,
  };
  let revision = '1';
  const methods: string[] = [];
  const user = {
    userId: 'test-user',
    displayName: 'Test learner',
    email: 'test@example.invalid',
    fullName: null,
  };
  await page.route('**/api/progress*', (route) => {
    const request = route.request();
    const method = request.method();
    methods.push(method);
    let body;
    if (method === 'GET')
      body = new URL(request.url()).searchParams.has('identity')
        ? { user }
        : { user, progress: saved, revision };
    else if (method === 'DELETE') {
      revision = String(Number(revision) + 1);
      saved = {
        resetAt: Date.now(),
        stats: {},
        history: [],
        completedSessions: 0,
      };
      body = { deleted: true, revision, resetAt: saved.resetAt };
    } else {
      expect(request.headers()['if-match']).toBe(revision);
      expect(request.headers()['x-paceprep-account']).toBe(user.userId);
      expect(request.postDataJSON().resetAt || 0).toBe(saved.resetAt || 0);
      revision = String(Number(revision) + 1);
      saved = request.postDataJSON();
      body = { saved: true, revision };
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Open learner profile and settings' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Test learner', exact: true }),
  ).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await page
    .getByRole('button', { name: 'Delete progress', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toBeHidden();
  expect(methods).toContain('DELETE');
  expect(saved.history).toEqual([]);
  await page
    .getByRole('button', { name: 'Start 2-minute practice', exact: true })
    .click();
  await page.getByRole('button', { name: 'Type', exact: true }).click();
  await page.getByRole('textbox', { name: 'Your answer' }).fill('0');
  await page.getByRole('button', { name: 'Check answer', exact: true }).click();
  await page.getByRole('button', { name: 'End session', exact: true }).click();
  await expect.poll(() => saved.history).toHaveLength(1);
  expect(methods.slice(methods.indexOf('DELETE') + 1)).toContain('PUT');
});

test('built API rejects anonymous and cross-origin progress mutations', async ({
  request,
}) => {
  const read = await request.get('/api/progress');
  expect(read.status()).toBe(401);
  expect(read.headers()['cache-control']).toContain('no-store');
  expect(await read.json()).not.toHaveProperty('progress');
  const write = await request.put('/api/progress', {
    headers: {
      origin: 'https://untrusted.example',
      'content-type': 'application/json',
      'if-match': 'absent',
    },
    data: { stats: {}, history: [] },
  });
  expect(write.status()).toBe(403);
  if (!sites) {
    const forged = await request.get('/api/progress', {
      headers: {
        'oai-authenticated-user-id': 'test-user',
        'x-paceprep-account': 'test-user',
      },
    });
    expect(forged.status()).toBe(401);
  }
});

test('skipped recall keeps its end-confirmation controls in the viewport', async ({
  page,
}) => {
  await enterGuest(page);
  await tableDrill(page);
  await page.getByRole('button', { name: /^Skip/ }).click();
  await page.getByRole('button', { name: 'End session', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'End anyway', exact: true }),
  ).toBeInViewport();
  await page.getByRole('button', { name: 'End anyway', exact: true }).click();
  await expect(page.locator('.summary')).toBeVisible();
});

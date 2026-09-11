import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const saved = (page: Page, key = 'paceprep-grok-test') =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '{}'), key);

test('unseen operations check defers coaching and preserves an exact retry', async ({
  page,
}) => {
  await page.goto('/ops?family=addition');
  await page.getByRole('button', { name: /Check my progress/ }).click();
  const question = await page.locator('.qcard h1').innerText();
  await page.getByRole('textbox', { name: 'Your answer' }).fill('0');
  await page.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(page.locator('.feedback')).toContainText('Answer recorded');
  await expect(page.locator('.feedback')).not.toContainText('correct answer');
  await page.getByRole('button', { name: 'End session', exact: true }).click();
  await expect(page.getByText(/Unseen-question check/)).toBeVisible();
  const first = (await saved(page, 'paceprep-progress')).history[0];
  expect(first.sessionId).toMatch(/^ops-benchmark-/);
  expect(Number(first.id.split('-').at(-1)) % 5).toBe(4);
  await page
    .getByRole('button', { name: 'Retry missed questions', exact: true })
    .click();
  await expect(page.locator('.qcard h1')).toHaveText(question);
  await page.getByRole('textbox', { name: 'Your answer' }).fill(first.a);
  await page.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(page.locator('.feedback')).toContainText(
    'What happened: Correct',
  );
  await page.getByRole('button', { name: 'View results', exact: true }).click();
  expect((await saved(page, 'paceprep-progress')).history).toHaveLength(2);
});

test('landing makes a two-minute exam-improvement loop immediately clear', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /Have a few minutes/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Start a 2-minute practice/ }),
  ).toBeVisible();
  await expect(page.locator('.landing-benefits')).toContainText(
    'Find avoidable mark-loss patterns',
  );
  await expect(page.locator('.landing-mini-loop b')).toHaveCount(4);
  await expect(page.locator('.landing-mini-loop')).toContainText('Practice');
  await expect(page.locator('.landing-mini-loop')).toContainText('Repeat');
  await page.getByRole('button', { name: /Start a 2-minute practice/ }).click();
  await page.getByRole('checkbox', { name: /I am 18/ }).check();
  await page.getByRole('button', { name: 'Continue as guest' }).click();
  await expect(page.locator('.practiceHead')).toContainText('Question 1 of 10');
});

test('untimed feedback stays until Continue and a one-fact retry stays focused', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/?grok-test=1&practice=tables');
  await page.getByRole('button', { name: /FOUNDATION Direct recall/ }).click();
  await page.getByRole('button', { name: 'Type', exact: true }).click();
  const question = await page.locator('.qcard h1').innerText();
  await page.getByRole('textbox', { name: 'Your answer' }).fill('0');
  await page.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(page.locator('.feedback.no')).toBeVisible();
  await expect(page.locator('.feedback.no')).toContainText('Why it matters');
  await expect(page.locator('.feedback.no')).toContainText('Next:');
  await page.clock.fastForward(15_000);
  await expect(page.locator('.feedback.no')).toBeVisible();
  await expect(page.locator('.qcard h1')).toHaveText(question);
  await page.getByRole('button', { name: 'End session', exact: true }).click();
  await expect(page.locator('.result-scan')).toContainText('STRENGTH');
  await expect(page.locator('.result-scan')).toContainText('MARK-LOSS PATTERN');
  await expect(page.locator('.result-scan')).toContainText('PROGRESS');
  await expect(page.locator('.result-action-plan')).toContainText(
    'WHAT HAPPENED',
  );
  await expect(page.locator('.result-action-plan')).toContainText(
    'WHY IT MATTERS',
  );
  await expect(page.locator('.result-action-plan')).toContainText(
    'WHAT TO DO NEXT',
  );
  await page.getByRole('button', { name: 'View detailed analysis' }).click();
  await page.getByRole('button', { name: 'Retry missed questions' }).click();
  await expect(page.locator('.practiceHead')).toContainText('Question 1 of 1');
  await expect(page.locator('.qcard h1')).toHaveText(question);
  const original = (await saved(page)).history[0];
  await page.getByRole('textbox', { name: 'Your answer' }).fill(original.a);
  await page.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(page.locator('.feedback.yes')).toBeVisible();
  await page.getByRole('button', { name: 'View session results' }).click();
  await expect(page.locator('.summary')).toBeVisible();
  const progress = await saved(page);
  expect(progress.history).toHaveLength(2);
  expect(
    new Set(progress.history.map((item: { id: string }) => item.id)).size,
  ).toBe(1);
  expect(progress.completedSessions).toBe(2);
});

test('ten skipped benchmark questions finish once and remain inside tables', async ({
  page,
}) => {
  await page.goto('/?grok-test=1&practice=tables');
  await page.getByRole('button', { name: /10-question benchmark/ }).click();
  for (let index = 0; index < 10; index++) {
    await expect(page.locator('.practiceHead')).toContainText(
      `Question ${index + 1} of 10`,
    );
    await page.getByRole('button', { name: /^Skip/ }).click();
  }
  await expect(page.locator('.summary')).toBeVisible();
  const progress = await saved(page);
  expect(progress.history).toHaveLength(10);
  expect(
    progress.history.every(
      (item: { topic: string; skipped: boolean }) =>
        item.topic === 'tables' && item.skipped,
    ),
  ).toBe(true);
  expect(
    new Set(progress.history.map((item: { id: string }) => item.id)).size,
  ).toBe(10);
  expect(progress.completedSessions).toBe(1);
});

test('operation retries contain only misses and complete after the target count', async ({
  page,
}) => {
  await page.goto('/ops?family=addition');
  await page.getByRole('button', { name: /10-question drill/ }).click();
  const question = await page.locator('.qcard h1').innerText();
  await page.getByRole('textbox', { name: 'Your answer' }).fill('0');
  await page.getByRole('button', { name: 'Check answer', exact: true }).click();
  await page.getByRole('button', { name: 'End session', exact: true }).click();
  await expect(page.locator('.operation-result-scan')).toContainText(
    'MARK-LOSS PATTERN',
  );
  await page.getByRole('button', { name: 'Retry missed questions' }).click();
  await expect(page.locator('.practiceHead')).toContainText('Question 1 of 1');
  await expect(page.locator('.qcard h1')).toHaveText(question);
  const original = (await saved(page, 'paceprep-progress')).history[0];
  await page.getByRole('textbox', { name: 'Your answer' }).fill(original.a);
  await page.getByRole('button', { name: 'Check answer', exact: true }).click();
  await page.getByRole('button', { name: 'View results', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Session review' }),
  ).toBeVisible();
  expect((await saved(page, 'paceprep-progress')).history).toHaveLength(2);
});

test('dashboard has a clear starting point with accessible light and dark themes', async ({
  page,
}) => {
  await page.goto('/?grok-test=1');
  await expect(
    page.getByRole('button', { name: 'Start 2-minute practice', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Recent learning progress' }),
  ).toContainText('—');
  for (const dark of [false, true]) {
    if (dark) await page.getByRole('button', { name: 'Use dark mode' }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const audit = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(audit.violations).toEqual([]);
  }
  await page
    .getByRole('button', { name: 'Start 2-minute practice', exact: true })
    .click();
  await expect(page.locator('.practiceHead')).toContainText('Question 1 of 10');
  await expect(
    page.getByRole('progressbar', { name: 'Session progress' }),
  ).toHaveAttribute('max', '10');
});

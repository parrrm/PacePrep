import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { OPERATION_FACTS } from '../lib/mental-ops.ts';
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.PACEPREP_PLAYWRIGHT_PATH || 'playwright',
);
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PACEPREP_BROWSER
    ? { executablePath: process.env.PACEPREP_BROWSER }
    : {}),
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
const page = await context.newPage();
const origin = process.env.PACEPREP_TEST_URL || 'http://localhost:3000';
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await context.route('**/api/progress', (r) =>
  r.fulfill({
    status: 401,
    contentType: 'application/json',
    body: '{"authenticated":false}',
  }),
);
async function hub() {
  await page.goto(`${origin}/practice`);
  await page.getByRole('heading', { name: 'Practice', exact: true }).waitFor();
  await page.waitForLoadState('networkidle');
}
try {
  await hub();
  assert.equal(
    await page.locator('a button').count(),
    0,
    'Cards must not nest interactive elements',
  );
  for (const [name, family] of [
    ['Fractions ↔ percentages', 'fractions'],
    ['Tables', 'tables'],
    ['Squares', 'squares'],
    ['Cubes', 'cubes'],
    ['Consecutive products', 'consecutive'],
  ]) {
    await page.getByRole('link', { name, exact: true }).click();
    await page.getByRole('heading', { name: /Choose a .* drill/ }).waitFor();
    assert.equal(new URL(page.url()).searchParams.get('practice'), family);
    assert.equal(
      await page.getByRole('combobox', { name: 'Practice topic' }).inputValue(),
      family,
    );
    await page.reload();
    await page.getByRole('heading', { name: /Choose a .* drill/ }).waitFor();
    await hub();
  }
  for (const name of [
    'Addition',
    'Subtraction',
    'Multiplication',
    'Division',
  ]) {
    await page
      .getByRole('link', { name: `${name} mental operations`, exact: true })
      .click();
    await page
      .getByRole('heading', { name: `${name} in your head`, exact: true })
      .waitFor();
    assert.equal(
      new URL(page.url()).searchParams.get('family'),
      name.toLowerCase(),
    );
    await page.reload();
    await page
      .getByRole('heading', { name: `${name} in your head`, exact: true })
      .waitFor();
    await page
      .getByRole('link', { name: 'Practice home', exact: true })
      .click();
  }
  console.log('Nine family routes and reloads passed');
  await page.getByRole('button', { name: 'Use dark theme' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Use light theme' }).waitFor();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
    'Mobile hub must not overflow',
  );
  await page.getByRole('button', { name: 'Use light theme' }).click();

  console.log('Theme persistence passed');
  // A selected recall family's fixed-length benchmark must stay in that family.
  await page.getByRole('link', { name: 'Squares', exact: true }).click();
  await page.getByRole('button', { name: /10-question benchmark/ }).click();
  await page.getByRole('button', { name: 'Type', exact: true }).click();
  for (let i = 0; i < 10; i++) {
    await page.locator('.qcard h1').waitFor();
    const q = await page.locator('.qcard h1').innerText();
    const direct = q.match(/^(\d+)² = \?$/);
    const reverse = q.match(/^\?² = (\d+)$/);
    assert.ok(direct || reverse, `Square-only session showed ${q}`);
    const answer = direct
      ? Number(direct[1]) ** 2
      : Math.sqrt(Number(reverse[1]));
    await page
      .getByRole('textbox', { name: 'Your answer' })
      .fill(String(i === 0 ? -1 : answer));
    await page.getByRole('textbox', { name: 'Your answer' }).press('Enter');
    await page.locator('.feedback b').waitFor();
    if (i === 0)
      assert.match(
        await page.locator('.feedback').innerText(),
        /Correct answer/,
      );
    await page
      .getByRole('button', { name: 'Continue to next question' })
      .click();
  }
  await page.locator('.summary').waitFor();
  console.log('Recall session passed');
  const recallSaved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('paceprep-progress')),
  );
  assert.equal(recallSaved.history.length, 10);
  assert.equal(recallSaved.completedSessions, 1);
  assert.ok(Object.values(recallSaved.stats).every((s) => s.dueAt > 0));

  await hub();
  await page.getByRole('link', { name: 'Addition mental operations' }).click();
  await page.getByRole('button', { name: /10-question drill/ }).click();
  await page.getByRole('textbox', { name: 'Your answer' }).waitFor();
  await page.waitForFunction(
    () => document.activeElement?.getAttribute('aria-label') === 'Your answer',
  );
  for (let i = 0; i < 10; i++) {
    const q = await page.locator('.qcard h1').innerText();
    const item = OPERATION_FACTS.find(
      (f) => f.q === q && f.topic === 'addition',
    );
    assert.ok(item, q);
    if (i === 0) {
      const keypad = page.getByRole('button', { name: '1', exact: true });
      const box = await keypad.boundingBox();
      assert.ok(
        box.width >= 44 && box.height >= 44,
        'Thumb targets must be at least 44px',
      );
      await keypad.click();
      let warned = false;
      page.once('dialog', async (d) => {
        warned = d.type() === 'beforeunload';
        await d.dismiss();
      });
      await page.reload({ timeout: 3000 }).catch(() => {});
      assert.ok(warned, 'Active operation session must warn before reload');
    }
    await page.getByRole('textbox', { name: 'Your answer' }).fill(item.a);
    await page.getByRole('textbox', { name: 'Your answer' }).press('Enter');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
  }
  await page
    .getByRole('heading', { name: 'Session review', exact: true })
    .waitFor();
  console.log('Operation session passed');
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('paceprep-progress')),
  );
  assert.equal(saved.history.length, 20);
  assert.equal(saved.completedSessions, 2);
  const operationIds = saved.history
    .filter((h) => h.topic === 'addition')
    .map((h) => h.id);
  assert.ok(operationIds.every((id) => saved.stats[id].dueAt > 0));
  await hub();
  await page.getByRole('link', { name: 'Open mixed / due reviews' }).click();
  await page
    .getByRole('button', { name: 'Start mixed review', exact: true })
    .click();
  const topics = new Set();
  for (let i = 0; i < 9; i++) {
    await page.locator('.quizline > small').waitFor();
    topics.add(await page.locator('.quizline > small').innerText());
    await page.getByRole('button', { name: /^Skip/ }).click();
  }
  assert.equal(
    topics.size,
    9,
    'Mixed review must include all five recall and four operation families',
  );
  await page.getByRole('button', { name: 'End session', exact: true }).click();
  await page.getByRole('button', { name: 'End anyway', exact: true }).click();
  await page.locator('.summary').waitFor();
  await hub();
  await page.reload();
  assert.ok(
    (await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('paceprep-progress')).history.length,
    )) >= 20,
  );
  assert.doesNotMatch(
    await page.locator('body').innerText(),
    /Velocity 10|Sign in|Pricing|free forever/i,
  );
  assert.deepEqual(errors, []);
  console.log(
    'Phase 1 browser QA passed: nine family links, refresh/back entry, both themes, mobile cards/keypad, guest recall + operation sessions, persistence, and mixed-family review.',
  );
} finally {
  await browser.close();
}

import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';

async function audit(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .options({ rules: { 'label-content-name-mismatch': { enabled: true } } })
    .analyze();
  expect(results.violations).toEqual([]);
}

test('public routes satisfy automated WCAG A/AA checks', async ({ page }) => {
  test.setTimeout(120_000);
  for (const path of [
    '/',
    '/practice',
    '/ops',
    '/pricing',
    '/faq',
    '/privacy',
    '/terms',
    '/contact',
    '/install',
    '/signin',
  ]) {
    await test.step(path, async () => {
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();
      await audit(page);
    });
  }
});

test('recall, settings, feedback and results satisfy automated WCAG checks', async ({
  page,
}) => {
  await page.goto('/?practice=tables');
  await page.getByRole('checkbox').check();
  await page
    .getByRole('button', { name: 'Continue as guest', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Open learner profile and settings' })
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await audit(page);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /FOUNDATION Direct recall/ }).click();
  await page.getByRole('button', { name: 'Type', exact: true }).click();
  await audit(page);
  await page.getByRole('textbox', { name: 'Your answer' }).fill('0');
  await page.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(page.locator('.feedback.no')).toBeVisible();
  await audit(page);
  await page.getByRole('button', { name: 'End session', exact: true }).click();
  await expect(page.locator('.summary')).toBeVisible();
  await audit(page);
});

test('operation input and empty results satisfy automated WCAG checks', async ({
  page,
}) => {
  await page.goto('/ops?family=addition');
  await page.getByRole('button', { name: /10-question drill/ }).click();
  await expect(
    page.getByRole('textbox', { name: 'Your answer' }),
  ).toBeVisible();
  await audit(page);
  await page.getByRole('button', { name: 'End session', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Session review' }),
  ).toBeVisible();
  await audit(page);
});

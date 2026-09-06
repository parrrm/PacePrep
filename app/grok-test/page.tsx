import type { Metadata } from 'next';
import { InfoShell } from '@/app/info-shell';
import { SiteLink as Link } from '@/app/site-link';

export const metadata: Metadata = {
  title: 'Grok testing guide',
  robots: { index: false, follow: true },
};

const checks = [
  'Open the public home page. Confirm the page loads without login, CAPTCHA, or a permission prompt.',
  'Run the 12-question baseline. Check correct and incorrect feedback, the 60-second limit, results, the 18+ agreement, and guest continuation.',
  'Open the isolated trainer below. Test Home, Practice, Progress, learner settings, dark mode, and mobile navigation.',
  'In Practice, open Fractions, Tables, Squares & cubes, and Percentages. Test direct recall, reverse recall, timed sprint, focused drill, mixed review, and the 10-question benchmark.',
  'Expand More session formats. Test Learn, Weak areas, Random practice, and the 10-, 25-, and 50-question tests. For longer formats, a short representative run plus End session is enough.',
  'During a drill, test multiple choice and typed input, Check answer, skip, review skipped questions, keyboard focus, answer feedback, and End session.',
  'On the summary, expand detailed analysis, retry a missed fact, return to the dashboard, and confirm Progress reflects completed attempts.',
  'Open learner settings. Test appearance, input preference, export, import with a prior test export when available, dialog keyboard handling, and test-data deletion.',
  'Visit About, Pricing, FAQ, Install app, Privacy, Terms, and Contact. Check links, headings, and narrow-screen layout.',
  'Report every issue with the URL, viewport, exact action, expected result, actual result, and visible error. Do not infer success from page source alone.',
];

export default function GrokTestPage() {
  return (
    <InfoShell
      eyebrow="TEMPORARY AUTOMATED-USER ACCESS"
      title="Grok testing guide"
      intro="Use the links and checklist below to test PacePrep as an ordinary external user. This guide and isolated entry will be removed after the review."
    >
      <section className="info-notice">
        <h2>Testing boundaries</h2>
        <p>
          Test the guest experience only. Do not enter personal information or
          create an account. Cloud sign-in is not part of this deployment. The
          isolated trainer uses a separate browser record and cannot overwrite
          ordinary PacePrep guest progress.
        </p>
      </section>
      <section>
        <h2>Entry points</h2>
        <p>
          <Link href="/">Start with the public landing page and baseline</Link>
        </p>
        <p>
          <Link href="/?grok-test=1">
            Open the isolated trainer for feature testing
          </Link>
        </p>
      </section>
      <section>
        <h2>Complete test checklist</h2>
        <ol>
          {checks.map((check) => (
            <li key={check}>{check}</li>
          ))}
        </ol>
      </section>
      <section>
        <h2>Expected limits</h2>
        <p>
          The Sign in page should explain that cloud accounts are unavailable.
          Browser installation may require human control in the test
          environment. An unauthenticated progress API response is expected and
          must not interrupt guest practice.
        </p>
      </section>
    </InfoShell>
  );
}

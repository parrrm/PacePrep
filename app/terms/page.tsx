import type { Metadata } from 'next';
import { InfoShell } from '@/app/info-shell';

export const metadata: Metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  return (
    <InfoShell
      eyebrow="TERMS"
      title="Public beta terms"
      intro="These plain-language terms describe PacePrep Team’s free public beta for adult learners."
    >
      <section>
        <h2>Eligibility</h2>
        <p>
          You must be at least 18 years old to use PacePrep. By continuing, you
          confirm that you meet this requirement.
        </p>
      </section>
      <section>
        <h2>Educational scope</h2>
        <p>
          PacePrep provides practice and progress information, not tutoring,
          financial advice, official exam content, or a guarantee of selection,
          score improvement, or exam results.
        </p>
      </section>
      <section>
        <h2>Acceptable use</h2>
        <p>
          Do not attempt to disrupt the service, access another learner&apos;s
          record, automate excessive requests, reverse engineer authentication,
          or use the product unlawfully.
        </p>
      </section>
      <section>
        <h2>Availability and changes</h2>
        <p>
          The beta may change or pause, and device-local progress can be lost if
          browser storage is cleared. We will disclose pricing and updated
          policies before enabling any payment.
        </p>
      </section>
      <section>
        <h2>No monetary stakes</h2>
        <p>
          Focus tokens, streaks, badges, and challenges have no cash value and
          cannot be purchased, redeemed, won, or withdrawn as money.
        </p>
      </section>
      <section className="info-notice">
        <h2>Support and beta limits</h2>
        <p>
          Visit <a href="/contact">Contact PacePrep Team</a> for public bug
          reports and feature suggestions. Cloud accounts and payments are not
          part of this Vercel beta. Legal operator details, private support and
          final policies remain required for a broader account-enabled launch.
        </p>
      </section>
    </InfoShell>
  );
}

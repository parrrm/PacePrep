import type { Metadata } from 'next';
import { InfoShell } from '@/app/info-shell';

export const metadata: Metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  return (
    <InfoShell
      eyebrow="TERMS"
      title="Testing-preview terms"
      intro="These plain-language terms cover the current PacePrep preview. Final operator identity and governing-law details are required before production launch."
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
          The preview may change, pause, or lose data while testing. We will
          disclose production pricing and final policies before enabling payment
          or presenting the service as generally available.
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
        <h2>Pre-launch requirement</h2>
        <p>
          Final terms require the operator&apos;s legal name, address/state,
          grievance channel, and approved governing-law and dispute language.
        </p>
      </section>
    </InfoShell>
  );
}

import type { Metadata } from 'next';
import { InfoShell } from '@/app/info-shell';

export const metadata: Metadata = { title: 'Contact' };

export default function ContactPage() {
  return (
    <InfoShell
      eyebrow="CONTACT"
      title="Contact PacePrep Team"
      intro="Found a confusing question or something that does not work? Help us improve PacePrep’s free public beta."
    >
      <section className="info-notice">
        <h2>Report a problem or suggest an improvement</h2>
        <p>
          <a href="https://github.com/parrrm/PacePrep/issues">
            Open the PacePrep support tracker
          </a>
          . A GitHub account is needed to post. Include the question, expected
          answer, device and what happened. Reports are public: do not include
          passwords, email addresses or private learner information.
        </p>
      </section>
      <section>
        <h2>Your practice data</h2>
        <p>
          Guest progress stays on your device. Open the profile panel and select
          “Delete progress,” or clear this site&apos;s data in your browser.
          Cloud accounts are not enabled for this Vercel beta.
        </p>
      </section>
      <section>
        <h2>Private enquiries</h2>
        <p>
          A private support mailbox has not been established yet. Please do not
          post private enquiries in the public tracker. PacePrep Team is the
          project’s public-facing name, not a registered-business claim.
        </p>
      </section>
    </InfoShell>
  );
}

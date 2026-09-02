import type { Metadata } from 'next';
import { InfoShell } from '@/app/info-shell';

export const metadata: Metadata = { title: 'Contact' };

export default function ContactPage() {
  return (
    <InfoShell
      eyebrow="CONTACT"
      title="Support channel pending launch details"
      intro="A working domain-based support and grievance address is required before PacePrep moves from testing preview to production."
    >
      <section className="info-notice">
        <h2>Product-owner action required</h2>
        <p>
          Provide the owned PacePrep domain and monitored support/grievance
          email. It will be published here, in the footer, sign-in notice,
          Privacy Policy, and Terms of Service.
        </p>
      </section>
      <section>
        <h2>Account deletion</h2>
        <p>
          Signed-in learners can already delete their progress without
          contacting support: open the profile panel and select “Delete
          progress.” Guest learners can clear this site&apos;s local data in
          their browser.
        </p>
      </section>
    </InfoShell>
  );
}

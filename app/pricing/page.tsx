import type { Metadata } from 'next';
import { InfoShell } from '@/app/info-shell';

export const metadata: Metadata = { title: 'Pricing' };

export default function PricingPage() {
  return (
    <InfoShell
      eyebrow="PRICING"
      title="Free public beta"
      intro="Practise for free. No payment details, advertising or real-money rewards."
    >
      <section>
        <h2>Included today</h2>
        <ul>
          <li>All current fact banks and practice modes</li>
          <li>Guest practice stored on one device</li>
          <li>Cloud sync is not enabled in the Vercel beta</li>
          <li>Fact-level mastery, reviews, and session comparisons</li>
        </ul>
      </section>
      <section className="info-notice">
        <h2>No payment required</h2>
        <p>
          All currently available practice is free. If paid features are added
          later, their price and scope will be published before any purchase.
        </p>
      </section>
    </InfoShell>
  );
}

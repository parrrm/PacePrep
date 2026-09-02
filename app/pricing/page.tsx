import type { Metadata } from 'next';
import { InfoShell } from '@/app/info-shell';

export const metadata: Metadata = { title: 'Pricing' };

export default function PricingPage() {
  return (
    <InfoShell
      eyebrow="PRICING"
      title="Free during the testing preview"
      intro="There is no paid tier, payment collection, advertising, or real-money reward mechanic in the current PacePrep preview."
    >
      <section>
        <h2>Included today</h2>
        <ul>
          <li>All current fact banks and practice modes</li>
          <li>Guest practice stored on one device</li>
          <li>Signed-in progress sync</li>
          <li>Fact-level mastery, reviews, and session comparisons</li>
        </ul>
      </section>
      <section className="info-notice">
        <h2>Production pricing is not yet set</h2>
        <p>
          We will publish a clear free-versus-paid feature table before any
          production launch or billing. No current feature should be described
          as “free forever” until that commitment is approved by the product
          owner.
        </p>
      </section>
    </InfoShell>
  );
}

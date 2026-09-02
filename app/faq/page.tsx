import type { Metadata } from 'next';
import { InfoShell } from '@/app/info-shell';

export const metadata: Metadata = { title: 'Mental Math FAQ' };

export default function FaqPage() {
  return (
    <InfoShell
      eyebrow="FAQ"
      title="Mental-math recall for banking exams"
      intro="Short answers to the questions candidates ask before adding a recall trainer to their SBI PO or IBPS PO routine."
    >
      <section>
        <h2>How does spaced repetition help with DI and approximation?</h2>
        <p>
          It does not solve the set for you. It reduces the time spent
          reconstructing common facts, leaving more working memory for the
          actual comparison and reasoning.
        </p>
      </section>
      <section>
        <h2>Should I memorise fraction-percentage pairs or calculate them?</h2>
        <p>
          Understand the conversion once, then train important exam pairs until
          they are automatic. PacePrep tests both directions because recognition
          and reconstruction are separate recall skills.
        </p>
      </section>
      <section>
        <h2>Why are recurring percentages shown as 16.66% or 33.33%?</h2>
        <p>
          The practice bank uses the conventional memorised banking-exam form
          without rounding up. Terminating values such as 12.5% and 43.75%
          remain exact.
        </p>
      </section>
      <section>
        <h2>Does guest practice survive sign-in?</h2>
        <p>
          Yes. Device history is merged with the signed-in record and duplicate
          attempts are removed.
        </p>
      </section>
    </InfoShell>
  );
}

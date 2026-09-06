import type { Metadata } from 'next';
import { InfoShell } from '@/app/info-shell';

export const metadata: Metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <InfoShell
      eyebrow="ABOUT"
      title="Automatic arithmetic for high-pressure exams"
      intro="PacePrep is a focused recall engine for the foundational calculations that slow candidates down inside banking and SSC quantitative-aptitude questions."
    >
      <section>
        <h2>What PacePrep trains</h2>
        <p>
          Recall facts: fractions and percentages, tables, squares, cubes, and
          consecutive products—directly and in reverse. Every direction is
          tracked as a separate fact.
        </p>
        <p>
          Mental operations: addition, subtraction, multiplication, and
          division done in your head, without pen or paper. Those trainers
          open one family at a time from the practice hub.
        </p>
      </section>
      <section>
        <h2>What it is not</h2>
        <p>
          PacePrep is not a complete quant syllabus, coaching programme,
          mock-test platform, or guarantee of an exam result. Use it alongside
          full-topic learning and timed mocks.
        </p>
      </section>
      <section>
        <h2>The PacePrep Recall Loop</h2>
        <p>
          Our Leitner-style scheduler prioritises facts that are inaccurate,
          slow, due, or repeatedly confused. Consistently accurate facts receive
          longer review intervals; a lapse brings them back sooner.
        </p>
      </section>
    </InfoShell>
  );
}

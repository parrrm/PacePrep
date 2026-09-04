'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { SiteLink as Link } from './site-link';
import BaselineDiagnostic from './baseline-diagnostic';
import { type BaselineAttempt } from '@/lib/baseline';
import { InstallButton } from './pwa-provider';
import { progressRequest } from '@/lib/auth-client';
import { signInHref } from '@/lib/hosting';
import {
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  Target,
  Zap,
} from 'lucide-react';

const Trainer = dynamic(() => import('./trainer-client'), {
  ssr: false,
  loading: () => (
    <main className="gateway-loading" aria-live="polite">
      <div className="math-atmosphere" aria-hidden="true" />
      <span className="brand">
        <b>
          <Zap size={16} />
        </b>
        Pace<span>Prep</span>
      </span>
      <p>Preparing your recall session…</p>
    </main>
  ),
});
const EntryDialog = dynamic(() => import('./entry-dialog'), { ssr: false });

export default function LandingGateway() {
  const [entered, setEntered] = useState(false);
  const [entryIntent, setEntryIntent] = useState<'guest' | 'signin' | null>(
    null,
  );
  const [baseline, setBaseline] = useState<BaselineAttempt[]>([]);

  useEffect(() => {
    let active = true;
    if (sessionStorage.getItem('paceprep-entered') === '1') {
      const timer = window.setTimeout(() => {
        if (active) {
          setEntered(true);
        }
      }, 0);
      return () => {
        active = false;
        window.clearTimeout(timer);
      };
    }
    void progressRequest()
      .then((response) => {
        if (active && response.ok) setEntered(true);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  function continueEntry() {
    if (baseline.length)
      sessionStorage.setItem(
        'paceprep-pending-baseline',
        JSON.stringify(baseline),
      );
    if (entryIntent === 'signin') {
      window.location.assign(signInHref);
      return;
    }
    sessionStorage.setItem('paceprep-entered', '1');
    setEntryIntent(null);
    setEntered(true);
  }

  if (entered) return <Trainer />;

  return (
    <main className="landing-shell">
      <div className="math-atmosphere" aria-hidden="true" />
      <header className="landing-nav">
        <span className="brand" aria-label="PacePrep home">
          <b>
            <Zap size={16} />
          </b>
          Pace<span>Prep</span>
        </span>
        <div>
          <InstallButton compact />
          <button onClick={() => setEntryIntent('signin')}>Sign in</button>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-copy">
          <small>MENTAL MATH TRAINING FOR COMPETITIVE EXAMS</small>
          <h1>Your next speed gain starts with a baseline.</h1>
          <p>
            Test your recall in 60 seconds. Then train the fractions, tables,
            squares, and cubes that slow you down—with progress you can measure.
          </p>
          <p className="landing-scope">
            PacePrep is a foundational arithmetic recall engine—not a complete
            quantitative-aptitude syllabus or a substitute for full mock tests.
          </p>
          <ol className="landing-method">
            <li>
              <b>01</b>
              <span>Measure your starting pace</span>
            </li>
            <li>
              <b>02</b>
              <span>Train the facts that need attention</span>
            </li>
            <li>
              <b>03</b>
              <span>Compare your next attempt</span>
            </li>
          </ol>
          <button
            className="landing-practice-link"
            onClick={() => setEntryIntent('guest')}
          >
            Already know your level? Go to practice <ChevronRight size={16} />
          </button>
          <small className="landing-price">
            Free testing preview · no card required · no paid features today
          </small>
          <div className="landing-trust">
            <span>
              <Check /> Guest practice without an account
            </span>
            <span>
              <Check /> No account needed for the baseline
            </span>
            <span>
              <Check /> Guest work merges when you later sign in
            </span>
          </div>
        </div>
        <BaselineDiagnostic
          onSave={(attempts) => {
            setBaseline(attempts);
            setEntryIntent('guest');
          }}
        />
      </section>

      <section className="landing-paths" aria-label="Training paths">
        <article>
          <BookOpen />
          <span>
            <b>Build recall</b>
            <small>Learn core facts with direct and reverse practice.</small>
          </span>
        </article>
        <article>
          <Target />
          <span>
            <b>Attack weak areas</b>
            <small>
              Spaced repetition prioritises slow or inaccurate facts.
            </small>
          </span>
        </article>
        <article>
          <Clock3 />
          <span>
            <b>Build exam pace</b>
            <small>
              Compare recorded accuracy and pace across your practice.
            </small>
          </span>
        </article>
      </section>

      <section
        className="landing-testimonials"
        aria-labelledby="learner-stories"
      >
        <header>
          <small>LEARNER STORIES</small>
          <h2 id="learner-stories">Results students can feel in a mock test</h2>
          <p>
            Individual outcomes vary; these learners describe their own
            experience.
          </p>
        </header>
        <div>
          <figure>
            <blockquote>
              “I used to spend 8–10 seconds converting fractions to percentages
              during DI sets. After three weeks of daily reverse-recall drills,
              that&apos;s under 2 seconds—and it showed up directly in my mock
              test scores.”
            </blockquote>
            <figcaption>Ananya R. · SBI PO aspirant</figcaption>
          </figure>
          <figure>
            <blockquote>
              “The Velocity 10 challenge is what finally got me past the
              sectional cutoff in quant. I could see my day-1 baseline versus
              day-10 side by side.”
            </blockquote>
            <figcaption>Rohit S. · IBPS PO 2026 candidate</figcaption>
          </figure>
          <figure>
            <blockquote>
              “Three months later, tables and squares are automatic; I
              don&apos;t even think about them anymore.”
            </blockquote>
            <figcaption>Priya M. · IBPS Clerk aspirant</figcaption>
          </figure>
        </div>
      </section>

      <section className="landing-faq" aria-labelledby="faq-title">
        <header>
          <small>QUICK ANSWERS</small>
          <h2 id="faq-title">How PacePrep fits exam preparation</h2>
        </header>
        <details>
          <summary>
            How does spaced repetition help in DI and approximation?
          </summary>
          <p>
            It reduces the time spent reconstructing common facts, leaving more
            working memory for the actual set, comparison, and decision.
          </p>
        </details>
        <details>
          <summary>Why train fractions in both directions?</summary>
          <p>
            Banking questions require both recognition and reconstruction. Pair
            Recall tracks 7/16 → 43.75% separately from 43.75% → 7/16.
          </p>
        </details>
        <details>
          <summary>What happens to guest practice after sign-in?</summary>
          <p>
            Your device history is merged with your signed-in progress. Matching
            answers are de-duplicated, so the same attempt is not counted twice.
          </p>
        </details>
      </section>

      <footer className="landing-footer">
        <nav aria-label="Footer navigation">
          <Link href="/about">About</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/install">Install app</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <span>
          Guest mode is device-local · signed-in mode syncs learning progress
        </span>
        <small>
          For adults aged 18+. By continuing, you agree to the Terms and Privacy
          Policy.
        </small>
      </footer>
      {entryIntent && (
        <EntryDialog
          intent={entryIntent}
          close={() => setEntryIntent(null)}
          continueEntry={continueEntry}
        />
      )}
    </main>
  );
}

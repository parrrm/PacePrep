'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  Target,
  User,
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

export default function LandingGateway() {
  const [entered, setEntered] = useState(false);
  const [eligible, setEligible] = useState(false);

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
    void fetch('/api/progress', { cache: 'no-store' })
      .then((response) => {
        if (active && response.ok) setEntered(true);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  function enterGuest() {
    sessionStorage.setItem('paceprep-entered', '1');
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
          <button onClick={enterGuest} disabled={!eligible}>
            Try a drill
          </button>
          {eligible ? (
            <Link href="/signin-with-chatgpt?return_to=/" target="_top">
              Sign in
            </Link>
          ) : (
            <button disabled>Sign in</button>
          )}
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-copy">
          <small>MENTAL MATH TRAINING FOR COMPETITIVE EXAMS</small>
          <h1>Turn calculation into instant recall.</h1>
          <p>
            Train the exact fractions, tables, squares, cubes, and mental
            patterns that decide speed in SBI PO and IBPS PO quantitative
            aptitude.
          </p>
          <p className="landing-scope">
            PacePrep is a foundational arithmetic recall engine—not a complete
            quantitative-aptitude syllabus or a substitute for full mock tests.
          </p>
          <div className="landing-actions">
            <button onClick={enterGuest} disabled={!eligible}>
              Start a guest drill <ChevronRight />
            </button>
            {eligible ? (
              <Link href="/signin-with-chatgpt?return_to=/" target="_top">
                <User /> Sign in to sync progress
              </Link>
            ) : (
              <button disabled>
                <User /> Sign in to sync progress
              </button>
            )}
          </div>
          <label className="age-confirm">
            <input
              type="checkbox"
              checked={eligible}
              onChange={(event) => setEligible(event.target.checked)}
            />
            <span>
              I confirm I am 18+ and agree to the{' '}
              <Link href="/terms">Terms</Link> and{' '}
              <Link href="/privacy">Privacy Policy</Link>.
            </span>
          </label>
          <small className="landing-price">
            Free testing preview · no card required · no paid features today
          </small>
          <div className="landing-trust">
            <span>
              <Check /> No password handled by PacePrep
            </span>
            <span>
              <Check /> Guest practice stays on this device
            </span>
            <span>
              <Check /> Guest work merges when you later sign in
            </span>
          </div>
        </div>
        <aside
          className="landing-preview"
          aria-label="PacePrep training preview"
        >
          <small>EXAMPLE PROGRESS VIEW</small>
          <div className="preview-question">
            <b>7/16</b>
            <span>→</span>
            <strong>43.75%</strong>
          </div>
          <p>Accuracy first. Then faster recall, measured answer by answer.</p>
          <div className="preview-metrics">
            <span>
              <small>ACCURACY</small>
              <b>91%</b>
            </span>
            <span>
              <small>AVG. TIME</small>
              <b>2.4s</b>
            </span>
            <span>
              <small>IMPROVEMENT</small>
              <b>−1.1s</b>
            </span>
          </div>
          <em>
            Illustrative example. Your dashboard uses only your recorded
            practice results.
          </em>
        </aside>
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
              Use Velocity 10 to compare your baseline with day ten.
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
    </main>
  );
}

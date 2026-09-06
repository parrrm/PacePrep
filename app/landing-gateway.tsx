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
  const [grokTest, setGrokTest] = useState(false);
  const [entryIntent, setEntryIntent] = useState<'guest' | 'signin' | null>(
    null,
  );
  const [baseline, setBaseline] = useState<BaselineAttempt[]>([]);

  useEffect(() => {
    let active = true;
    if (new URLSearchParams(window.location.search).get('grok-test') === '1') {
      const timer = window.setTimeout(() => {
        if (active) {
          setGrokTest(true);
          setEntered(true);
        }
      }, 0);
      return () => {
        active = false;
        window.clearTimeout(timer);
      };
    }
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

  if (entered) return <Trainer grokTest={grokTest} />;

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
            Test your recall in 60 seconds. Then train the facts and in-head
            operations that slow you down—with progress you can measure.
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
          <p>
            <Link href="/ops">Or open mental + − × ÷ drills →</Link>
          </p>
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
        <a href="/ops" className="landing-path-link">
          <article>
            <Target />
            <span>
              <b>Train operations</b>
              <small>
                Addition, subtraction, multiplication, and division without paper.
              </small>
            </span>
          </article>
        </a>
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

      <footer className="landing-footer">
        <nav aria-label="Footer navigation">
          <Link href="/about">About</Link>
          <Link href="/ops">Operations</Link>
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

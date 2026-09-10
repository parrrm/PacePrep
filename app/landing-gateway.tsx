'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { SiteLink as Link } from './site-link';
import BaselineDiagnostic from './baseline-diagnostic';
import { type BaselineAttempt } from '@/lib/baseline';
import { InstallButton } from './pwa-provider';
import { getProgressAccount } from '@/lib/auth-client';
import { signInHref } from '@/lib/hosting';
import {
  BarChart3,
  Check,
  ChevronRight,
  Clock3,
  ShieldCheck,
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
    if (new URLSearchParams(window.location.search).has('practice')) {
      const timer = window.setTimeout(() => {
        if (active) setEntryIntent('guest');
      }, 0);
      return () => {
        active = false;
        window.clearTimeout(timer);
      };
    }
    void getProgressAccount()
      .then((accountId) => {
        if (active && accountId) setEntered(true);
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
        <span className="brand">
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
          <small>MENTAL MATH TRAINING FOR BANKING EXAMS</small>
          <h1>Find where you lose marks. Train it until it feels automatic.</h1>
          <p>
            PacePrep measures the arithmetic recall behind SBI PO and IBPS PO
            questions, finds the facts slowing you down, and gives you the
            shortest useful practice set to fix them.
          </p>
          <div className="hero-outcome">
            <ShieldCheck aria-hidden="true" />
            <span>
              <b>Protect accuracy. Recover time. Know what to practise next.</b>
              <small>
                Each session turns mistakes into a focused follow-up plan.
              </small>
            </span>
          </div>
          <p className="landing-scope">
            Use it between mock tests to strengthen foundational arithmetic
            recall. PacePrep complements a full quantitative-aptitude syllabus.
          </p>
          <ol className="landing-method">
            <li>
              <b>01</b>
              <span>Find the facts costing time or accuracy</span>
            </li>
            <li>
              <b>02</b>
              <span>Retry only what needs attention</span>
            </li>
            <li>
              <b>03</b>
              <span>Prove the gain in your next attempt</span>
            </li>
          </ol>
          <button
            className="landing-practice-link"
            onClick={() => setEntryIntent('guest')}
          >
            Skip the baseline and start practice <ChevronRight size={16} />
          </button>
          <p>
            <Link href="/practice">Open the practice hub</Link>
            {' · '}
            <Link href="/ops">Mental + − × ÷ drills</Link>
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
              <Check /> Guest progress stays on this device
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

      <section className="landing-outcomes" aria-labelledby="outcomes-title">
        <header>
          <small>WHY REGULAR PRACTICE PAYS OFF</small>
          <h2 id="outcomes-title">
            Turn mental maths into dependable exam time
          </h2>
          <p>
            A short session gives you evidence, a focused correction, and a
            clear reason to return.
          </p>
        </header>
        <div>
          <article>
            <ShieldCheck aria-hidden="true" />
            <span>
              <b>Lose fewer marks to avoidable errors</b>
              <small>
                See incorrect and skipped patterns before they repeat in a timed
                paper.
              </small>
            </span>
          </article>
          <article>
            <Clock3 aria-hidden="true" />
            <span>
              <b>Keep more time for reasoning</b>
              <small>
                Faster recall means less working time spent reconstructing basic
                arithmetic.
              </small>
            </span>
          </article>
          <article>
            <BarChart3 aria-hidden="true" />
            <span>
              <b>Know whether practice is working</b>
              <small>
                Compare matching attempts and separate real improvement from a
                one-off fast score.
              </small>
            </span>
          </article>
        </div>
      </section>

      <section className="landing-loop" aria-labelledby="loop-title">
        <div>
          <small>YOUR IMPROVEMENT LOOP</small>
          <h2 id="loop-title">Every attempt ends with a next move</h2>
          <p>
            You never have to decide what a score means on your own. PacePrep
            turns each result into the next focused action.
          </p>
          <Link href="/practice">
            Explore practice options <ChevronRight size={17} />
          </Link>
        </div>
        <ol>
          <li>
            <b>1</b>
            <span>
              Attempt<small>Answer a short, focused set</small>
            </span>
          </li>
          <li>
            <b>2</b>
            <span>
              Analyse<small>See accuracy, pace, and skips</small>
            </span>
          </li>
          <li>
            <b>3</b>
            <span>
              Identify<small>Find the pattern costing marks</small>
            </span>
          </li>
          <li>
            <b>4</b>
            <span>
              Act<small>Retry the exact weak questions</small>
            </span>
          </li>
          <li>
            <b>5</b>
            <span>
              Improve<small>Compare, retain, and repeat</small>
            </span>
          </li>
        </ol>
      </section>

      <footer className="landing-footer">
        <nav aria-label="Footer navigation">
          <Link href="/about">About</Link>
          <Link href="/practice">Practice</Link>
          <Link href="/ops">Operations</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/install">Install app</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <span>
          Guest mode is device-local · cloud sync depends on account
          availability
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

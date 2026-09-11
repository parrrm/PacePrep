'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { SiteLink as Link } from './site-link';
import BaselineDiagnostic from './baseline-diagnostic';
import { type BaselineAttempt } from '@/lib/baseline';
import { InstallButton } from './pwa-provider';
import { getProgressAccount } from '@/lib/auth-client';
import { signInHref } from '@/lib/hosting';
import { Check, ChevronRight, Clock3, Zap } from 'lucide-react';

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
  const [quickStart, setQuickStart] = useState(false);
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
    if (quickStart) sessionStorage.setItem('paceprep-quick-start', '1');
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
          <h1>Have a few minutes? Turn them into exam improvement.</h1>
          <p>
            Practise 10 mental-maths questions. PacePrep finds the facts costing
            you marks or time and gives you one clear next action.
          </p>
          <button
            className="landing-primary-action"
            onClick={() => {
              setQuickStart(true);
              setEntryIntent('guest');
            }}
          >
            <Clock3 size={18} aria-hidden="true" /> Start a 2-minute practice
            <ChevronRight size={17} aria-hidden="true" />
          </button>
          <small className="landing-action-note">
            10 questions · immediate analysis · no account needed
          </small>
          <div className="landing-benefits" aria-label="What you gain">
            <span>
              <Check aria-hidden="true" /> Find avoidable mark-loss patterns
            </span>
            <span>
              <Check aria-hidden="true" /> Build faster, more reliable recall
            </span>
            <span>
              <Check aria-hidden="true" /> Know exactly what to practise next
            </span>
          </div>
          <div className="landing-mini-loop" aria-label="Improvement loop">
            <b>Practice</b>
            <ChevronRight aria-hidden="true" />
            <b>Analyse</b>
            <ChevronRight aria-hidden="true" />
            <b>Improve</b>
            <ChevronRight aria-hidden="true" />
            <b>Repeat</b>
          </div>
          <Link className="landing-secondary-link" href="/practice">
            Choose a topic instead <ChevronRight size={16} />
          </Link>
        </div>
        <BaselineDiagnostic
          onSave={(attempts) => {
            setBaseline(attempts);
            setQuickStart(false);
            setEntryIntent('guest');
          }}
        />
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
          close={() => {
            setEntryIntent(null);
            setQuickStart(false);
          }}
          continueEntry={continueEntry}
        />
      )}
    </main>
  );
}

'use client';

import { useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronRight,
  Clock3,
  Divide,
  Minus,
  Play,
  Plus,
  RotateCcw,
  Target,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SiteLink as Link } from '@/app/site-link';
import {
  OPERATION_FAMILIES,
  PRACTICE_HUB_COPY,
  type OperationFamilyId,
} from '@/lib/practice-families';
import { operationsByTopic, type OpFact } from '@/lib/mental-ops';
import {
  completeOperationSession,
  recordOperationAttempt,
} from '@/lib/ops-progress';

type Try = {
  id: string;
  q: string;
  a: string;
  raw: string;
  correct: boolean;
  skipped?: boolean;
  ms: number;
  strategy: string;
};

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const ICONS = {
  addition: Plus,
  subtraction: Minus,
  multiplication: X,
  division: Divide,
} as const;

export default function OpsPage() {
  const [family, setFamily] = useState<OperationFamilyId | null>(null);
  const [limit, setLimit] = useState(10);
  const [sprint, setSprint] = useState(false);
  const [deck, setDeck] = useState<OpFact[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<Try | null>(null);
  const [log, setLog] = useState<Try[]>([]);
  const [left, setLeft] = useState<number | null>(null);
  const started = useRef(0);
  const field = useRef<HTMLInputElement>(null);
  const timer = useRef<number | null>(null);
  const sessionId = useRef('');
  const counted = useRef(false);

  const fact = deck[index];
  const done = (!fact && log.length > 0) || (sprint && left === 0 && log.length > 0);

  function begin(next: OperationFamilyId, mode: 'ten' | 'sprint') {
    const pool = shuffle(operationsByTopic(next));
    const nextDeck = mode === 'sprint' ? pool : pool.slice(0, 10);
    if (timer.current) window.clearInterval(timer.current);
    sessionId.current = `ops-${Date.now()}`;
    counted.current = false;
    setFamily(next);
    setSprint(mode === 'sprint');
    setLimit(mode === 'sprint' ? 0 : 10);
    setDeck(nextDeck);
    setIndex(0);
    setAnswer('');
    setResult(null);
    setLog([]);
    setLeft(mode === 'sprint' ? 60 : null);
    started.current = performance.now();
    window.setTimeout(() => field.current?.focus(), 30);
    if (mode === 'sprint') {
      timer.current = window.setInterval(() => {
        setLeft((value) => {
          if (value === null) return value;
          if (value <= 1) {
            if (timer.current) window.clearInterval(timer.current);
            setDeck([]);
            return 0;
          }
          return value - 1;
        });
      }, 1000);
    }
  }

  function finishItem(partial: Omit<Try, 'ms'> & { ms?: number }) {
    const item: Try = {
      ...partial,
      ms: partial.ms ?? performance.now() - started.current,
    };
    if (family) {
      recordOperationAttempt({
        id: item.id,
        topic: family,
        q: item.q,
        a: item.a,
        raw: item.raw,
        correct: item.correct,
        skipped: item.skipped,
        ms: item.ms,
        sessionId: sessionId.current,
      });
    }
    setLog((current) => [...current, item]);
    setResult(item);
  }

  function markSessionComplete() {
    if (counted.current || !log.length) return;
    counted.current = true;
    completeOperationSession();
  }

  function submit() {
    if (!fact || result) return;
    const raw = answer.trim();
    if (!raw) return;
    finishItem({
      id: fact.id,
      q: fact.q,
      a: fact.a,
      raw,
      correct: raw === fact.a,
      strategy: fact.strategy,
    });
  }

  function skip() {
    if (!fact || result) return;
    finishItem({
      id: fact.id,
      q: fact.q,
      a: fact.a,
      raw: '',
      correct: false,
      skipped: true,
      strategy: fact.strategy,
    });
  }

  function goNext() {
    setAnswer('');
    setResult(null);
    started.current = performance.now();
    setIndex((value) => value + 1);
    window.setTimeout(() => field.current?.focus(), 20);
  }

  const scored = log.filter((item) => !item.skipped);
  const accuracy = scored.length
    ? Math.round((scored.filter((item) => item.correct).length / scored.length) * 100)
    : 0;
  const average =
    scored.length > 0
      ? scored.reduce((sum, item) => sum + item.ms, 0) / scored.length / 1000
      : 0;
  const weak = useMemo(
    () =>
      log
        .filter((item) => !item.correct)
        .slice()
        .sort((a, b) => b.ms - a.ms)
        .slice(0, 3),
    [log],
  );

  if (done || (sprint && left === 0 && log.length)) {
    if (timer.current) window.clearInterval(timer.current);
    markSessionComplete();
    return (
      <main className="page practice-hub">
        <div className="masteryTitle">
          <span>
            <small>MENTAL OPERATIONS</small>
            <h1>Session review</h1>
            <p>
              {scored.length} answered · {accuracy}% accuracy · {average.toFixed(1)}s
              average
            </p>
          </span>
        </div>
        <section className="panel operation-empty">
          <b>Keep the facts that slowed you down.</b>
          <p>Accuracy before speed. Replay the weak items without paper.</p>
          {weak.length ? (
            <ul>
              {weak.map((item) => (
                <li key={item.id}>
                  {item.q} {item.a} — {item.strategy}
                </li>
              ))}
            </ul>
          ) : (
            <p>No misses. Move to another operation or a mixed recall set.</p>
          )}
          <div>
            <Button onClick={() => family && begin(family, 'ten')}>Drill again</Button>
            <Button variant="outline" onClick={() => setFamily(null)}>
              Back to operations
            </Button>
            <Link href="/">Home</Link>
          </div>
        </section>
      </main>
    );
  }

  if (!family) {
    return (
      <main className="page practice-hub practice-hub-v4">
        <div className="masteryTitle">
          <span>
            <small>{PRACTICE_HUB_COPY.opsEyebrow}</small>
            <h1>{PRACTICE_HUB_COPY.opsTitle}</h1>
            <p>{PRACTICE_HUB_COPY.opsIntro}</p>
          </span>
        </div>
        <section className="domain-grid" aria-label="Mental operation categories">
          {(Object.keys(OPERATION_FAMILIES) as OperationFamilyId[]).map((key) => {
            const meta = OPERATION_FAMILIES[key];
            const Icon = ICONS[key];
            return (
              <button key={key} onClick={() => setFamily(key)} aria-label={meta.title}>
                <header>
                  <i className={meta.color}>
                    <Icon />
                  </i>
                  <em>OPEN</em>
                </header>
                <span>
                  <b>{meta.title}</b>
                  <small>{meta.copy}</small>
                </span>
                <footer>
                  <span>
                    <small>BANK</small>
                    <strong>{operationsByTopic(key).length} facts</strong>
                  </span>
                  <ChevronRight />
                </footer>
              </button>
            );
          })}
        </section>
        <p>
          <Link href="/">← Back to PacePrep home</Link>
        </p>
      </main>
    );
  }

  const meta = OPERATION_FAMILIES[family];
  if (!deck.length || (fact === undefined && !log.length)) {
    return (
      <main className="page practice-hub category-page">
        <nav className="practice-breadcrumb" aria-label="Breadcrumb">
          <button onClick={() => setFamily(null)}>Operations</button>
          <ChevronRight />
          <span aria-current="page">{meta.title}</span>
        </nav>
        <div className="masteryTitle">
          <span>
            <small>{meta.title.toUpperCase()}</small>
            <h1>{meta.title} in your head</h1>
            <p>{meta.copy} Type the answer. No pen, no paper.</p>
          </span>
        </div>
        <section className="category-mode-grid" aria-label="Session formats">
          <button onClick={() => begin(family, 'ten')}>
            <i className={meta.color}>
              <Play />
            </i>
            <span>
              <small>NO PAPER</small>
              <b>10-question drill</b>
              <em>Strategy appears after you check the answer.</em>
            </span>
            <ChevronRight />
          </button>
          <button onClick={() => begin(family, 'sprint')}>
            <i className={meta.color}>
              <Clock3 />
            </i>
            <span>
              <small>60 SECONDS</small>
              <b>Timed sprint</b>
              <em>Session clock only. Keep the work in your head.</em>
            </span>
            <ChevronRight />
          </button>
        </section>
      </main>
    );
  }

  return (
    <div className="practicePage">
      <header className="practiceHead">
        <Link href="/" className="brand">
          <b>
            <Zap />
          </b>
          Pace<span>Prep</span>
        </Link>
        <span>
          Question {index + 1}
          {limit ? ` of ${limit}` : ''}
        </span>
        <div>
          {left !== null && (
            <b>
              {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
            </b>
          )}
          <Button variant="outline" onClick={() => setDeck([])}>
            End session
          </Button>
        </div>
      </header>
      <section className="quiz">
        <div className="quizline">
          <small>{meta.title}</small>
          <b className="session-score">
            <Check size={15} /> {log.filter((item) => item.correct).length} correct
          </b>
          <span>
            <Target size={14} /> Type
          </span>
        </div>
        <div
          className={`qcard ${result ? (result.correct ? 'answer-correct' : 'answer-review-needed') : ''}`}
        >
          <small>MENTAL OPERATION</small>
          <h1>{fact.q}</h1>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <input
              ref={field}
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Type your answer"
              aria-label="Your answer"
              inputMode="numeric"
              autoComplete="off"
              disabled={!!result}
              maxLength={12}
            />
            <Button type="submit" disabled={!!result || !answer.trim()}>
              Check answer
            </Button>
            <div className="fraction-keypad" aria-label="Number keypad">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((key) => (
                <button
                  type="button"
                  key={key}
                  disabled={!!result}
                  onClick={() => setAnswer(answer + key)}
                >
                  {key}
                </button>
              ))}
              <button type="button" disabled={!!result} onClick={() => setAnswer(answer.slice(0, -1))}>
                ⌫
              </button>
            </div>
          </form>
          <output
            className={`feedback ${result ? (result.correct ? 'yes' : 'no') : ''}`}
            aria-live="polite"
          >
            {result && (
              <>
                <i>{result.correct ? <Check /> : <RotateCcw />}</i>
                <span>
                  <b>
                    {result.correct ? 'Correct. ' : 'Lock this in. '}
                    {result.strategy} — {(result.ms / 1000).toFixed(2)} sec
                  </b>
                  {!result.correct && !result.skipped && (
                    <small>Correct answer: {result.a}</small>
                  )}
                </span>
                <button type="button" onClick={goNext}>
                  Next
                </button>
              </>
            )}
          </output>
        </div>
        <p>
          <button type="button" onClick={skip} disabled={!!result}>
            Skip
          </button>
        </p>
      </section>
    </div>
  );
}

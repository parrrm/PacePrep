'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  openOperationProgress,
  type OperationProgress,
} from '@/lib/ops-progress';

import { answersMatch } from '@/lib/recall-math';

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
  const sessionId = useRef('');
  const counted = useRef(false);
  const locked = useRef(false);
  const deadline = useRef(0);
  const attemptCount = useRef(0);
  const progress = useRef<OperationProgress | null>(null);
  const [stage, setStage] = useState<'choose' | 'running' | 'done'>('choose');
  const [loading, setLoading] = useState(true);
  const [canStart, setCanStart] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let active = true;
    const category = new URLSearchParams(window.location.search).get('family');

    void openOperationProgress()
      .then((account) => {
        if (!active) return;
        progress.current = account;
        if (category && Object.hasOwn(OPERATION_FAMILIES, category))
          setFamily(category as OperationFamilyId);
        setCanStart(true);
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setSaveError(
            'Your saved progress could not be loaded. Reload to retry before starting a drill.',
          );
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const finish = useCallback(() => {
    locked.current = true;
    setStage('done');
    if (counted.current || !attemptCount.current || !progress.current) return;
    counted.current = true;
    try {
      completeOperationSession(progress.current);
      void progress.current
        .flush()
        .catch(() =>
          setSaveError(
            'Cloud sync could not finish. Your answers are saved on this device. Reopen your dashboard when connected to retry.',
          ),
        );
    } catch {
      setSaveError(
        'Progress could not be saved. Keep this session open to review your answers.',
      );
    }
  }, []);

  useEffect(() => {
    if (stage !== 'running' || !sprint) return;
    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((deadline.current - performance.now()) / 1000),
      );
      setLeft(remaining);
      if (!remaining) finish();
    };
    const timer = window.setInterval(tick, 200);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [stage, sprint, finish]);

  useEffect(() => {
    if (stage === 'running' && !result) field.current?.focus();
  }, [stage, index, result]);

  const fact = deck[index];

  function begin(next: OperationFamilyId, mode: 'ten' | 'sprint') {
    if (!progress.current) return;
    try {
      sessionStorage.setItem('paceprep-entered', '1');
    } catch {
      /* Practice can continue with its loaded storage. */
    }
    const pool = shuffle(operationsByTopic(next));
    sessionId.current = `ops-${crypto.randomUUID()}`;
    counted.current = false;
    locked.current = false;
    attemptCount.current = 0;
    setFamily(next);
    setSprint(mode === 'sprint');
    setLimit(mode === 'sprint' ? 0 : 10);
    setDeck(mode === 'sprint' ? pool : pool.slice(0, 10));
    setIndex(0);
    setAnswer('');
    setResult(null);
    setLog([]);
    setLeft(mode === 'sprint' ? 60 : null);
    started.current = performance.now();
    deadline.current = started.current + 60_000;
    setStage('running');
  }

  function finishItem(raw: string, skipped = false) {
    if (stage !== 'running' || !fact || locked.current || !progress.current)
      return;
    if (sprint && performance.now() >= deadline.current) return finish();
    locked.current = true;
    const item: Try = {
      id: fact.id,
      q: fact.q,
      a: fact.a,
      strategy: fact.strategy,
      raw,
      skipped,
      correct: !skipped && answersMatch(raw, fact.a),
      ms: Math.max(100, performance.now() - started.current),
    };
    attemptCount.current++;
    setLog((current) => [...current, item]);
    setResult(item);
    try {
      recordOperationAttempt(
        { ...item, topic: family!, sessionId: sessionId.current },
        progress.current,
      );
    } catch {
      setSaveError(
        'This answer could not be saved. Your session review is still available below.',
      );
    }
  }

  function submit() {
    const raw = answer.trim();
    if (raw) finishItem(raw);
  }

  function skip() {
    finishItem('', true);
  }

  function goNext() {
    if (stage !== 'running' || !result || !locked.current) return;
    if (
      index + 1 >= deck.length ||
      (sprint && performance.now() >= deadline.current)
    )
      return finish();
    locked.current = false;
    setAnswer('');
    setResult(null);
    started.current = performance.now();
    setIndex((value) => value + 1);
  }

  const status = loading ? (
    <output>Loading your progress…</output>
  ) : saveError ? (
    <p role="alert" className="operation-save-error">
      {saveError}
    </p>
  ) : null;

  const scored = log.filter((item) => !item.skipped);
  const accuracy = scored.length
    ? Math.round(
        (scored.filter((item) => item.correct).length / scored.length) * 100,
      )
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

  if (stage === 'done') {
    return (
      <main className="page practice-hub">
        <div className="masteryTitle">
          <span>
            <small>MENTAL OPERATIONS</small>
            <h1>Session review</h1>
            <p>
              {scored.length} answered ·{' '}
              {scored.length
                ? `${accuracy}% accuracy · ${average.toFixed(1)}s average`
                : 'No accuracy or pace measured'}
            </p>
          </span>
        </div>
        {status}
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
            <p>
              {log.length
                ? 'No misses. Move to another operation or a mixed recall set.'
                : 'No answers recorded. Try an untimed drill to get started.'}
            </p>
          )}
          <div>
            <Button onClick={() => family && begin(family, 'ten')}>
              Drill again
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setFamily(null);
                setStage('choose');
              }}
            >
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
        {status}
        <section
          className="domain-grid"
          aria-label="Mental operation categories"
        >
          {(Object.keys(OPERATION_FAMILIES) as OperationFamilyId[]).map(
            (key) => {
              const meta = OPERATION_FAMILIES[key];
              const Icon = ICONS[key];
              return (
                <button key={key} onClick={() => setFamily(key)}>
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
            },
          )}
        </section>
        <p>
          <Link href="/">← Back to PacePrep home</Link>
        </p>
      </main>
    );
  }

  const meta = OPERATION_FAMILIES[family];
  if (stage === 'choose') {
    return (
      <main className="page practice-hub category-page">
        <nav className="practice-breadcrumb" aria-label="Breadcrumb">
          <button
            onClick={() => {
              setFamily(null);
              setStage('choose');
            }}
          >
            Operations
          </button>
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
        {status}
        <section className="category-mode-grid" aria-label="Session formats">
          <button
            disabled={loading || !canStart}
            onClick={() => begin(family, 'ten')}
          >
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
          <button
            disabled={loading || !canStart}
            onClick={() => begin(family, 'sprint')}
          >
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
    <main className="practicePage">
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
          <Button variant="outline" onClick={finish}>
            End session
          </Button>
        </div>
      </header>
      {status}
      <section className="quiz">
        <div className="quizline">
          <small>{meta.title}</small>
          <b className="session-score">
            <Check size={15} /> {log.filter((item) => item.correct).length}{' '}
            correct
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
            <div className="fraction-keypad">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((key) => (
                <button
                  type="button"
                  key={key}
                  disabled={!!result}
                  onClick={() =>
                    setAnswer((value) => (value + key).slice(0, 12))
                  }
                >
                  {key}
                </button>
              ))}
              <button
                type="button"
                aria-label="Delete last digit"
                disabled={!!result}
                onClick={() => setAnswer((value) => value.slice(0, -1))}
              >
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
                  {!result.correct && <small>Correct answer: {result.a}</small>}
                </span>
                <button type="button" onClick={goNext}>
                  Next
                </button>
              </>
            )}
          </output>
        </div>
        <div className="quiz-actions">
          <button type="button" onClick={skip} disabled={!!result}>
            Skip
          </button>
        </div>
      </section>
    </main>
  );
}

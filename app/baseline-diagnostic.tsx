'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Clock3, RotateCcw, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BASELINE_FACTS, type BaselineAttempt } from '@/lib/baseline';
import { answersMatch } from '@/lib/recall-math';

export default function BaselineDiagnostic({
  onSave,
}: {
  onSave: (attempts: BaselineAttempt[]) => void;
}) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setHydrated(true), 0);
    return () => clearTimeout(timer);
  }, []);
  const [stage, setStage] = useState<'ready' | 'running' | 'done'>('ready');
  const [index, setIndex] = useState(0);
  const [left, setLeft] = useState(60);
  const [attempts, setAttempts] = useState<BaselineAttempt[]>([]);
  const [feedback, setFeedback] = useState<BaselineAttempt | null>(null);
  const deadline = useRef(0);
  const started = useRef(0);
  const locked = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fact = BASELINE_FACTS[index];
  const answered = attempts.filter((attempt) => !attempt.skipped);
  const correct = answered.filter((attempt) => attempt.correct).length;
  const average = answered.length
    ? answered.reduce((sum, attempt) => sum + attempt.ms, 0) /
      answered.length /
      1000
    : 0;

  useEffect(() => {
    if (stage !== 'running') return;
    const timer = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((deadline.current - performance.now()) / 1000),
      );
      setLeft(remaining);
      if (!remaining) {
        locked.current = true;
        if (advanceTimer.current) clearTimeout(advanceTimer.current);
        setStage('done');
      }
    }, 200);
    return () => clearInterval(timer);
  }, [stage]);
  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    },
    [],
  );

  function begin() {
    setAttempts([]);
    setIndex(0);
    setLeft(60);
    setFeedback(null);
    deadline.current = performance.now() + 60_000;
    started.current = performance.now();
    locked.current = false;
    setStage('running');
  }
  function answer(raw: string, skipped = false) {
    if (stage !== 'running' || locked.current) return;
    if (performance.now() >= deadline.current) return setStage('done');
    locked.current = true;
    const attempt: BaselineAttempt = {
      id: fact.id,
      topic: fact.topic,
      q: fact.q,
      a: fact.a,
      answerMode: 'mcq',
      raw,
      skipped,
      correct: !skipped && answersMatch(raw, fact.a),
      ms: Math.max(100, performance.now() - started.current),
      at: Date.now(),
    };
    setAttempts((items) => [...items, attempt]);
    setFeedback(attempt);
    advanceTimer.current = setTimeout(
      () => {
        if (
          index === BASELINE_FACTS.length - 1 ||
          performance.now() >= deadline.current
        )
          setStage('done');
        else {
          setIndex(index + 1);
          setFeedback(null);
          started.current = performance.now();
          locked.current = false;
        }
      },
      skipped ? 100 : attempt.correct ? 600 : 1400,
    );
  }
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if (
        stage !== 'running' ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.repeat ||
        /INPUT|TEXTAREA|SELECT/.test((event.target as HTMLElement)?.tagName)
      )
        return;
      if (['1', '2', '3', '4'].includes(event.key)) {
        event.preventDefault();
        answer(fact.choices[Number(event.key) - 1]);
      }
      if (event.key.toLowerCase() === 's') answer('', true);
    }
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  });

  return (
    <section
      id="baseline"
      className={`baseline-card baseline-${stage}`}
      aria-labelledby="baseline-title"
    >
      <header>
        <span>
          <i>
            <Target size={17} />
          </i>
          <small>YOUR STARTING LINE</small>
        </span>
        <span className="baseline-clock">
          <Clock3 size={16} />
          {stage === 'running' ? `${left}s` : '60 seconds'}
        </span>
      </header>
      {stage === 'done' ? (
        <>
          <h2 id="baseline-title">This is your baseline.</h2>
          <p>Measured from your answers. No account, no invented score.</p>
          <div className="baseline-results">
            <div>
              <strong>
                {answered.length ? average.toFixed(1) : '—'}
                <span>{answered.length ? 's' : ''}</span>
              </strong>
              <small>Avg. per answer</small>
            </div>
            <div>
              <strong>
                {answered.length
                  ? Math.round((correct / answered.length) * 100)
                  : '—'}
                <span>{answered.length ? '%' : ''}</span>
              </strong>
              <small>Accuracy</small>
            </div>
          </div>
          <p className="baseline-takeaway">
            {answered.length < 5
              ? 'A small starting sample. Complete a longer drill before drawing conclusions.'
              : correct / answered.length < 0.85
                ? 'Your first priority: accurate recall. We’ll revisit missed facts before chasing speed.'
                : average > 2.5
                  ? 'Your accuracy is a foundation. Next, reduce the time spent reconstructing each fact.'
                  : 'A quick starting pace. Spaced reviews will test whether it stays reliable.'}
          </p>
          <small>
            {answered.length} answered ·{' '}
            {attempts.filter((a) => a.skipped).length} skipped · practice
            target: 90%+ accuracy before speed
          </small>
          <Button onClick={() => onSave(attempts)} disabled={!answered.length}>
            Save my baseline & see my plan <ArrowRight />
          </Button>
          <button className="baseline-link" onClick={begin}>
            <RotateCcw size={15} /> Try again without saving
          </button>
        </>
      ) : (
        <>
          <h2 id="baseline-title">
            {stage === 'ready'
              ? 'How quickly does it come back?'
              : `Fact ${index + 1} of ${BASELINE_FACTS.length}`}
          </h2>
          <p>
            {stage === 'ready'
              ? 'Try 12 varied facts. Find your pace and your first training priority.'
              : 'Choose the answer. Accuracy matters more than speed.'}
          </p>
          <div className="baseline-question" aria-live="polite">
            {fact.q}
          </div>
          {stage === 'ready' ? (
            <>
              <Button onClick={begin} disabled={!hydrated}>
                Start my 60-second baseline <ArrowRight />
              </Button>
              <small>
                No sign-up · ends at 12 facts or 60 seconds · adults 18+
              </small>
              <p className="baseline-privacy">
                Answers stay in this page until you choose to save them.
              </p>
            </>
          ) : (
            <>
              <div className="baseline-options">
                {fact.choices.map((choice, i) => (
                  <button
                    key={choice}
                    disabled={!!feedback}
                    onClick={() => answer(choice)}
                    className={
                      feedback && choice === fact.a ? 'is-correct' : ''
                    }
                  >
                    <kbd>{i + 1}</kbd>
                    {choice}
                  </button>
                ))}
              </div>
              <output
                className={`baseline-feedback ${feedback ? (feedback.correct ? 'is-correct' : 'is-review') : ''}`}
                aria-live="polite"
              >
                {feedback ? (
                  <>
                    {feedback.correct ? <Check /> : <RotateCcw />}
                    <span>
                      {feedback.skipped
                        ? 'Saved for review'
                        : feedback.correct
                          ? `Correct · ${(feedback.ms / 1000).toFixed(2)}s`
                          : `Recall this pair: ${fact.a}`}
                    </span>
                  </>
                ) : (
                  <span>Keyboard 1–4 · S to skip</span>
                )}
              </output>
              <div className="baseline-controls">
                <button onClick={() => answer('', true)} disabled={!!feedback}>
                  Skip this fact
                </button>
                <button
                  onClick={() => {
                    locked.current = true;
                    if (advanceTimer.current)
                      clearTimeout(advanceTimer.current);
                    setStage('done');
                  }}
                >
                  Finish & see results
                </button>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}

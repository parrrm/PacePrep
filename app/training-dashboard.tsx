import {
  ArrowUpRight,
  Check,
  Clock3,
  Play,
  RotateCcw,
  Target,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FACTS } from '@/lib/recall-bank';
import { adaptiveDeck, practiceReason } from '@/lib/practice-engine';
import {
  performanceInsight,
  performanceTrend,
} from '@/lib/performance-insights';
import type { Stat, ProgressAttempt } from '@/lib/learning-progress';
import { SiteLink as Link } from './site-link';

export default function TrainingDashboard({
  today,
  history,
  stats,
  completedSessions,
  start,
  retry,
  openPractice,
}: {
  today: ProgressAttempt[];
  history: ProgressAttempt[];
  stats: Record<string, Stat>;
  completedSessions: number;
  start: () => void;
  retry: (ids: string[]) => void;
  openPractice: () => void;
}) {
  const [now] = useState(() => Date.now());
  const due = adaptiveDeck(
    FACTS.filter((fact) => practiceReason(stats[fact.id], now) === 'due'),
    stats,
    now,
    () => 0.5,
  );
  const next = due.slice(0, 10);
  const recent = history.filter((item) => !item.skipped).slice(-20);
  const accuracy = recent.length
    ? Math.round(
        (recent.filter((item) => item.correct).length / recent.length) * 100,
      )
    : null;
  const correct = recent.filter((item) => item.correct);
  const pace = correct.length
    ? (
        correct.reduce((sum, item) => sum + item.ms, 0) /
        correct.length /
        1000
      ).toFixed(1)
    : null;
  const categories = [
    {
      id: 'fractions',
      name: 'Fractions',
      example: '43.75% → 7/16',
      facts: FACTS.filter((fact) => fact.topic === 'fractions' && fact.reverse),
    },
    {
      id: 'tables',
      name: 'Tables',
      example: '17 × 8 → 136',
      facts: FACTS.filter((fact) => fact.topic === 'tables'),
    },
    {
      id: 'powers',
      name: 'Squares & cubes',
      example: '19² → 361',
      facts: FACTS.filter(
        (fact) => fact.topic === 'squares' || fact.topic === 'cubes',
      ),
    },
    {
      id: 'percentages',
      name: 'Percentages',
      example: '7/16 → 43.75%',
      facts: FACTS.filter(
        (fact) => fact.topic === 'fractions' && !fact.reverse,
      ),
    },
  ];
  const insight = performanceInsight(recent);
  const trend = performanceTrend(history, 10);
  const recentForPatterns = history.slice(-40);
  const weakness = categories
    .map((category) => {
      const ids = new Set(category.facts.map((fact) => fact.id));
      const attempts = recentForPatterns.filter((attempt) =>
        ids.has(attempt.id),
      );
      const lost = attempts.filter(
        (attempt) => attempt.skipped || !attempt.correct,
      ).length;
      return { ...category, attempts: attempts.length, lost };
    })
    .filter((category) => category.attempts)
    .sort(
      (a, b) => b.lost / b.attempts - a.lost / a.attempts || b.lost - a.lost,
    )[0];
  const action = next.length ? () => retry(next.map((fact) => fact.id)) : start;
  const actionLabel = next.length
    ? `Review ${next.length} due ${next.length === 1 ? 'fact' : 'facts'}`
    : 'Start mixed practice';
  return (
    <div className="page training-dashboard">
      <header className="workspace-title">
        <div>
          <small>YOUR TRAINING DESK</small>
          <h1>
            {history.length
              ? 'Know where you stand. Improve the next thing.'
              : 'Find your starting point in 10 questions.'}
          </h1>
          <p>
            {history.length
              ? 'Your recent answers now point to one clear next action.'
              : 'Your answers will reveal whether accuracy or recall speed needs attention first.'}
          </p>
        </div>
        <span className="session-badge">
          {today.filter((item) => !item.skipped).length} answers today
        </span>
      </header>
      <section className="next-session" aria-label="Your next session">
        <div className="next-session-copy">
          <small>{next.length ? 'READY TO REVIEW' : 'RECOMMENDED NEXT'}</small>
          <h2>
            {next.length
              ? `Refresh ${next.length} due ${next.length === 1 ? 'fact' : 'facts'}`
              : 'Your next 10 questions'}
          </h2>
          <p>
            {next.length
              ? 'A focused review of facts you have already practised. No unrelated questions.'
              : 'A mix of topics, with due facts and recent mistakes first. Work at your own pace.'}
          </p>
          <div className="session-chips">
            <span>
              <Target size={16} />
              {next.length || 10} questions
            </span>
            <span>
              <Clock3 size={16} />
              Untimed
            </span>
            <span>
              <Check size={16} />
              Explanations included
            </span>
          </div>
          <Button onClick={action}>
            <Play size={17} fill="currentColor" />
            {actionLabel}
          </Button>
          {due.length > next.length && (
            <small className="remaining-reviews">
              {due.length - next.length} more due after this set. One set at a
              time.
            </small>
          )}
        </div>
        <aside className="session-note">
          <RotateCcw size={25} />
          <h3>Understand it. Recall it.</h3>
          <p>
            Check your answer, read the explanation, then continue when you’re
            ready.
          </p>
          <span>Accuracy comes before speed.</span>
        </aside>
      </section>
      <section
        className="dashboard-scoreboard training-metrics"
        aria-label="Recent learning progress"
      >
        <article>
          <small>Recent accuracy</small>
          <strong>{accuracy === null ? '—' : `${accuracy}%`}</strong>
          <span>
            {recent.length
              ? `Last ${recent.length} answered ${recent.length === 1 ? 'question' : 'questions'}`
              : 'Your next 20 answers build this'}
          </span>
        </article>
        <article>
          <small>Correct-answer pace</small>
          <strong>{pace ? `${pace}s` : '—'}</strong>
          <span>
            {correct.length
              ? `${correct.length} correct ${correct.length === 1 ? 'answer' : 'answers'} sampled`
              : 'Build accuracy first'}
          </span>
        </article>
        <article>
          <small>Readiness signal</small>
          <strong className="metric-label">
            {insight.status === 'unmeasured'
              ? 'Not measured'
              : insight.status === 'accuracy-risk'
                ? 'Accuracy risk'
                : insight.status === 'building'
                  ? 'Building'
                  : insight.status === 'pace-next'
                    ? 'Pace next'
                    : 'On track'}
          </strong>
          <span>Based on your last {recent.length || 20} answers</span>
        </article>
        <article>
          <small>Recent trend</small>
          <strong className="metric-label">
            {trend
              ? `${trend.accuracyDelta >= 0 ? '+' : ''}${trend.accuracyDelta} pts`
              : `${completedSessions} ${completedSessions === 1 ? 'session' : 'sessions'}`}
          </strong>
          <span>
            {trend
              ? `Latest ${trend.sampleSize} vs previous ${trend.sampleSize}`
              : 'Complete 20 answers to unlock a trend'}
          </span>
        </article>
      </section>
      <section
        className={`dashboard-guidance insight-${insight.status}`}
        aria-labelledby="readiness-title"
      >
        <header>
          <div>
            <small>YOUR READINESS SIGNAL</small>
            <h2 id="readiness-title">{insight.headline}</h2>
          </div>
          {weakness?.lost ? (
            <span>
              Main pattern: {weakness.name} · {weakness.lost}{' '}
              {weakness.lost === 1 ? 'answer' : 'answers'} to fix from recent
              practice
            </span>
          ) : null}
        </header>
        <div className="insight-flow">
          <article>
            <small>WHAT HAPPENED</small>
            <p>
              {history.length
                ? insight.what
                : 'No practice answers have been recorded yet.'}
            </p>
          </article>
          <article>
            <small>WHY IT MATTERS</small>
            <p>{insight.why}</p>
          </article>
          <article>
            <small>WHAT TO DO NEXT</small>
            <p>{insight.next}</p>
          </article>
        </div>
        <footer>
          <span>
            <Check size={17} aria-hidden="true" /> Attempt recorded
            <ArrowUpRight size={16} aria-hidden="true" /> Pattern identified
            <ArrowUpRight size={16} aria-hidden="true" /> Action ready
          </span>
          <Button onClick={action}>Do This Next: {actionLabel}</Button>
        </footer>
      </section>
      <section className="training-categories" aria-labelledby="your-topics">
        <header>
          <div>
            <small>BUILD YOUR RANGE</small>
            <h2 id="your-topics">Choose a focus</h2>
          </div>
          <button onClick={openPractice}>
            All practice formats <ArrowUpRight size={17} />
          </button>
        </header>
        <div className="topic-list">
          {categories.map((category) => {
            const seen = category.facts.filter(
              (fact) => stats[fact.id]?.attempts,
            ).length;
            const count = category.facts.filter(
              (fact) => practiceReason(stats[fact.id], now) === 'due',
            ).length;
            return (
              <Link key={category.id} href={`/?practice=${category.id}`}>
                <span>
                  <b>{category.name}</b>
                  <small>{category.example}</small>
                </span>
                <span className="topic-status">
                  {count
                    ? `${count} due`
                    : seen
                      ? `${seen} explored`
                      : 'Start here'}
                  <ArrowUpRight size={18} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
      <section className="weakest-callout training-checkin">
        <Target size={22} />
        <div>
          <h2>
            {accuracy === null
              ? 'Your improvement loop starts with one attempt.'
              : accuracy >= 85
                ? 'Your accuracy is on track.'
                : 'Give the difficult facts another look.'}
          </h2>
          <p>
            {accuracy === null
              ? 'Attempt, analyse, fix the misses, and compare the next session. Every result should lead to an action.'
              : accuracy >= 85
                ? 'Review on another day to test retention, then try a sprint when you feel ready.'
                : 'Use the explanation after each answer. Recent mistakes get priority in your next mixed set.'}
          </p>
        </div>
        <Link href="/ops">
          Train mental operations <ArrowUpRight size={17} />
        </Link>
      </section>
    </div>
  );
}

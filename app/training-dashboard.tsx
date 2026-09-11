import { ArrowUpRight, Check, Clock3, Play, Target } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FACTS } from '@/lib/recall-bank';
import { adaptiveDeck, practiceReason } from '@/lib/practice-engine';
import {
  performanceInsight,
  performanceTrend,
  practiceStreak,
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
  const streak = practiceStreak(history, now);
  const todayCount = today.length;
  const dailyTarget = 10;
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
    ? `Start ${next.length}-question review`
    : 'Start 2-minute practice';
  const estimatedMinutes = Math.max(1, Math.ceil((next.length || 10) / 5));
  return (
    <div className="page training-dashboard">
      <header className="workspace-title">
        <div>
          <small>YOUR NEXT FEW MINUTES</small>
          <h1>
            {history.length
              ? 'One short session. One useful improvement.'
              : 'Have 2 minutes? Find your starting point.'}
          </h1>
          <p>
            {history.length
              ? 'Your recent answers have chosen the most useful action for you.'
              : 'Ten questions will reveal whether accuracy or recall speed needs attention first.'}
          </p>
        </div>
        <span className="session-badge">
          {Math.min(todayCount, dailyTarget)}/{dailyTarget} today
        </span>
      </header>
      <section className="next-session" aria-label="Your next session">
        <div className="next-session-copy">
          <small>{next.length ? 'YOUR BEST NEXT MOVE' : 'QUICK START'}</small>
          <h2>
            {next.length
              ? `Fix ${next.length} ${next.length === 1 ? 'fact' : 'facts'} due for review`
              : 'Turn 2 minutes into a useful baseline'}
          </h2>
          <p>
            {next.length
              ? 'Only the facts most likely to help now. No unrelated questions.'
              : 'A short mix that finds your first mark-saving priority.'}
          </p>
          <div className="session-chips">
            <span>
              <Target size={16} />
              {next.length || 10} questions
            </span>
            <span>
              <Clock3 size={16} />
              About {estimatedMinutes} min
            </span>
            <span>
              <Check size={16} />
              Instant next step
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
          <div className="daily-milestone">
            <span>
              {todayCount >= dailyTarget
                ? 'Daily milestone complete'
                : `${dailyTarget - todayCount} questions to today’s milestone`}
            </span>
            <progress
              value={Math.min(todayCount, dailyTarget)}
              max={dailyTarget}
              aria-label="Daily practice milestone"
            />
          </div>
        </div>
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
          <small>Readiness</small>
          <strong className="metric-label">
            {insight.status === 'unmeasured'
              ? 'Not measured'
              : insight.status === 'accuracy-risk'
                ? 'Accuracy first'
                : insight.status === 'building'
                  ? 'Building'
                  : insight.status === 'pace-next'
                    ? 'Speed next'
                    : 'On track'}
          </strong>
          <span>
            {pace ? `${pace}s correct-answer pace` : 'Answer 5 to unlock'}
          </span>
        </article>
        <article>
          <small>Progress trend</small>
          <strong className="metric-label">
            {trend
              ? `${trend.accuracyDelta >= 0 ? '+' : ''}${trend.accuracyDelta} pts`
              : 'Building'}
          </strong>
          <span>
            {trend
              ? `Latest ${trend.sampleSize} vs previous ${trend.sampleSize}`
              : '20 answers unlock comparison'}
          </span>
        </article>
        <article>
          <small>Current streak</small>
          <strong className="metric-label">
            {streak
              ? `${streak} ${streak === 1 ? 'day' : 'days'}`
              : 'Start today'}
          </strong>
          <span>
            {streak
              ? `${completedSessions} ${completedSessions === 1 ? 'session' : 'sessions'} completed`
              : 'One short session begins it'}
          </span>
        </article>
      </section>
      <section
        className={`dashboard-guidance insight-${insight.status}`}
        aria-labelledby="readiness-title"
      >
        <header>
          <div>
            <small>YOUR ONE PRIORITY</small>
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
            <Check size={17} aria-hidden="true" /> Practice
            <ArrowUpRight size={16} aria-hidden="true" /> Analyse
            <ArrowUpRight size={16} aria-hidden="true" /> Improve
            <ArrowUpRight size={16} aria-hidden="true" /> Repeat
          </span>
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
              ? 'Build your first small win today.'
              : accuracy >= 85
                ? 'Your accuracy is on track—prove it tomorrow.'
                : 'One more short set can close today’s gaps.'}
          </h2>
          <p>
            {accuracy === null
              ? 'A two-minute attempt is enough to reveal the first useful action.'
              : accuracy >= 85
                ? 'A return visit tests retention; consistent recall matters more than one good score.'
                : 'Retry recent misses while the explanation is fresh.'}
          </p>
        </div>
        <Link href="/ops">
          Train mental operations <ArrowUpRight size={17} />
        </Link>
      </section>
    </div>
  );
}

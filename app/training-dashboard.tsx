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
  return (
    <div className="page training-dashboard">
      <header className="workspace-title">
        <div>
          <small>YOUR TRAINING DESK</small>
          <h1>
            {history.length
              ? 'A little practice. Lasting recall.'
              : 'Make your first ten count.'}
          </h1>
          <p>
            {history.length
              ? 'Pick up with the facts that need your attention.'
              : 'Start with a short set. Your answers shape what comes next.'}
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
          <Button
            onClick={() =>
              next.length ? retry(next.map((fact) => fact.id)) : start()
            }
          >
            <Play size={17} fill="currentColor" />
            {next.length ? 'Review due facts' : 'Start mixed practice'}
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
          <small>Recall facts explored</small>
          <strong>
            {FACTS.filter((fact) => stats[fact.id]?.attempts).length}
          </strong>
          <span>Distinct prompts practised</span>
        </article>
        <article>
          <small>Sessions completed</small>
          <strong>{completedSessions}</strong>
          <span>Across your saved practice</span>
        </article>
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
              ? 'Your starting point is yours.'
              : accuracy >= 85
                ? 'Your accuracy is on track.'
                : 'Give the difficult facts another look.'}
          </h2>
          <p>
            {accuracy === null
              ? 'There is no score to catch up with. A short session gives you a useful starting point.'
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

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  performanceInsight,
  performanceTrend,
  practiceStreak,
} from '../lib/performance-insights.ts';

const answer = (correct, ms = 2000, skipped = false) => ({
  correct,
  ms,
  skipped,
});

test('readiness feedback prioritizes accuracy before speed', () => {
  const risk = performanceInsight([
    answer(true),
    answer(false),
    answer(false),
    answer(false),
  ]);
  assert.equal(risk.status, 'accuracy-risk');
  assert.equal(risk.accuracy, 25);
  assert.match(risk.next, /Retry the misses/);

  const building = performanceInsight([
    ...Array.from({ length: 8 }, () => answer(true, 5000)),
    answer(false, 5000),
    answer(false, 5000),
  ]);
  assert.equal(building.status, 'building');
  assert.match(building.next, /90% accuracy/);
});

test('accurate work separates pace building from exam-ready recall', () => {
  const slow = performanceInsight(
    Array.from({ length: 10 }, () => answer(true, 4200)),
  );
  assert.equal(slow.status, 'pace-next');
  assert.equal(slow.averageMs, 4200);

  const ready = performanceInsight(
    Array.from({ length: 10 }, () => answer(true, 1800)),
  );
  assert.equal(ready.status, 'ready');
  assert.match(ready.why, /exam reasoning/);
});

test('skips do not create invented accuracy or response pace', () => {
  const insight = performanceInsight([
    answer(false, 900, true),
    answer(false, 1200, true),
  ]);
  assert.equal(insight.status, 'unmeasured');
  assert.equal(insight.accuracy, null);
  assert.equal(insight.averageMs, null);
  assert.equal(insight.skipped, 2);
});

test('recent trend compares equal windows and waits for enough evidence', () => {
  assert.equal(performanceTrend([answer(true)], 2), null);
  const trend = performanceTrend(
    [
      answer(true, 4000),
      answer(false, 4000),
      answer(true, 2000),
      answer(true, 2000),
    ],
    2,
  );
  assert.deepEqual(trend, {
    sampleSize: 2,
    accuracyDelta: 50,
    paceDeltaMs: 2000,
  });
});

test('practice streak counts consecutive active local days ending today', () => {
  const now = new Date(2026, 8, 11, 12).getTime();
  const day = (offset) => {
    const date = new Date(now);
    date.setDate(date.getDate() - offset);
    return date.getTime();
  };
  assert.equal(
    practiceStreak(
      [
        { correct: true, ms: 900, at: day(0) },
        { correct: false, skipped: true, ms: 100, at: day(1) },
        { correct: true, ms: 1100, at: day(2) },
        { correct: true, ms: 1200, at: day(4) },
      ],
      now,
    ),
    3,
  );
  assert.equal(
    practiceStreak([{ correct: true, ms: 900, at: day(1) }], now),
    0,
  );
});

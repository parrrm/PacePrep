import test from 'node:test';
import assert from 'node:assert/strict';
import {
  performanceInsight,
  performanceTrend,
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
  assert.match(risk.next, /Retry only the missed questions/);

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
  assert.match(ready.why, /full exam questions/);
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

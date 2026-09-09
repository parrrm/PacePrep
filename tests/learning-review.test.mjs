import test from 'node:test';
import assert from 'node:assert/strict';
import { FACTS, choices, percent } from '../lib/recall-bank.ts';
import { rational, answersMatch, decimalSlip } from '../lib/recall-math.ts';
import { BASELINE_FACTS } from '../lib/baseline.ts';
import {
  updateStat,
  mergeProgress,
  comparableAttempts,
} from '../lib/learning-progress.ts';

function attempt(at, extra = {}) {
  return {
    id: 't17-8',
    topic: 'tables',
    q: '17 × 8 = ?',
    a: '136',
    raw: '136',
    correct: true,
    ms: 1000,
    at,
    sessionId: `s${at}`,
    answerMode: 'typed',
    ...extra,
  };
}
function snapshot(history, completedSessions = 0) {
  const stats = {};
  for (const item of [...history].sort((a, b) => a.at - b.at))
    stats[item.id] = updateStat(
      stats[item.id],
      item.correct && !item.skipped,
      item.ms,
      item.at,
    );
  return { history, stats, completedSessions };
}

test('complete overlapping and history-only snapshots reconstruct chronological review outcomes', () => {
  const first = attempt(1000);
  const missed = attempt(2000, { correct: false, raw: '126' });
  const latest = attempt(3000);
  const local = snapshot([missed, first]);
  const cloud = snapshot([first, latest]);
  const expected = snapshot([first, missed, latest]);
  for (const [a, b] of [
    [local, cloud],
    [cloud, local],
    [{ history: local.history }, cloud],
    [local, { history: cloud.history }],
  ]) {
    const merged = mergeProgress(a, b);
    assert.deepEqual(merged.stats, expected.stats);
    assert.deepEqual(merged.history, expected.history);
    assert.deepEqual(mergeProgress(a, merged), merged);
  }
  assert.equal(expected.stats[first.id].intervalDays, 0);
  assert.equal(expected.stats[first.id].dueAt, missed.at + 600_000);
});

test('reconnecting stale snapshots does not re-add compacted attempts', () => {
  const all = Array.from({ length: 1600 }, (_, index) =>
    attempt((index + 1) * 1000),
  );
  const cloud = { ...snapshot(all, 1), history: all.slice(-1500) };
  const stale = snapshot(all.slice(0, 100), 1);
  const merged = mergeProgress(stale, cloud);
  assert.equal(merged.stats['t17-8'].attempts, 1600);
  assert.equal(merged.history.length, 1500);
  assert.deepEqual(mergeProgress(stale, merged), merged);
  assert.deepEqual(merged.stats, cloud.stats);
});

test('a local compacted aggregate survives a smaller cloud snapshot', () => {
  const all = Array.from({ length: 100 }, (_, index) =>
    attempt((index + 1) * 1000),
  );
  const local = { ...snapshot(all, 2), history: all.slice(-10) };
  const cloud = snapshot(all.slice(0, 10), 1);
  const merged = mergeProgress(local, cloud);
  assert.equal(merged.stats['t17-8'].attempts, 100);
  assert.deepEqual(mergeProgress(local, merged), merged);
});

test('unfinished session IDs do not manufacture extra completed sessions', () => {
  const old = attempt(1000);
  const active = attempt(2000);
  const merged = mergeProgress(snapshot([old, active], 1), snapshot([old], 1));
  assert.equal(merged.completedSessions, 1);
});

test('comparisons require identified separate sessions and choose most recent comparisons', () => {
  assert.equal(
    comparableAttempts([attempt(1000, { sessionId: undefined }), attempt(2000)])
      .before.length,
    0,
  );
  const firstA = attempt(1000);
  const firstB = attempt(2000, { id: 's27' });
  const history = [
    firstA,
    firstB,
    attempt(3000),
    attempt(4000, { id: 's27' }),
    attempt(5000),
  ];
  assert.deepEqual(
    comparableAttempts(history, 1).now.map((item) => item.at),
    [5000],
  );
  assert.deepEqual(comparableAttempts(history, 0), { before: [], now: [] });
});

test('all recall answers follow the advertised arithmetic and percentage precision', () => {
  for (const fact of FACTS) {
    let match;
    if ((match = fact.id.match(/^f(\d+)-(\d+)(r?)$/))) {
      const [, numerator, denominator, reverse] = match;
      const p = percent(Number(numerator), Number(denominator));
      assert.equal(
        fact.a,
        reverse ? `${numerator}/${denominator}` : p,
        fact.id,
      );
      const value = rational(p);
      const exact =
        value.n * BigInt(denominator) === BigInt(numerator) * value.d;
      assert.equal(fact.approximate, !exact, fact.id);
      assert.equal(fact.q.includes('≈'), !exact, fact.id);
      if (!exact) {
        const lower = Number(p.slice(0, -1));
        const actual = (100 * Number(numerator)) / Number(denominator);
        assert.ok(actual >= lower && actual - lower < 0.01, fact.id);
      }
    } else if ((match = fact.id.match(/^fm(\d+)-(\d+)-(\d+)(r?)$/))) {
      const [, whole, numerator, denominator, reverse] = match;
      assert.equal(
        fact.a,
        reverse
          ? percent(
              Number(whole) * Number(denominator) + Number(numerator),
              Number(denominator),
            )
          : `${whole} ${numerator}/${denominator}`,
        fact.id,
      );
    } else if ((match = fact.id.match(/^t(\d+)-(\d+)(r?)$/))) {
      assert.equal(
        Number(fact.a),
        match[3] ? Number(match[2]) : Number(match[1]) * Number(match[2]),
        fact.id,
      );
    } else if ((match = fact.id.match(/^([scm])(\d+)(r?)$/))) {
      const [, topic, value, reverse] = match;
      const n = Number(value);
      assert.equal(
        Number(fact.a),
        reverse
          ? n + Number(topic === 'm')
          : topic === 's'
            ? n ** 2
            : topic === 'c'
              ? n ** 3
              : n * (n + 1),
        fact.id,
      );
      if (topic === 's' && reverse) assert.equal(fact.q, `√${n ** 2} = ?`);
    } else assert.fail(`Unverified fact ${fact.id}`);
  }
  for (const baseline of BASELINE_FACTS)
    assert.equal(
      FACTS.find((fact) => fact.id === baseline.id)?.a,
      baseline.a,
      baseline.id,
    );
});

test('MCQ options stay mathematically distinct at randomization extremes', () => {
  const originalRandom = Math.random;
  try {
    for (const random of [0, 1 - Number.EPSILON]) {
      Math.random = () => random;
      for (const fact of FACTS) {
        const options = choices(fact);
        assert.equal(options.length, 4, fact.id);
        assert.equal(
          options.filter((option) => answersMatch(option, fact.a)).length,
          1,
          fact.id,
        );
        for (let i = 0; i < options.length; i++)
          for (let j = i + 1; j < options.length; j++)
            assert.equal(
              answersMatch(options[i], options[j]),
              false,
              `${fact.id}: ${options[i]}, ${options[j]}`,
            );
      }
    }
  } finally {
    Math.random = originalRandom;
  }
});

test('percentage formatting keeps exact terminating digits and rejects invalid denominators', () => {
  assert.equal(percent(1, 6), '16.66%');
  assert.equal(percent(1, 3), '33.33%');
  assert.equal(percent(7, 16), '43.75%');
  assert.equal(percent(3, 24), '12.5%');
  assert.equal(
    percent(1, 2 ** 50),
    '0.000000000000088817841970012523233890533447265625%',
  );
  for (const denominator of [0, -1, NaN, Infinity, 1.5])
    assert.throws(() => percent(1, denominator), RangeError);
});

test('decimal-slip coaching treats surrounding spaces consistently with grading', () => {
  assert.equal(decimalSlip('43.75 ', '43.75% '), false);
  assert.equal(decimalSlip('4.375 ', '43.75% '), true);
});

test('reset generations discard stale history even with a future client clock', () => {
  const stale = { ...snapshot([attempt(9999999999999)], 9) };
  const reset = { resetAt: 1000, stats: {}, history: [], completedSessions: 0 };
  assert.deepEqual(mergeProgress(stale, reset), reset);
  assert.deepEqual(mergeProgress(reset, stale), reset);
  const fresh = { ...snapshot([attempt(2000)], 1), resetAt: 1000 };
  const merged = mergeProgress(fresh, reset);
  assert.equal(merged.history.length, 1);
  assert.equal(merged.resetAt, 1000);
  assert.deepEqual(mergeProgress(stale, merged), merged);
});

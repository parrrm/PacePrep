import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adaptiveDeck,
  benchmarkDeck,
  practiceReason,
  sessionSize,
} from '../lib/practice-engine.ts';
import { updateStat, DAY_MS } from '../lib/learning-progress.ts';
import { FACTS } from '../lib/recall-bank.ts';
import { operationsByTopic } from '../lib/mental-ops.ts';

const now = 10 * DAY_MS;
const fixedRandom = () => 0.5;

test('mixed practice puts actual due facts ahead of repairs, new facts and retained facts', () => {
  const pool = [
    { id: 'new', topic: 'fractions' },
    { id: 'retained', topic: 'tables' },
    { id: 'repair', topic: 'squares' },
    { id: 'due', topic: 'tables' },
  ];
  const stats = {
    retained: updateStat(undefined, true, 1000, now),
    repair: updateStat(undefined, false, 1000, now),
    due: updateStat(undefined, true, 1000, now - DAY_MS),
  };
  const before = structuredClone({ pool, stats });
  assert.deepEqual(
    adaptiveDeck(pool, stats, now, fixedRandom).map((f) => f.id),
    ['due', 'repair', 'new', 'retained'],
  );
  assert.deepEqual(
    { pool, stats },
    before,
    'building a deck must not mutate saved progress or the bank',
  );
  assert.equal(practiceReason(stats.retained, now), 'retain');
  assert.equal(practiceReason(stats.due, now), 'due');
  assert.equal(practiceReason(stats.repair, now), 'repair');
});

test('topic variety cannot push due reviews behind new questions', () => {
  const pool = Array.from({ length: 14 }, (_, i) => ({
    id: `due-${i}`,
    topic: 'tables',
  }));
  pool.push(
    { id: 'new-fraction', topic: 'fractions' },
    { id: 'new-cube', topic: 'cubes' },
  );
  const stats = Object.fromEntries(
    pool
      .slice(0, 14)
      .map((f) => [f.id, updateStat(undefined, true, 1000, now - 2 * DAY_MS)]),
  );
  const deck = adaptiveDeck(pool, stats, now, fixedRandom);
  assert.ok(deck.slice(0, 14).every((f) => f.id.startsWith('due-')));
});

test('adaptive selection deduplicates targets and stays in the supplied pool', () => {
  const one = FACTS[0];
  assert.deepEqual(adaptiveDeck([one, one], {}, now, fixedRandom), [one]);
  assert.deepEqual(adaptiveDeck([], {}, now, fixedRandom), []);
  const pool = operationsByTopic('addition');
  const chosen = pool.at(-1);
  const stats = {
    [chosen.id]: updateStat(undefined, false, 1000, now - DAY_MS),
  };
  assert.equal(adaptiveDeck(pool, stats, now, fixedRandom)[0].id, chosen.id);
});

test('table benchmarks stay in category, are unique and balance both directions', () => {
  const pool = FACTS.filter((f) => f.topic === 'tables');
  const before = [...pool];
  const deck = benchmarkDeck(pool, 10, fixedRandom);
  assert.equal(deck.length, 10);
  assert.equal(new Set(deck.map((f) => f.id)).size, 10);
  assert.ok(deck.every((f) => f.topic === 'tables'));
  assert.equal(deck.filter((f) => f.reverse).length, 5);
  assert.deepEqual(pool, before);
});

test('mixed benchmarks cover available topics and gracefully handle a small target pool', () => {
  const deck = benchmarkDeck(FACTS, 10, fixedRandom);
  const topics = new Set(FACTS.map((f) => f.topic));
  assert.deepEqual(
    new Set(deck.slice(0, topics.size).map((f) => f.topic)),
    topics,
  );
  const one = FACTS[0];
  assert.deepEqual(benchmarkDeck([one, one], 50, fixedRandom), [one]);
  assert.deepEqual(benchmarkDeck([], 10, fixedRandom), []);
  assert.deepEqual(benchmarkDeck(FACTS, 0, fixedRandom), []);
});

test('untimed sessions have finite lengths bounded by their target pool', () => {
  assert.equal(sessionSize('mixed', FACTS.length), 10);
  assert.equal(sessionSize('focus', 3), 3);
  assert.equal(sessionSize('test25', FACTS.length), 25);
  assert.equal(sessionSize('test50', 8), 8);
  assert.equal(sessionSize('sprint', FACTS.length), 0);
});

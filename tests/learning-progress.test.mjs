import test from 'node:test';
import assert from 'node:assert/strict';
import { FACTS, choices } from '../lib/recall-bank.ts';
import { answersMatch } from '../lib/recall-math.ts';
import { updateStat, mergeProgress, DAY_MS } from '../lib/learning-progress.ts';
import { createOperationProgress } from '../lib/ops-progress.ts';

const attempt = (at = 1000, id = 't17-8') => ({ id, topic: 'tables', q: '17 × 8', a: '136', raw: '136', correct: true, ms: 1000, at, sessionId: `s${at}` });

test('every bank fact has an explicit direction and exactly one correct MCQ option', () => {
  assert.equal(new Set(FACTS.map(f => f.id)).size, FACTS.length);
  for (const fact of FACTS) {
    assert.equal(typeof fact.reverse, 'boolean', fact.id);
    const options = choices(fact);
    assert.equal(options.length, 4, fact.id);
    assert.equal(options.filter(o => answersMatch(o, fact.a)).length, 1, fact.id);
    assert.equal(new Set(options).size, 4, fact.id);
  }
  assert.ok(FACTS.some(f => f.topic === 'tables' && f.reverse === false));
});

test('scheduling starts at one day and advances only when a review is due', () => {
  const first = updateStat(undefined, true, 1000, 1000);
  assert.equal(first.intervalDays, 1);
  const early = updateStat(first, true, 800, 2000);
  assert.equal(early.box, first.box);
  assert.equal(early.dueAt, first.dueAt);
  const due = updateStat(early, true, 800, 1000 + DAY_MS);
  assert.equal(due.intervalDays, 3);
  const missed = updateStat(due, false, 3000, due.last + 1000);
  assert.equal(missed.intervalDays, 0);
  assert.equal(missed.lapses, 1);
  assert.equal(updateStat(missed, true, 1000, missed.dueAt).intervalDays, 1);
});

test('old offline answers add totals without moving a newer review schedule backwards', () => {
  const latest = updateStat(undefined, true, 1000, 5000);
  const merged = updateStat(latest, false, 2000, 1000);
  assert.equal(merged.last, latest.last);
  assert.equal(merged.dueAt, latest.dueAt);
  assert.equal(merged.attempts, 2);
});

test('merging overlapping snapshots is idempotent and preserves separate facts', () => {
  const a = attempt();
  const b = attempt(2000, 's27');
  const local = { history: [a, b], stats: { [a.id]: updateStat(undefined,true,a.ms,a.at), [b.id]: updateStat(undefined,true,b.ms,b.at) }, completedSessions: 2 };
  const cloud = { history: [a], stats: { [a.id]: updateStat(undefined,true,a.ms,a.at) }, completedSessions: 1 };
  const result = mergeProgress(local, cloud);
  assert.equal(result.history.length, 2);
  assert.equal(result.stats[a.id].attempts, 1);
  assert.equal(result.stats[b.id].attempts, 1);
  assert.deepEqual(mergeProgress(local, result), result);
});

test('operation progress writes only its account and serializes cloud saves', async () => {
  const values = new Map([['paceprep-progress:bob', JSON.stringify({completedSessions: 9})]]);
  const storage = { getItem: k => values.get(k) ?? null, setItem: (k,v) => values.set(k,v) };
  let release;
  const first = new Promise(resolve => { release = resolve; });
  const saved = [];
  const session = createOperationProgress('alice', storage, async snapshot => { if (!saved.length) await first; saved.push(snapshot); });
  session.record(attempt());
  session.record(attempt(2000));
  session.complete();
  await Promise.resolve();
  assert.equal(saved.length, 0);
  release();
  await session.flush();
  assert.deepEqual(saved.map(s => s.history.length), [1,2,2]);
  assert.equal(JSON.parse(values.get('paceprep-progress:alice')).completedSessions, 1);
  assert.equal(JSON.parse(values.get('paceprep-progress:bob')).completedSessions, 9);
  assert.equal(values.has('paceprep-progress'), false);
});

test('malformed local progress is preserved and rejected, not overwritten', () => {
  const values = new Map([['paceprep-progress', '{broken']]);
  const storage = { getItem: k => values.get(k), setItem: (k,v) => values.set(k,v) };
  assert.throws(() => createOperationProgress(null, storage, async () => {}));
  assert.equal(values.get('paceprep-progress'), '{broken');
});

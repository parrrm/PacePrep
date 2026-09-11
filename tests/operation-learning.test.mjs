import test from 'node:test';
import assert from 'node:assert/strict';
import { GENERATED_OPERATIONS } from '../lib/operation-generator.ts';
import {
  skillEvidence,
  skillStage,
  diagnoseOperation,
  operationPracticeDeck,
  operationBenchmark,
} from '../lib/operation-learning.ts';
import { updateStat } from '../lib/learning-progress.ts';
const pool = GENERATED_OPERATIONS.filter(
  (item) =>
    item.topic === 'addition' &&
    item.difficulty === 1 &&
    item.partition === 'practice',
);
const attempt = (item, correct = true) => ({
  ...item,
  correct,
  at: 100000,
  ms: 2000,
  answerMode: 'typed',
});

test('skill evidence keeps modes distinct and cannot infer mastery from one repeated fact', () => {
  const history = [
    ...pool
      .slice(0, 10)
      .map((item) => ({ ...attempt(item), answerMode: 'mcq' })),
    attempt(pool[0]),
  ];
  assert.equal(skillEvidence(history, pool[0].skill).answered, 1);
  assert.equal(skillEvidence(history, pool[0].skill).confidence, 'early');
  assert.equal(
    skillEvidence(
      Array.from({ length: 20 }, () => attempt(pool[0])),
      pool[0].skill,
    ).confidence,
    'early',
  );
  assert.equal(skillEvidence([], pool[0].skill).accuracy, null);
});

test('diagnosis matches mathematical error candidates and withholds unsupported guesses', () => {
  const carry = GENERATED_OPERATIONS.find(
    (item) =>
      item.topic === 'addition' &&
      (item.operands[0] % 10) + (item.operands[1] % 10) >= 10,
  );
  assert.equal(
    diagnoseOperation(carry.id, String(Number(carry.a) - 10))?.pattern,
    'Possible missed carry',
  );
  assert.equal(diagnoseOperation(carry.id, carry.a), null);
  assert.equal(diagnoseOperation(carry.id, '99999'), null);
  assert.equal(diagnoseOperation('legacy', '123'), null);
  const multiply = GENERATED_OPERATIONS.find(
    (item) => item.id === 'mul-v1-1-0',
  );
  for (const [raw, pattern] of [
    ['1000', 'Possible place-value slip'],
    ['10', 'Possible place-value slip'],
    ['4', 'Possible operation mix-up'],
    ['120', 'Possible neighboring multiple'],
    ['80', 'Possible neighboring multiple'],
  ])
    assert.equal(diagnoseOperation(multiply.id, raw)?.pattern, pattern);
  assert.equal(diagnoseOperation(multiply.id, ''), null);
  assert.equal(diagnoseOperation(multiply.id, '1e2'), null);
});

test('difficulty needs diverse current-tier evidence and falls back after errors', () => {
  const good = pool.slice(0, 10).map((item) => attempt(item));
  assert.equal(skillStage(good, pool[0]).level, 2);
  assert.equal(skillStage(good.slice(0, 4), pool[0]).level, 1);
  assert.equal(
    skillStage(
      [...good, ...pool.slice(0, 10).map((item) => attempt(item, false))],
      pool[0],
    ).level,
    1,
  );
});

test('difficulty gates new items but always permits an already due difficult fact', () => {
  const difficult = GENERATED_OPERATIONS.find(
    (item) =>
      item.topic === 'addition' &&
      item.difficulty === 3 &&
      item.partition === 'practice',
  );
  const fresh = operationPracticeDeck('addition', [], {}, 'seed', 200000);
  assert.ok(fresh.every((item) => !item.difficulty || item.difficulty === 1));
  const deck = operationPracticeDeck(
    'addition',
    [],
    { [difficult.id]: updateStat(undefined, false, 1000, 10000) },
    'seed',
    2000000,
  );
  assert.equal(deck[0].id, difficult.id);
});

test('benchmarks are unseen, reproducible, balanced and never leak into practice', () => {
  const deck = operationBenchmark('addition', [], 'seed');
  assert.equal(deck.length, 10);
  assert.deepEqual(deck, operationBenchmark('addition', [], 'seed'));
  assert.equal(new Set(deck.map((item) => item.difficulty)).size, 3);
  const practice = new Set(
    operationPracticeDeck('addition', [], {}, 'seed').map((item) => item.q),
  );
  assert.ok(deck.every((item) => !practice.has(item.q)));
  const next = operationBenchmark(
    'addition',
    deck.map((item) => attempt(item)),
    'seed',
  );
  assert.ok(
    next.every((item) => !deck.some((previous) => previous.q === item.q)),
  );
  const compacted = operationBenchmark(
    'addition',
    [],
    'seed',
    10,
    Object.fromEntries(
      deck.map((item) => [item.id, updateStat(undefined, true, 1000, 10000)]),
    ),
  );
  assert.ok(
    compacted.every(
      (item) => !deck.some((previous) => previous.id === item.id),
    ),
  );
  assert.equal(
    operationBenchmark(
      'addition',
      GENERATED_OPERATIONS.map((item) => attempt(item)),
      'seed',
    ).length,
    0,
  );
});

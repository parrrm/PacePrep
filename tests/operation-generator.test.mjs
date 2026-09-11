import test from 'node:test';
import assert from 'node:assert/strict';
import { OPERATION_FACTS } from '../lib/mental-ops.ts';
import {
  GENERATED_OPERATIONS,
  generatedDeck,
} from '../lib/operation-generator.ts';

test('all generated templates have exact answers, safe constraints and stable unique identities', () => {
  assert.equal(GENERATED_OPERATIONS.length, 720);
  assert.equal(new Set(GENERATED_OPERATIONS.map((item) => item.id)).size, 720);
  assert.equal(new Set(GENERATED_OPERATIONS.map((item) => item.q)).size, 720);
  assert.equal(
    new Set(OPERATION_FACTS.map((item) => item.q)).size,
    OPERATION_FACTS.length,
  );
  for (const item of GENERATED_OPERATIONS) {
    const [a, b] = item.operands;
    const expected = {
      addition: a + b,
      subtraction: a - b,
      multiplication: a * b,
      division: a / b,
    }[item.topic];
    assert.equal(Number(item.a), expected, item.id);
    assert.ok(Number.isSafeInteger(expected) && expected > 0);
    assert.ok(item.steps.length >= 2 && item.targetMs > 0);
    assert.ok(item.strategy.includes(item.a));
  }
});

test('seeded generation is reproducible, varied and excludes measurement items', () => {
  assert.deepEqual(
    generatedDeck('example', 'addition'),
    generatedDeck('example', 'addition'),
  );
  assert.notDeepEqual(
    generatedDeck('example', 'addition'),
    generatedDeck('other', 'addition'),
  );
  assert.ok(
    generatedDeck('example', 'addition').every(
      (item) => item.partition === 'practice',
    ),
  );
});

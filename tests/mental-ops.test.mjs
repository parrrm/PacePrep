import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OPERATION_FACTS,
  operationsByTopic,
} from '../lib/mental-ops.ts';

test('operation bank is a closed set with unique ids', () => {
  assert.ok(OPERATION_FACTS.length >= 120, String(OPERATION_FACTS.length));
  assert.equal(
    OPERATION_FACTS.length,
    new Set(OPERATION_FACTS.map((item) => item.id)).size,
  );
});

test('every operation prompt evaluates to its stored answer', () => {
  for (const item of OPERATION_FACTS) {
    assert.match(item.id, /^(add|sub|mul|div)-/);
    assert.ok(item.strategy.length > 8, item.id);
    const expected = Number(item.a);
    assert.equal(Number.isInteger(expected), true, item.id);
    if (item.q.split('+').length === 3) {
      const addends = item.q.replace(' = ?', '').split(' + ').map(Number);
      assert.equal(addends.reduce((a,b) => a+b, 0), expected, item.id);
      continue;
    }
    const match = item.q.match(/^(\d+) ([×÷−+]) (\d+) = \?$/);
    assert.ok(match, item.q);
    const a = Number(match[1]), b = Number(match[3]);
    const got = ({ '×': () => a*b, '÷': () => a/b, '−': () => a-b, '+': () => a+b })[match[2]]();
    assert.equal(got, expected, `${item.q} => ${got}, expected ${expected}`);
  }
});

test('each operation family has a usable practice set', () => {
  for (const topic of ['addition', 'subtraction', 'multiplication', 'division']) {
    assert.ok(operationsByTopic(topic).length >= 20, topic);
  }
});

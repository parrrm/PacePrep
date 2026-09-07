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
    assert.ok(item.strategy.trim().length > 0, item.id);
    const expected = Number(item.a);
    assert.equal(Number.isInteger(expected), true, item.id);
    const expr = item.q
      .replace(' = ?', '')
      .replaceAll('×', '*')
      .replaceAll('÷', '/')
      .replaceAll('−', '-');
    const got = Function(`return (${expr})`)();
    assert.equal(got, expected, `${item.q} => ${got}, expected ${expected}`);
  }
});

test('each operation family has a usable practice set', () => {
  for (const topic of ['addition', 'subtraction', 'multiplication', 'division']) {
    assert.ok(operationsByTopic(topic).length >= 20, topic);
  }
});

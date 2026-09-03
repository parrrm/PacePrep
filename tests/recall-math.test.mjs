import test from 'node:test';
import assert from 'node:assert/strict';
import {
  answersMatch,
  decimalSlip,
  questionsPerMinute,
} from '../lib/recall-math.ts';
import { BASELINE_FACTS } from '../lib/baseline.ts';

test('exact equivalent fractions and mixed numbers are accepted', () => {
  for (const [raw, expected] of [
    ['22/26', '11/13'],
    ['7/2', '3 1/2'],
    ['3.5', '3 1/2'],
    ['-7/2', '-3 1/2'],
    ['-1/2', '-0 1/2'],
    [' 3 / 8 ', '3/8'],
    ['.5', '1/2'],
  ])
    assert.equal(answersMatch(raw, expected), true, `${raw} = ${expected}`);
});
test('percentage digits are preserved, never approximately graded', () => {
  assert.equal(answersMatch('12.5', '12.5%'), true);
  assert.equal(answersMatch('12.50%', '12.5%'), true);
  assert.equal(answersMatch('16.66', '16.66%'), true);
  assert.equal(answersMatch('16.67', '16.66%'), false);
  assert.equal(answersMatch('43.75000000000000000001', '43.75%'), false);
  assert.equal(answersMatch('12', '12.5%'), false);
});
test('invalid and unsafe forms are rejected', () => {
  for (const raw of [
    '',
    '1/0',
    'NaN',
    'Infinity',
    '3//8',
    'abc',
    '1e2',
    '1'.repeat(81),
  ])
    assert.equal(answersMatch(raw, '1'), false);
});
test('decimal coaching is evidence-based and exact', () => {
  assert.equal(decimalSlip('4.375', '43.75%'), true);
  assert.equal(decimalSlip('437.5%', '43.75%'), true);
  assert.equal(decimalSlip('42.75', '43.75%'), false);
  assert.equal(decimalSlip('0', '43.75%'), false);
});
test('early sprint QPM uses elapsed session time, not raw answer count', () => {
  assert.equal(questionsPerMinute(10, 30_000), 20);
  assert.equal(questionsPerMinute(10, 60_000), 10);
  assert.equal(questionsPerMinute(0, 0), 0);
});
test('baseline has twelve distinct facts and one correct option each', () => {
  assert.equal(BASELINE_FACTS.length, 12);
  assert.equal(new Set(BASELINE_FACTS.map((f) => f.id)).size, 12);
  for (const fact of BASELINE_FACTS)
    assert.equal(
      fact.choices.filter((choice) => answersMatch(choice, fact.a)).length,
      1,
    );
});

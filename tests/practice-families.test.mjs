import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RECALL_FACT_FAMILY_IDS,
  OPERATION_FAMILY_IDS,
  isRecallFamily,
  isOperationFamily,
  practiceHref,
} from '../lib/practice-families.ts';

test('each practice card has its own validated family destination', () => {
  const families = [...RECALL_FACT_FAMILY_IDS, ...OPERATION_FAMILY_IDS];
  assert.equal(new Set(families.map((f) => practiceHref(f))).size, 9);
  for (const family of families) {
    const url = new URL(practiceHref(family), 'https://paceprep.example');
    assert.equal(
      url.searchParams.get(isOperationFamily(family) ? 'family' : 'practice'),
      family,
    );
    assert.equal(url.pathname, isOperationFamily(family) ? '/ops' : '/');
  }
  assert.ok(RECALL_FACT_FAMILY_IDS.includes('consecutive'));
});

test('unsupported URL families fall back to the practice chooser', () => {
  for (const value of [
    null,
    '',
    'constructor',
    '__proto__',
    'random-unknown',
  ]) {
    assert.equal(isRecallFamily(value), false);
    assert.equal(isOperationFamily(value), false);
  }
});

test('Grok entry remains isolated across recall, operation, and mixed links', () => {
  for (const family of [
    ...RECALL_FACT_FAMILY_IDS,
    ...OPERATION_FAMILY_IDS,
    'mixed',
  ]) {
    assert.equal(
      new URL(
        practiceHref(family, true),
        'https://paceprep.example',
      ).searchParams.get('grok-test'),
      '1',
    );
    assert.equal(
      new URL(
        practiceHref(family),
        'https://paceprep.example',
      ).searchParams.has('grok-test'),
      false,
    );
  }
});

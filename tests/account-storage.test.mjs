import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertProgressAccount,
  prepareAccountStorage,
  progressStorageKey,
} from '../lib/account-storage.ts';

function memoryStorage(initial) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

test('an expired session reads guest storage even when a previous account marker remains', () => {
  const storage = memoryStorage({
    'paceprep-account': 'alice',
    'paceprep-progress:alice': 'private-history',
    'paceprep-progress': 'guest-history',
  });
  assert.equal(storage.getItem(progressStorageKey(null)), 'guest-history');
  assert.equal(storage.getItem(progressStorageKey('bob')), null);
});

test('a trainer opened for one account cannot sync after switching accounts or signing out', () => {
  assert.doesNotThrow(() => assertProgressAccount('alice', 'alice'));
  assert.throws(() => assertProgressAccount('alice', 'bob'), /Account changed/);
  assert.throws(() => assertProgressAccount('alice', null), /Account changed/);
  assert.throws(() => assertProgressAccount(null, 'bob'), /Account changed/);
});

test('first sign-in claims guest history once and does not leave legacy history to leak', () => {
  const storage = memoryStorage({
    'paceprep-progress': 'guest',
    'recall-lab': 'legacy',
  });
  prepareAccountStorage('alice', storage);
  assert.equal(storage.getItem(progressStorageKey('alice')), 'guest');
  assert.equal(storage.getItem('paceprep-progress'), null);
  assert.equal(storage.getItem('recall-lab'), null);
  prepareAccountStorage('bob', storage);
  assert.equal(storage.getItem(progressStorageKey('bob')), null);
  assert.equal(storage.getItem(progressStorageKey('alice')), 'guest');
});

test('signing in preserves existing account snapshots and unclaimed guest history', () => {
  const storage = memoryStorage({
    'paceprep-progress:alice': 'saved',
    'paceprep-progress': 'new-guest',
  });
  prepareAccountStorage('alice', storage);
  assert.equal(storage.getItem(progressStorageKey('alice')), 'saved');
  assert.equal(storage.getItem('paceprep-progress'), 'new-guest');
});

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
    'paceprep-progress': JSON.stringify({ completedSessions: 2 }),
    'recall-lab': 'legacy',
  });
  prepareAccountStorage('alice', storage);
  assert.equal(
    JSON.parse(storage.getItem(progressStorageKey('alice'))).completedSessions,
    2,
  );
  assert.equal(storage.getItem('paceprep-progress'), null);
  assert.equal(storage.getItem('recall-lab'), null);
  prepareAccountStorage('bob', storage);
  assert.equal(storage.getItem(progressStorageKey('bob')), null);
  assert.equal(
    JSON.parse(storage.getItem(progressStorageKey('alice'))).completedSessions,
    2,
  );
});

test('sign-in merges guest history into an existing account without duplicates', () => {
  const attempt = (id, at) => ({
    id,
    at,
    topic: 'tables',
    q: '2 × 3',
    a: '6',
    raw: '6',
    correct: true,
    ms: 1000,
  });
  const storage = memoryStorage({
    'paceprep-progress:alice': JSON.stringify({
      history: [attempt('a', 1000)],
    }),
    'paceprep-progress': JSON.stringify({ history: [attempt('b', 2000)] }),
  });
  prepareAccountStorage('alice', storage);
  assert.equal(
    JSON.parse(storage.getItem(progressStorageKey('alice'))).history.length,
    2,
  );
  assert.equal(storage.getItem('paceprep-progress'), null);
  prepareAccountStorage('alice', storage);
  assert.equal(
    JSON.parse(storage.getItem(progressStorageKey('alice'))).history.length,
    2,
  );
});

test('a different account cannot claim guest work associated with the previous account', () => {
  const guest = JSON.stringify({ completedSessions: 2 });
  const storage = memoryStorage({
    'paceprep-account': 'alice',
    'paceprep-progress': guest,
  });
  prepareAccountStorage('bob', storage);
  assert.equal(storage.getItem(progressStorageKey('bob')), null);
  assert.equal(storage.getItem('paceprep-progress'), guest);
  assert.equal(storage.getItem('paceprep-account'), 'alice');
});

test('failed account migration preserves guest source and identity claim', () => {
  const guest = JSON.stringify({ completedSessions: 2 });
  const storage = memoryStorage({ 'paceprep-progress': guest });
  const originalSet = storage.setItem;
  storage.setItem = (key, value) => {
    if (key === progressStorageKey('alice')) throw new Error('quota');
    originalSet(key, value);
  };
  assert.throws(() => prepareAccountStorage('alice', storage), /quota/);
  assert.equal(storage.getItem('paceprep-progress'), guest);
  assert.equal(storage.getItem('paceprep-account'), 'alice');
  prepareAccountStorage('bob', storage);
  assert.equal(storage.getItem(progressStorageKey('bob')), null);
});

test('guest reset markers do not override an account reset generation', () => {
  const storage = memoryStorage({
    'paceprep-progress': JSON.stringify({
      resetAt: 9000,
      history: [],
      stats: {},
    }),
    'paceprep-progress:alice': JSON.stringify({
      resetAt: 1000,
      history: [],
      stats: {},
    }),
  });
  prepareAccountStorage('alice', storage);
  assert.equal(
    JSON.parse(storage.getItem(progressStorageKey('alice'))).resetAt,
    1000,
  );
});

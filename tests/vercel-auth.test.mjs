import test from 'node:test';
import assert from 'node:assert/strict';
import { openProgressStore } from '../server/progress-supabase.ts';

test('Vercel rejects forged legacy identity headers without contacting a backend', async () => {
  const previousFetch = globalThis.fetch;
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_PUBLISHABLE_KEY = 'test-publishable';
  globalThis.fetch = () => {
    throw new Error('Unexpected network request');
  };
  try {
    const store = await openProgressStore(
      new Request('https://paceprep.example/api/progress', {
        headers: {
          'oai-authenticated-user-id': 'forged',
          'oai-authenticated-user-email': 'forged@example.test',
        },
      }),
    );
    assert.equal(store, null);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_PUBLISHABLE_KEY;
    else process.env.SUPABASE_PUBLISHABLE_KEY = previousKey;
  }
});

test('Supabase adapter verifies tokens and uses only the verified account for writes', async () => {
  const previousFetch = globalThis.fetch;
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_PUBLISHABLE_KEY = 'test-publishable';
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/auth/v1/user'))
      return Response.json({
        id: 'verified-user',
        email: 'learner@example.test',
      });
    return Response.json([{ user_id: 'verified-user' }]);
  };
  try {
    const store = await openProgressStore(
      new Request('https://paceprep.example/api/progress', {
        headers: {
          Authorization: 'Bearer verified-by-provider',
          'oai-authenticated-user-id': 'different-user',
        },
      }),
    );
    assert.equal(store.user.userId, 'verified-user');
    await store.write({ stats: {} }, null);
    assert.equal(calls.length, 2);
    assert.equal(JSON.parse(calls[1].options.body).user_id, 'verified-user');
    assert.equal(
      new Headers(calls[1].options.headers).get('Authorization'),
      'Bearer verified-by-provider',
    );
    assert.equal(calls[1].options.cache, 'no-store');
  } finally {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_PUBLISHABLE_KEY;
    else process.env.SUPABASE_PUBLISHABLE_KEY = previousKey;
  }
});

test('invalid Supabase bearer token is not treated as a signed-in account', async () => {
  const previousFetch = globalThis.fetch;
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_PUBLISHABLE_KEY = 'test-publishable';
  globalThis.fetch = async () => new Response(null, { status: 401 });
  try {
    assert.equal(
      await openProgressStore(
        new Request('https://paceprep.example/api/progress', {
          headers: { Authorization: 'Bearer invalid' },
        }),
      ),
      null,
    );
  } finally {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_PUBLISHABLE_KEY;
    else process.env.SUPABASE_PUBLISHABLE_KEY = previousKey;
  }
});

test('Supabase updates atomically compare the revision and reject a lost race', async () => {
  const previousFetch = globalThis.fetch;
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_PUBLISHABLE_KEY = 'test-publishable';
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return url.endsWith('/auth/v1/user')
      ? Response.json({ id: 'alice', email: 'alice@example.invalid' })
      : Response.json([]);
  };
  try {
    const store = await openProgressStore(
      new Request('https://paceprep.test/api/progress', {
        headers: { Authorization: 'Bearer valid' },
      }),
    );
    const revision = '2026-09-08T00:00:00.000+00:00';
    await assert.rejects(
      store.write({ history: [] }, revision),
      /Progress changed/,
    );
    assert.equal(calls[1].options.method, 'PATCH');
    const url = new URL(calls[1].url);
    assert.equal(url.searchParams.get('user_id'), 'eq.alice');
    assert.equal(url.searchParams.get('updated_at'), `eq.${revision}`);
    assert.equal(JSON.parse(calls[1].options.body).user_id, 'alice');
  } finally {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_PUBLISHABLE_KEY;
    else process.env.SUPABASE_PUBLISHABLE_KEY = previousKey;
  }
});

test('Supabase deletion retains a reset generation and permits only the next matching revision', async () => {
  const previousFetch = globalThis.fetch;
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_PUBLISHABLE_KEY = 'test-publishable';
  let row = {
    progress: { completedSessions: 8 },
    updated_at: '2026-09-08T00:00:00.000Z',
  };
  const initialRevision = row.updated_at;
  const methods = [];
  globalThis.fetch = async (address, options = {}) => {
    if (address.endsWith('/auth/v1/user'))
      return Response.json({ id: 'alice', email: 'alice@example.invalid' });
    const url = new URL(address);
    assert.equal(url.searchParams.get('user_id'), 'eq.alice');
    methods.push(options.method ?? 'GET');
    if (!options.method) return Response.json([row]);
    assert.equal(options.method, 'PATCH');
    if (url.searchParams.get('updated_at') !== `eq.${row.updated_at}`)
      return Response.json([]);
    row = JSON.parse(options.body);
    return Response.json([row]);
  };
  try {
    const store = await openProgressStore(
      new Request('https://paceprep.test/api/progress', {
        headers: { Authorization: 'Bearer valid' },
      }),
    );
    const reset = await store.remove();
    assert.deepEqual(row.progress, {
      resetAt: reset.resetAt,
      stats: {},
      history: [],
      completedSessions: 0,
    });
    assert.ok(reset.resetAt > Date.parse(initialRevision));
    await assert.rejects(
      store.write({ completedSessions: 8 }, initialRevision),
      /Progress changed/,
    );
    await store.write(
      { resetAt: reset.resetAt, completedSessions: 1 },
      reset.revision,
    );
    assert.equal(row.progress.completedSessions, 1);
    assert.equal(methods.includes('DELETE'), false);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_PUBLISHABLE_KEY;
    else process.env.SUPABASE_PUBLISHABLE_KEY = previousKey;
  }
});

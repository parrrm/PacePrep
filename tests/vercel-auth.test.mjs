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
    return new Response(null, { status: 204 });
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
    await store.write({ stats: {} });
    assert.equal(calls.length, 2);
    assert.equal(JSON.parse(calls[1].options.body).user_id, 'verified-user');
    assert.equal(
      calls[1].options.headers.Authorization,
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

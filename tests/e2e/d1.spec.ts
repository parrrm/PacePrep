import { randomUUID } from 'node:crypto';
import { test, expect, type APIRequestContext } from '@playwright/test';

// These dispatcher identities are accepted only by the owned local Sites Worker.
// They test SQL isolation, not the external dispatcher's authentication boundary.
function user() {
  const id = `d1-${randomUUID()}`;
  return {
    'oai-authenticated-user-id': id,
    'oai-authenticated-user-email': `${id}@example.invalid`,
    'X-PacePrep-Account': id,
  };
}
type Identity = ReturnType<typeof user>;
async function read(request: APIRequestContext, headers: Identity) {
  const response = await request.get('/api/progress', { headers });
  expect(response.status()).toBe(200);
  expect(response.headers()['cache-control']).toContain('no-store');
  return response.json();
}
const snapshot = (completedSessions: number) => ({
  stats: {},
  history: [],
  completedSessions,
});

test('D1 atomically arbitrates concurrent inserts and updates', async ({
  request,
}) => {
  const headers = user();
  expect(await read(request, headers)).toMatchObject({
    progress: null,
    revision: null,
  });
  for (const revision of ['absent', 'current']) {
    const before = await read(request, headers);
    const responses = await Promise.all(
      [1, 2].map((count) =>
        request.put('/api/progress', {
          headers: {
            ...headers,
            'If-Match': revision === 'absent' ? revision : before.revision,
          },
          data: snapshot(count),
        }),
      ),
    );
    expect(
      responses.map((response) => response.status()).sort((a, b) => a - b),
    ).toEqual([200, 412]);
    const winner = responses.findIndex((response) => response.status() === 200);
    const saved = await read(request, headers);
    expect(saved.progress).toEqual(snapshot(winner + 1));
    expect(saved.revision).toBe((await responses[winner].json()).revision);
    expect(Number(saved.revision)).toBeGreaterThan(Number(before.revision));
  }
});

test('D1 isolates owners and treats hostile identity text as a SQL parameter', async ({
  request,
}) => {
  const alice = user();
  const bob = user();
  // Deliberately contains SQL syntax; it must remain an ordinary owner key.
  bob['oai-authenticated-user-id'] += "'; DROP TABLE learner_progress; --";
  bob['X-PacePrep-Account'] = bob['oai-authenticated-user-id'];
  for (const [headers, count] of [
    [alice, 3],
    [bob, 7],
  ] as const) {
    const response = await request.put('/api/progress', {
      headers: { ...headers, 'If-Match': 'absent' },
      data: snapshot(count),
    });
    expect(response.status()).toBe(200);
  }
  const before = await read(request, alice);
  for (const method of ['GET', 'PUT', 'DELETE']) {
    const response = await request.fetch('/api/progress', {
      method,
      headers: {
        ...alice,
        'X-PacePrep-Account': bob['X-PacePrep-Account'],
        'If-Match': before.revision,
      },
      ...(method === 'PUT' ? { data: snapshot(99) } : {}),
    });
    expect(response.status()).toBe(409);
  }
  expect(await read(request, alice)).toEqual(before);
  expect((await read(request, bob)).progress).toEqual(snapshot(7));
  const invalid = await request.put('/api/progress', {
    headers: { ...alice, 'If-Match': before.revision },
    data: { history: 'broken' },
  });
  expect(invalid.status()).toBe(400);
  expect(await read(request, alice)).toEqual(before);
});

test('D1 reset persists a monotonic tombstone and permits only fresh revisions', async ({
  request,
}) => {
  const headers = user();
  const first = await request.put('/api/progress', {
    headers: { ...headers, 'If-Match': 'absent' },
    data: snapshot(3),
  });
  expect(first.status()).toBe(200);
  const old = await first.json();
  let previousReset = 0;
  for (let index = 0; index < 2; index++) {
    const removed = await request.delete('/api/progress', { headers });
    expect(removed.status()).toBe(200);
    const reset = await removed.json();
    expect(reset.resetAt).toBeGreaterThan(previousReset);
    previousReset = reset.resetAt;
    expect(await read(request, headers)).toMatchObject({
      revision: reset.revision,
      progress: { ...snapshot(0), resetAt: reset.resetAt },
    });
    const stale = await request.put('/api/progress', {
      headers: { ...headers, 'If-Match': old.revision },
      data: snapshot(3),
    });
    expect(stale.status()).toBe(412);
    const fresh = { ...snapshot(1), resetAt: reset.resetAt };
    const saved = await request.put('/api/progress', {
      headers: { ...headers, 'If-Match': reset.revision },
      data: fresh,
    });
    expect(saved.status()).toBe(200);
    expect((await read(request, headers)).progress).toEqual(fresh);
  }
});

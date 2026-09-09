import test from 'node:test';
import assert from 'node:assert/strict';
import { createProgressClient } from '../lib/progress-client.ts';

function backend() {
  let revision = '1';
  let value = { completedSessions: 1 };
  const calls = [];
  const transport = async (init, accountId) => {
    calls.push({
      method: init.method,
      accountId,
      revision: init.headers.get('If-Match'),
    });
    if (init.method === 'GET')
      return Response.json({
        user: { userId: accountId },
        progress: value,
        revision,
      });
    if (init.method === 'DELETE') {
      revision = String(Number(revision) + 1);
      value = { resetAt: 1000 };
      return Response.json({ deleted: true, revision, resetAt: 1000 });
    }
    if (init.headers.get('If-Match') !== (revision ?? 'absent'))
      return Response.json({}, { status: 412 });
    value = JSON.parse(init.body);
    revision = String(Number(revision ?? 0) + 1);
    return Response.json({ saved: true, revision });
  };
  return { transport, calls, value: () => value };
}
const put = (completedSessions) => ({
  method: 'PUT',
  body: JSON.stringify({ completedSessions }),
});

test('each progress client owns its revision; another screen cannot authorize a stale overwrite', async () => {
  const remote = backend();
  const a = createProgressClient('alice', remote.transport);
  const b = createProgressClient('alice', remote.transport);
  await a();
  await b();
  assert.equal((await b(put(2))).status, 200);
  assert.equal((await a(put(3))).status, 412);
  assert.deepEqual(remote.value(), { completedSessions: 2 });
  await assert.rejects(a(put(4)), /Reload and merge/);
});

test('concurrent saves serialize revisions and retain the latest snapshot', async () => {
  const remote = backend();
  const request = createProgressClient('alice', remote.transport);
  await request();
  const responses = await Promise.all([
    request(put(2)),
    request(put(3)),
    request(put(4)),
  ]);
  assert.ok(responses.every((response) => response.status === 200));
  assert.deepEqual(
    remote.calls.slice(1).map((call) => call.revision),
    ['1', '2', '3'],
  );
  assert.deepEqual(remote.value(), { completedSessions: 4 });
});

test('a successful deletion allows new progress to save without a reload', async () => {
  const remote = backend();
  const request = createProgressClient('alice', remote.transport);
  await request();
  await request({ method: 'DELETE' });
  await assert.rejects(request(put(1)), /Progress was reset/);
  assert.equal(
    (
      await request({
        method: 'PUT',
        body: JSON.stringify({ completedSessions: 1, resetAt: 1000 }),
      })
    ).status,
    200,
  );
  assert.equal(remote.calls.at(-1).revision, '2');
});

test('starting a fresh read invalidates older queued snapshots before they reach storage', async () => {
  const remote = backend();
  const request = createProgressClient('alice', remote.transport);
  await request();
  const staleSave = request(put(8));
  const refresh = request();
  await assert.rejects(staleSave, /Reload and merge/);
  await refresh;
  assert.deepEqual(
    remote.calls.map((call) => call.method),
    ['GET', 'GET'],
  );
  assert.deepEqual(remote.value(), { completedSessions: 1 });
});

test('a returned different identity and missing revision never authorize mutations', async () => {
  for (const body of [
    { user: { userId: 'bob' }, revision: '1' },
    { user: { userId: 'alice' } },
  ]) {
    let calls = 0;
    const request = createProgressClient('alice', async () => {
      calls++;
      return Response.json(body);
    });
    await assert.rejects(
      request(),
      /Account changed|Invalid cloud progress revision/,
    );
    await assert.rejects(request(put(1)), /Reload and merge/);
    assert.equal(calls, 1);
  }
});

test('a failed refresh keeps the old revision unusable and guest reads need no revision', async () => {
  let calls = 0;
  const request = createProgressClient('alice', async () =>
    ++calls === 1
      ? Response.json({ user: { userId: 'alice' }, revision: '1' })
      : new Response(null, { status: 503 }),
  );
  await request();
  assert.equal((await request()).status, 503);
  await assert.rejects(request(put(1)), /Reload and merge/);
  const guest = createProgressClient(
    null,
    async () => new Response(null, { status: 401 }),
  );
  assert.equal((await guest()).status, 401);
});

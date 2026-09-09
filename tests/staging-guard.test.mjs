import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import test from 'node:test';

const ids = [
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
];
const tokens = ['disposable-fixture-token-a', 'disposable-fixture-token-b'];

async function fixture(t, existing = false) {
  const rows = new Map(
    existing
      ? [
          [
            ids[1],
            {
              user_id: ids[1],
              progress: { completedSessions: 42 },
              created_at: '2020-01-01T00:00:00.000Z',
            },
          ],
        ]
      : [],
  );
  const calls = [];
  const server = createServer(async (request, response) => {
    const url = new URL(request.url, 'http://localhost');
    calls.push(request.method);
    response.setHeader('Content-Type', 'application/json');
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (url.pathname === '/auth/v1/user') {
      response.end(
        JSON.stringify({
          id: ids[tokens.indexOf(token)],
          role: 'authenticated',
        }),
      );
      return;
    }
    const id = url.searchParams.get('user_id')?.slice(3);
    const stamp = url.searchParams.get('created_at')?.slice(3);
    const row = rows.get(id);
    const matches = row && (!stamp || row.created_at === stamp);
    if (request.method === 'GET')
      response.end(JSON.stringify(matches ? [row] : []));
    else if (request.method === 'POST') {
      // Deliberately broken RLS: the probe must fail and clean its accidental insert.
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString());
      rows.set(body.user_id, body);
      response.statusCode = 201;
      response.end(JSON.stringify([body]));
    } else if (request.method === 'DELETE') {
      if (matches) rows.delete(id);
      response.end(JSON.stringify(matches ? [row] : []));
    } else {
      response.statusCode = 500;
      response.end('{}');
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  async function run(overrides = {}) {
    const child = spawn(
      process.execPath,
      ['scripts/verify-supabase-staging.mjs'],
      {
        env: {
          ...process.env,
          PACEPREP_RLS_TEST_URL: `http://127.0.0.1:${server.address().port}`,
          PACEPREP_RLS_TEST_PUBLIC_KEY: 'sb_publishable_fixture',
          PACEPREP_RLS_TEST_TOKEN_A: tokens[0],
          PACEPREP_RLS_TEST_TOKEN_B: tokens[1],
          PACEPREP_RLS_TEST_STAGING: '1',
          ...overrides,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    let output = '';
    child.stdout.on('data', (chunk) => {
      output += chunk;
    });
    child.stderr.on('data', (chunk) => {
      output += chunk;
    });
    const code = await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('exit', resolve);
    });
    for (const secret of tokens) assert.ok(!output.includes(secret));
    return { code, output };
  }
  return { rows, calls, run };
}

test('staging harness refuses existing learner progress before every mutation', async (t) => {
  const state = await fixture(t, true);
  const result = await state.run();
  assert.equal(result.code, 1);
  assert.match(result.output, /existing data was not overwritten/);
  assert.ok(state.calls.every((method) => method === 'GET'));
  assert.equal(state.rows.get(ids[1]).progress.completedSessions, 42);
});

test('staging harness cleans an accidental cross-owner fixture when RLS is broken', async (t) => {
  const state = await fixture(t);
  const result = await state.run();
  assert.equal(result.code, 1);
  assert.match(result.output, /Cross-owner INSERT must fail/);
  assert.ok(!result.output.includes('PASS:'));
  assert.ok(state.calls.includes('POST'));
  assert.ok(state.calls.includes('DELETE'));
  assert.equal(state.rows.size, 0);
});

test('staging harness requires explicit staging confirmation before networking', async (t) => {
  const state = await fixture(t);
  const result = await state.run({ PACEPREP_RLS_TEST_STAGING: '' });
  assert.equal(result.code, 2);
  assert.deepEqual(state.calls, []);
});

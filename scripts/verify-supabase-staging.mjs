import { randomUUID } from 'node:crypto';

// Explicit staging credentials only; never borrow app/production environment.
const names = [
  'PACEPREP_RLS_TEST_URL',
  'PACEPREP_RLS_TEST_PUBLIC_KEY',
  'PACEPREP_RLS_TEST_TOKEN_A',
  'PACEPREP_RLS_TEST_TOKEN_B',
];
const missing = names.filter((name) => !process.env[name]);
if (missing.length || process.env.PACEPREP_RLS_TEST_STAGING !== '1') {
  console.error(
    'Staging check not run. Supply two empty disposable test accounts using:',
    [...names, 'PACEPREP_RLS_TEST_STAGING=1'].join(', '),
  );
  process.exit(2);
}
function check(value, message) {
  if (!value) throw new Error(message);
}
const origin = new URL(process.env.PACEPREP_RLS_TEST_URL);
check(
  origin.protocol === 'https:' ||
    (origin.protocol === 'http:' &&
      ['localhost', '127.0.0.1'].includes(origin.hostname)),
  'Use an HTTPS staging project or local Supabase',
);
check(
  !origin.username &&
    !origin.password &&
    origin.pathname === '/' &&
    !origin.search &&
    !origin.hash,
  'Supply only the staging project origin',
);
const publicKey = process.env.PACEPREP_RLS_TEST_PUBLIC_KEY;
let publicRole;
try {
  publicRole = JSON.parse(
    Buffer.from(publicKey.split('.')[1], 'base64url').toString(),
  ).role;
} catch {
  /* Modern publishable keys are not JWTs. */
}
check(
  publicKey.startsWith('sb_publishable_') || publicRole === 'anon',
  'Only a publishable/anon key is allowed',
);
const tokens = [
  process.env.PACEPREP_RLS_TEST_TOKEN_A,
  process.env.PACEPREP_RLS_TEST_TOKEN_B,
];
const marker = new Date().toISOString();
const fixture = {
  stats: {},
  history: [],
  completedSessions: 1,
  resetAt: Date.now(),
};
// A per-run timestamp filter ensures cleanup can only remove this run's inserts.
const cleanup = [];
async function request(path, token, method = 'GET', body) {
  const response = await fetch(new URL(path, origin), {
    method,
    redirect: 'error',
    signal: AbortSignal.timeout(15_000),
    headers: {
      apikey: publicKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json().catch(() => null);
  return { status: response.status, ok: response.ok, data };
}
const table = (id, ownFixture = false) =>
  '/rest/v1/learner_progress?' +
  new URLSearchParams({
    user_id: `eq.${id}`,
    select: 'user_id,progress',
    ...(ownFixture ? { created_at: `eq.${marker}` } : {}),
  });
const denied = (result) =>
  [401, 403].includes(result.status) && result.data?.code === '42501';
try {
  const ids = [];
  for (const token of tokens) {
    const identity = await request('/auth/v1/user', token);
    check(
      identity.ok &&
        /^[0-9a-f-]{36}$/i.test(identity.data?.id || '') &&
        identity.data?.role === 'authenticated',
      'Test account token did not verify',
    );
    ids.push(identity.data.id);
  }
  check(ids[0] !== ids[1], 'Use two different disposable test accounts');
  for (let index = 0; index < 2; index++) {
    const existing = await request(table(ids[index]), tokens[index]);
    check(
      existing.ok && Array.isArray(existing.data) && existing.data.length === 0,
      'Test accounts must have no saved progress; existing data was not overwritten',
    );
  }
  for (let index = 0; index < 2; index++)
    cleanup.push({ id: ids[index], token: tokens[index] });
  // Check insert ownership while B is empty, so a unique-key error cannot mask RLS.
  const wrongOwner = await request(
    '/rest/v1/learner_progress',
    tokens[0],
    'POST',
    {
      user_id: ids[1],
      progress: fixture,
      created_at: marker,
      updated_at: marker,
    },
  );
  check(
    denied(wrongOwner),
    'Cross-owner INSERT must fail with insufficient privilege',
  );
  for (let index = 0; index < 2; index++) {
    const inserted = await request(
      '/rest/v1/learner_progress',
      tokens[index],
      'POST',
      {
        user_id: ids[index],
        progress: fixture,
        created_at: marker,
        updated_at: marker,
      },
    );
    check(
      inserted.ok && inserted.data?.length === 1,
      'Own fixture INSERT failed',
    );
  }
  for (let index = 0; index < 2; index++) {
    const own = await request(table(ids[index]), tokens[index]);
    check(
      own.ok &&
        own.data?.length === 1 &&
        own.data[0].progress?.resetAt === fixture.resetAt,
      'Own fixture SELECT failed',
    );
    const other = ids[1 - index];
    for (const method of ['GET', 'PATCH', 'DELETE']) {
      const result = await request(
        table(other),
        tokens[index],
        method,
        method === 'PATCH'
          ? { progress: { completedSessions: 99 } }
          : undefined,
      );
      check(
        result.ok && Array.isArray(result.data) && result.data.length === 0,
        `Cross-owner ${method} must affect zero rows`,
      );
    }
    const invalid = await request(table(ids[index]), tokens[index], 'PATCH', {
      progress: [],
    });
    check(
      invalid.status === 400 && invalid.data?.code === '23514',
      'Object constraint missing',
    );
    const oversized = await request(table(ids[index]), tokens[index], 'PATCH', {
      progress: { oversized: 'x'.repeat(1_000_001) },
    });
    check(
      oversized.status === 400 && oversized.data?.code === '23514',
      'Snapshot size constraint missing',
    );
    const update = await request(table(ids[index]), tokens[index], 'PATCH', {
      progress: { ...fixture, completedSessions: 2 },
    });
    check(update.ok && update.data?.length === 1, 'Own fixture UPDATE failed');
  }
  for (const method of ['GET', 'POST', 'PATCH', 'DELETE']) {
    const result = await request(
      method === 'POST' ? '/rest/v1/learner_progress' : table(ids[0]),
      null,
      method,
      method === 'POST'
        ? { user_id: randomUUID(), progress: {} }
        : method === 'PATCH'
          ? { progress: {} }
          : undefined,
    );
    check(
      denied(result),
      `Anonymous ${method} must fail with insufficient privilege`,
    );
  }
} catch (error) {
  // Never dump provider responses, account identifiers, tokens or learner JSON.
  console.error(
    error instanceof TypeError
      ? 'Staging request failed; check network/configuration.'
      : error.message,
  );
  process.exitCode = 1;
} finally {
  for (const { id, token } of cleanup) {
    try {
      const result = await request(table(id, true), token, 'DELETE');
      check(
        result.ok && Array.isArray(result.data) && result.data.length <= 1,
        'Fixture cleanup was not confirmed; inspect the two disposable accounts',
      );
      const remaining = await request(table(id, true), token);
      check(
        remaining.ok &&
          Array.isArray(remaining.data) &&
          remaining.data.length === 0,
        'Fixture cleanup was not confirmed',
      );
    } catch {
      console.error(
        'Fixture cleanup was not confirmed; inspect the two disposable accounts before rerunning.',
      );
      process.exitCode = 1;
    }
  }
}
if (!process.exitCode) {
  console.log(
    'PASS: staging identities, owner CRUD, cross-owner/anonymous isolation, JSON constraints and fixture cleanup.',
  );
}

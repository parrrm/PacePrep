import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';

const alice = '11111111-1111-4111-8111-111111111111';
const bob = '22222222-2222-4222-8222-222222222222';

test('committed Supabase migrations enforce PostgreSQL ownership and constraints', async (t) => {
  const db = await PGlite.create();
  t.after(() => db.close());
  // Only the Auth schema/session bridge is simulated. Policies, privileges,
  // constraints and queries below execute in the real PostgreSQL WASM engine.
  await db.exec(`
    CREATE ROLE anon NOLOGIN;
    CREATE ROLE authenticated NOLOGIN;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
      $$ SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    GRANT USAGE ON SCHEMA auth, public TO anon, authenticated;
    GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
  `);
  await db.query('INSERT INTO auth.users VALUES ($1), ($2)', [alice, bob]);
  const directory = new URL('../supabase/migrations/', import.meta.url);
  for (const filename of (await readdir(directory))
    .filter((name) => name.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b))) {
    await db.exec(await readFile(new URL(filename, directory), 'utf8'));
  }
  async function as(role, id, work) {
    await db.exec(role === 'anon' ? 'SET ROLE anon' : 'SET ROLE authenticated');
    await db.query("SELECT set_config('request.jwt.claim.sub', $1, false)", [
      id || '',
    ]);
    try {
      await work();
    } finally {
      await db.exec('RESET ROLE');
    }
  }
  const insert = (id, progress = {}) =>
    db.query(
      'INSERT INTO public.learner_progress (user_id, progress) VALUES ($1, $2) RETURNING user_id',
      [id, JSON.stringify(progress)],
    );
  async function rejected(work, code) {
    await db.exec('SAVEPOINT expected_failure');
    try {
      await assert.rejects(work, { code });
    } finally {
      await db.exec(
        'ROLLBACK TO SAVEPOINT expected_failure; RELEASE SAVEPOINT expected_failure',
      );
    }
  }
  const denied = (work) => rejected(work, '42501');

  await insert(alice, { completedSessions: 1 });
  await insert(bob, { completedSessions: 1 });
  t.beforeEach(() => db.exec('BEGIN'));
  t.afterEach(() => db.exec('ROLLBACK'));

  await t.test('owners create, read and update only their row', async () => {
    await db.exec('DELETE FROM public.learner_progress');
    for (const id of [alice, bob]) {
      await as('authenticated', id, async () => {
        assert.equal((await insert(id)).rows.length, 1);
        assert.deepEqual(
          (await db.query('SELECT user_id FROM public.learner_progress')).rows,
          [{ user_id: id }],
        );
        assert.equal(
          (
            await db.query(
              'UPDATE public.learner_progress SET progress = $1 WHERE user_id = $2 RETURNING user_id',
              ['{"completedSessions":1}', id],
            )
          ).rows.length,
          1,
        );
      });
    }
  });
  await t.test(
    'cross-owner CRUD and owner reassignment are denied',
    async () => {
      await as('authenticated', alice, async () => {
        assert.equal(
          (
            await db.query(
              'SELECT * FROM public.learner_progress WHERE user_id = $1',
              [bob],
            )
          ).rows.length,
          0,
        );
        await denied(() => insert(bob));
        assert.equal(
          (
            await db.query(
              'UPDATE public.learner_progress SET progress = $1 WHERE user_id = $2 RETURNING user_id',
              ['{}', bob],
            )
          ).rows.length,
          0,
        );
        assert.equal(
          (
            await db.query(
              'DELETE FROM public.learner_progress WHERE user_id = $1 RETURNING user_id',
              [bob],
            )
          ).rows.length,
          0,
        );
        await denied(() =>
          db.query(
            'UPDATE public.learner_progress SET user_id = $1 WHERE user_id = $2',
            [bob, alice],
          ),
        );
      });
      await as('authenticated', bob, async () => {
        assert.deepEqual(
          (await db.query('SELECT progress FROM public.learner_progress')).rows,
          [{ progress: { completedSessions: 1 } }],
        );
      });
    },
  );
  await t.test(
    'anonymous CRUD and authenticated TRUNCATE are denied',
    async () => {
      await as('anon', null, async () => {
        await denied(() => db.query('SELECT * FROM public.learner_progress'));
        await denied(() => insert(alice));
        await denied(() =>
          db.query('UPDATE public.learner_progress SET progress = $1', ['{}']),
        );
        await denied(() => db.query('DELETE FROM public.learner_progress'));
      });
      await as('authenticated', alice, async () => {
        await denied(() => db.exec('TRUNCATE public.learner_progress'));
      });
      await as('authenticated', null, async () => {
        assert.equal(
          (await db.query('SELECT * FROM public.learner_progress')).rows.length,
          0,
        );
        await denied(() => insert(alice));
      });
    },
  );
  await t.test(
    'database rejects non-object and oversized snapshots without altering saved data',
    async () => {
      await as('authenticated', alice, async () => {
        for (const invalid of [
          '[]',
          JSON.stringify({ oversized: 'x'.repeat(1_000_001) }),
        ]) {
          await rejected(
            () =>
              db.query(
                'UPDATE public.learner_progress SET progress = $1 WHERE user_id = $2',
                [invalid, alice],
              ),
            '23514',
          );
        }
        assert.deepEqual(
          (await db.query('SELECT progress FROM public.learner_progress')).rows,
          [{ progress: { completedSessions: 1 } }],
        );
      });
    },
  );
  await t.test(
    'owner deletion and Auth-user cascade preserve other owners',
    async () => {
      await as('authenticated', alice, async () => {
        assert.equal(
          (
            await db.query(
              'DELETE FROM public.learner_progress WHERE user_id = $1 RETURNING user_id',
              [alice],
            )
          ).rows.length,
          1,
        );
      });
      assert.deepEqual(
        (await db.query('SELECT user_id FROM public.learner_progress')).rows,
        [{ user_id: bob }],
      );
      await db.query('DELETE FROM auth.users WHERE id = $1', [bob]);
      assert.equal(
        (await db.query('SELECT * FROM public.learner_progress')).rows.length,
        0,
      );
    },
  );
});

import type { ProgressStore } from './progress-types';
import { ProgressConflict } from './progress-conflict.ts';

export async function openProgressStore(
  request: Request,
): Promise<ProgressStore | null> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const authorization = request.headers.get('authorization');
  if (!url || !key || !authorization || !/^Bearer [^\s]+$/i.test(authorization))
    return null;
  const headers = { apikey: key, Authorization: authorization };
  // Verify every request. Never trust a client user ID, an unverified JWT, or
  // the legacy Sites identity headers. Database requests also enforce RLS.
  const identity = await fetch(`${url}/auth/v1/user`, {
    headers,
    cache: 'no-store',
    signal: AbortSignal.any([request.signal, AbortSignal.timeout(10_000)]),
  });
  if (identity.status === 401 || identity.status === 403) return null;
  if (!identity.ok) throw new Error('Authentication service unavailable');
  const account = (await identity.json()) as {
    id?: unknown;
    email?: unknown;
    user_metadata?: { full_name?: unknown };
  };
  if (
    typeof account.id !== 'string' ||
    !account.id ||
    typeof account.email !== 'string'
  )
    return null;
  const user = {
    userId: account.id,
    email: account.email,
    fullName:
      typeof account.user_metadata?.full_name === 'string'
        ? account.user_metadata.full_name
        : null,
    displayName: account.email,
  };
  user.displayName = user.fullName || user.email;
  const endpoint = `${url}/rest/v1/learner_progress`;
  const ownRecord = `${endpoint}?user_id=eq.${encodeURIComponent(user.userId)}`;
  async function query(path: string, init: RequestInit = {}) {
    const queryHeaders = new Headers(headers);
    queryHeaders.set('Content-Type', 'application/json');
    new Headers(init.headers).forEach((value, key) =>
      queryHeaders.set(key, value),
    );
    const response = await fetch(path, {
      ...init,
      cache: 'no-store',
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(10_000)]),
      headers: queryHeaders,
    });
    if (response.status === 409) throw new ProgressConflict();
    if (!response.ok) throw new Error('Progress storage unavailable');
    return response;
  }
  const store: ProgressStore = {
    user,
    async read() {
      const response = await query(
        `${ownRecord}&select=progress,updated_at&limit=1`,
      );
      const records = (await response.json()) as Array<{
        progress: unknown;
        updated_at: string;
      }>;
      const record = Array.isArray(records) ? records[0] : undefined;
      return {
        progress: record?.progress ?? null,
        updatedAt: record?.updated_at ? Date.parse(record.updated_at) : null,
        revision: record?.updated_at ?? null,
      };
    },
    async write(progress, expectedRevision) {
      const now = Math.max(
        Date.now(),
        expectedRevision ? Date.parse(expectedRevision) + 1 : 0,
      );
      const revision = new Date(now).toISOString();
      const response = await query(
        expectedRevision === null
          ? endpoint
          : `${ownRecord}&updated_at=eq.${encodeURIComponent(expectedRevision)}`,
        {
          method: expectedRevision === null ? 'POST' : 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify({
            user_id: user.userId,
            progress,
            updated_at: revision,
          }),
        },
      );
      const rows = await response.json();
      if (!Array.isArray(rows) || rows.length !== 1)
        throw new ProgressConflict();
      return { updatedAt: now, revision };
    },
    async remove() {
      const previous = await store.read();
      const resetAt = Math.max(Date.now(), (previous.updatedAt ?? 0) + 1);
      const saved = await store.write(
        { resetAt, stats: {}, history: [], completedSessions: 0 },
        previous.revision,
      );
      return { ...saved, resetAt };
    },
  };
  return store;
}

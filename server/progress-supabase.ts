import type { ProgressStore } from './progress-types';

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
  if (!url || !key || !authorization?.startsWith('Bearer ')) return null;
  const headers = { apikey: key, Authorization: authorization };
  // Verify every request. Never trust a client user ID, an unverified JWT, or
  // the legacy Sites identity headers. Database requests also enforce RLS.
  const identity = await fetch(`${url}/auth/v1/user`, {
    headers,
    cache: 'no-store',
  });
  if (identity.status === 401 || identity.status === 403) return null;
  if (!identity.ok) throw new Error('Authentication service unavailable');
  const account = (await identity.json()) as {
    id?: unknown;
    email?: unknown;
    user_metadata?: { full_name?: unknown };
  };
  if (typeof account.id !== 'string' || typeof account.email !== 'string')
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
    const response = await fetch(path, {
      ...init,
      cache: 'no-store',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });
    if (!response.ok) throw new Error('Progress storage unavailable');
    return response;
  }
  return {
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
      };
    },
    async write(progress) {
      const now = Date.now();
      await query(`${endpoint}?on_conflict=user_id`, {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({
          user_id: user.userId,
          progress,
          updated_at: new Date(now).toISOString(),
        }),
      });
      return now;
    },
    async remove() {
      await query(ownRecord, { method: 'DELETE' });
    },
  };
}

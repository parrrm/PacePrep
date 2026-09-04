import type { SupabaseClient } from '@supabase/supabase-js';
import { cloudAuthReady, onVercel } from './hosting';
import {
  assertProgressAccount,
  prepareAccountStorage as prepareStorage,
} from './account-storage';

let client: Promise<SupabaseClient> | undefined;
export function getAuthClient() {
  if (!cloudAuthReady)
    throw new Error(
      'Cloud sign-in is not configured yet. Guest practice is available.',
    );
  client ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(__PACEPREP_SUPABASE_URL__, __PACEPREP_SUPABASE_KEY__, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }),
  );
  return client;
}

export async function getProgressAccount() {
  if (!cloudAuthReady) return null;
  const client = await getAuthClient();
  const {
    data: { session },
    error,
  } = await client.auth.getSession();
  if (error) throw error;
  return session?.user.id ?? null;
}

export async function progressRequest(
  init: RequestInit = {},
  expectedAccountId?: string | null,
) {
  const headers = new Headers(init.headers);
  if (onVercel) {
    const auth = cloudAuthReady ? await getAuthClient() : null;
    const result = auth ? await auth.auth.getSession() : null;
    if (result?.error) throw result.error;
    const session = result?.data.session ?? null;
    assertProgressAccount(expectedAccountId, session?.user.id ?? null);
    headers.delete('Authorization');
    if (session) headers.set('Authorization', `Bearer ${session.access_token}`);
  }
  return fetch('/api/progress', { ...init, headers, cache: 'no-store' });
}

export function prepareAccountStorage(userId: string) {
  prepareStorage(userId, localStorage);
}

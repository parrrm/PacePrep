import type { ProgressStore } from './progress-types';
import { isSavedProgress } from '../lib/progress-validation.ts';

export const MAX_PROGRESS_BYTES = 900_000;
export const PROGRESS_ACCOUNT_HEADER = 'X-PacePrep-Account';

function privateJson(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('Cache-Control', 'private, no-store');
  headers.set('Vary', 'Cookie, Authorization, X-PacePrep-Account');
  return Response.json(body, { ...init, headers });
}

function crossOrigin(request: Request) {
  const origin = request.headers.get('origin');
  return (origin !== null && origin !== new URL(request.url).origin) ||
    request.headers.get('sec-fetch-site') === 'cross-site';
}

// A stream limit also covers chunked bodies; Content-Length is only an early exit.
async function readBody(request: Request): Promise<string | null> {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > MAX_PROGRESS_BYTES) return null;
  if (!request.body) return '';
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let size = 0;
  let raw = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_PROGRESS_BYTES) {
        void reader.cancel().catch(() => {});
        return null;
      }
      raw += decoder.decode(value, { stream: true });
    }
    return raw + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}

/** Shared HTTP boundary for both hosting adapters, with a testable store boundary. */
export function createProgressHandlers(openStore: (request: Request) => Promise<ProgressStore | null>) {
  async function storeFor(request: Request) {
    const store = await openStore(request);
    if (!store) return privateJson({ authenticated: false, error: 'Authentication required' }, { status: 401 });
    const expected = request.headers.get(PROGRESS_ACCOUNT_HEADER);
    if (expected !== null && expected !== store.user.userId)
      return privateJson({ error: 'Account changed. Reload before syncing progress.' }, { status: 409 });
    return store;
  }
  return {
    async GET(request: Request) {
      try {
        const store = await storeFor(request);
        if (store instanceof Response) return store;
        if (new URL(request.url).searchParams.get('identity') === '1')
          return privateJson({ authenticated: true, user: store.user });
        const saved = await store.read();
        if (saved.progress !== null && !isSavedProgress(saved.progress))
          return privateJson({ error: 'Saved cloud progress needs recovery. Local progress is preserved.' }, { status: 503 });
        return privateJson({ authenticated: true, user: store.user, ...saved });
      } catch {
        return privateJson({ error: 'Cloud progress unavailable. Your local progress is preserved.' }, { status: 503 });
      }
    },
    async PUT(request: Request) {
      if (crossOrigin(request))
        return privateJson({ error: 'Cross-origin write rejected' }, { status: 403 });
      if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json')
        return privateJson({ error: 'JSON payload required' }, { status: 415 });
      try {
        const store = await storeFor(request);
        if (store instanceof Response) return store;
        let raw: string | null;
        try { raw = await readBody(request); }
        catch { return privateJson({ error: 'Invalid progress payload' }, { status: 400 }); }
        if (raw === null) return privateJson({ error: 'Progress payload is too large' }, { status: 413 });
        let body: unknown;
        try { body = JSON.parse(raw); }
        catch { return privateJson({ error: 'Invalid progress payload' }, { status: 400 }); }
        if (!isSavedProgress(body))
          return privateJson({ error: 'Invalid progress payload' }, { status: 400 });
        return privateJson({ saved: true, updatedAt: await store.write(body) });
      } catch {
        return privateJson({ error: 'Cloud save unavailable. Your local progress is preserved.' }, { status: 503 });
      }
    },
    async DELETE(request: Request) {
      if (crossOrigin(request))
        return privateJson({ error: 'Cross-origin write rejected' }, { status: 403 });
      try {
        const store = await storeFor(request);
        if (store instanceof Response) return store;
        await store.remove();
        return privateJson({ deleted: true });
      } catch {
        return privateJson({ error: 'Could not delete cloud progress. Please retry.' }, { status: 503 });
      }
    },
  };
}

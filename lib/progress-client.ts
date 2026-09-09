/** A revision belongs to one hydrated snapshot stream, not every tab or screen
 * for an account. Otherwise an unrelated GET can authorize stale local data. */
export function createProgressClient(
  accountId: string | null,
  transport: (init: RequestInit, accountId: string | null) => Promise<Response>,
) {
  let revision: string | null | undefined;
  let resetAt = 0;
  let generation = 0;
  let pending: Promise<unknown> = Promise.resolve();
  return (init: RequestInit = {}): Promise<Response> => {
    const method = (init.method ?? 'GET').toUpperCase();
    if (method === 'GET' || method === 'DELETE') {
      generation++;
      revision = undefined;
    }
    const requestGeneration = generation;
    const execute = async () => {
      const headers = new Headers(init.headers);
      if (method === 'PUT') {
        if (revision === undefined || requestGeneration !== generation)
          throw new Error('Reload and merge progress before saving');
        if (
          typeof init.body !== 'string' ||
          (JSON.parse(init.body).resetAt ?? 0) !== resetAt
        )
          throw new Error('Progress was reset. Reload before saving');
        headers.set('If-Match', revision ?? 'absent');
      }
      const response = await transport({ ...init, method, headers }, accountId);
      if (requestGeneration !== generation) return response;
      if (!response.ok) {
        if (
          method === 'GET' ||
          response.status === 401 ||
          response.status === 409 ||
          response.status === 412
        )
          revision = undefined;
        return response;
      }
      if (method === 'DELETE') {
        const payload = (await response.clone().json()) as {
          revision?: unknown;
          resetAt?: unknown;
        };
        if (
          typeof payload.revision !== 'string' ||
          typeof payload.resetAt !== 'number' ||
          !Number.isSafeInteger(payload.resetAt)
        )
          throw new Error('Invalid cloud reset response');
        revision = payload.revision;
        resetAt = payload.resetAt;
      } else {
        const payload = (await response.clone().json()) as {
          user?: { userId?: unknown };
          revision?: unknown;
          progress?: { resetAt?: number };
        };
        if (method === 'GET' && payload.user?.userId !== accountId)
          throw new Error('Account changed. Reload before syncing progress.');
        if (payload.revision !== null && typeof payload.revision !== 'string')
          throw new Error('Invalid cloud progress revision');
        revision = payload.revision;
        if (method === 'GET') resetAt = payload.progress?.resetAt ?? 0;
      }
      return response;
    };
    const result = pending.then(execute, execute);
    pending = result.catch(() => {});
    return result;
  };
}

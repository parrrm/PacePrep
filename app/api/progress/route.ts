import { openProgressStore } from 'paceprep:progress-store';

export const dynamic = 'force-dynamic';

function privateJson(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('Cache-Control', 'private, no-store');
  headers.set('Vary', 'Cookie, Authorization');
  return Response.json(body, { ...init, headers });
}

export async function GET(request: Request) {
  try {
    const store = await openProgressStore(request);
    if (!store) return privateJson({ authenticated: false }, { status: 401 });
    return privateJson({
      authenticated: true,
      user: store.user,
      ...(await store.read()),
    });
  } catch {
    return privateJson(
      {
        error: 'Cloud progress unavailable. Your local progress is preserved.',
      },
      { status: 503 },
    );
  }
}

function crossOrigin(request: Request) {
  const origin = request.headers.get('origin');
  return origin !== null && origin !== new URL(request.url).origin;
}

export async function PUT(request: Request) {
  if (crossOrigin(request))
    return privateJson(
      { error: 'Cross-origin write rejected' },
      { status: 403 },
    );
  try {
    const store = await openProgressStore(request);
    if (!store)
      return privateJson({ error: 'Authentication required' }, { status: 401 });
    if (!request.headers.get('content-type')?.includes('application/json'))
      return privateJson({ error: 'JSON payload required' }, { status: 415 });
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 900_000)
      return privateJson(
        { error: 'Progress payload is too large' },
        { status: 413 },
      );
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return privateJson(
        { error: 'Invalid progress payload' },
        { status: 400 },
      );
    }
    if (!body || typeof body !== 'object' || Array.isArray(body))
      return privateJson(
        { error: 'Invalid progress payload' },
        { status: 400 },
      );
    return privateJson({ saved: true, updatedAt: await store.write(body) });
  } catch {
    return privateJson(
      { error: 'Cloud save unavailable. Your local progress is preserved.' },
      { status: 503 },
    );
  }
}

export async function DELETE(request: Request) {
  if (crossOrigin(request))
    return privateJson(
      { error: 'Cross-origin write rejected' },
      { status: 403 },
    );
  try {
    const store = await openProgressStore(request);
    if (!store)
      return privateJson({ error: 'Authentication required' }, { status: 401 });
    await store.remove();
    return privateJson({ deleted: true });
  } catch {
    return privateJson(
      { error: 'Could not delete cloud progress. Please retry.' },
      { status: 503 },
    );
  }
}

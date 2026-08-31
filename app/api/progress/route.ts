import { eq } from 'drizzle-orm';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { learnerProgress } from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ authenticated: false }, { status: 401 });

  const db = await getDb();
  const [record] = await db
    .select({ progressJson: learnerProgress.progressJson, updatedAt: learnerProgress.updatedAt })
    .from(learnerProgress)
    .where(eq(learnerProgress.userId, user.userId))
    .limit(1);

  let progress: unknown = null;
  if (record?.progressJson) {
    try {
      progress = JSON.parse(record.progressJson);
    } catch {
      progress = null;
    }
  }
  return Response.json({ authenticated: true, user, progress, updatedAt: record?.updatedAt ?? null });
}

export async function PUT(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object')
    return Response.json({ error: 'Invalid progress payload' }, { status: 400 });
  const progressJson = JSON.stringify(body);
  if (progressJson.length > 900_000)
    return Response.json({ error: 'Progress payload is too large' }, { status: 413 });

  const db = await getDb();
  const now = Date.now();
  await db
    .insert(learnerProgress)
    .values({ userId: user.userId, email: user.email, progressJson, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: learnerProgress.userId,
      set: { email: user.email, progressJson, updatedAt: now },
    });
  return Response.json({ saved: true, updatedAt: now });
}

export async function DELETE() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });

  const db = await getDb();
  await db.delete(learnerProgress).where(eq(learnerProgress.userId, user.userId));
  return Response.json({ deleted: true });
}

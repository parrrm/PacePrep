// Sites adapter. Vercel replaces this module at build time, never trusting
// externally supplied OpenAI identity headers outside the Sites dispatcher.
import { and, eq } from 'drizzle-orm';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { learnerProgress } from '@/db/schema';
import type { ProgressStore } from './progress-types';
import { ProgressConflict } from './progress-conflict.ts';

export async function openProgressStore(
  _request: Request,
): Promise<ProgressStore | null> {
  const user = await getChatGPTUser();
  if (!user) return null;
  const db = await getDb();
  const store: ProgressStore = {
    user,
    async read() {
      const [record] = await db
        .select()
        .from(learnerProgress)
        .where(eq(learnerProgress.userId, user.userId))
        .limit(1);
      let progress: unknown = null;
      try {
        progress = record ? JSON.parse(record.progressJson) : null;
      } catch {
        throw new Error('Saved progress needs recovery');
      }
      return {
        progress,
        updatedAt: record?.updatedAt ?? null,
        revision: record ? String(record.updatedAt) : null,
      };
    },
    async write(progress, expectedRevision) {
      const now = Math.max(
        Date.now(),
        expectedRevision ? Number(expectedRevision) + 1 : 0,
      );
      const progressJson = JSON.stringify(progress);
      const rows =
        expectedRevision === null
          ? await db
              .insert(learnerProgress)
              .values({
                userId: user.userId,
                email: user.email,
                progressJson,
                createdAt: now,
                updatedAt: now,
              })
              .onConflictDoNothing()
              .returning({ id: learnerProgress.userId })
          : await db
              .update(learnerProgress)
              .set({ email: user.email, progressJson, updatedAt: now })
              .where(
                and(
                  eq(learnerProgress.userId, user.userId),
                  eq(learnerProgress.updatedAt, Number(expectedRevision)),
                ),
              )
              .returning({ id: learnerProgress.userId });
      if (rows.length !== 1) throw new ProgressConflict();
      return { updatedAt: now, revision: String(now) };
    },
    async remove() {
      // Keep a minimal reset marker so an offline device cannot recreate deleted
      // history when it next merges with the server. Reading only the revision
      // also allows a learner to reset a corrupt old progress record.
      const [record] = await db
        .select({ updatedAt: learnerProgress.updatedAt })
        .from(learnerProgress)
        .where(eq(learnerProgress.userId, user.userId))
        .limit(1);
      const resetAt = Math.max(Date.now(), (record?.updatedAt ?? 0) + 1);
      const saved = await store.write(
        { resetAt, stats: {}, history: [], completedSessions: 0 },
        record ? String(record.updatedAt) : null,
      );
      return { ...saved, resetAt };
    },
  };
  return store;
}

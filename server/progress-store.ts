// Sites adapter. Vercel replaces this module at build time, never trusting
// externally supplied OpenAI identity headers outside the Sites dispatcher.
import { eq } from 'drizzle-orm';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { learnerProgress } from '@/db/schema';
import type { ProgressStore } from './progress-types';

export async function openProgressStore(
  _request: Request,
): Promise<ProgressStore | null> {
  const user = await getChatGPTUser();
  if (!user) return null;
  const db = await getDb();
  return {
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
        /* corrupted legacy record */
      }
      return { progress, updatedAt: record?.updatedAt ?? null };
    },
    async write(progress) {
      const now = Date.now();
      const progressJson = JSON.stringify(progress);
      await db
        .insert(learnerProgress)
        .values({
          userId: user.userId,
          email: user.email,
          progressJson,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: learnerProgress.userId,
          set: { email: user.email, progressJson, updatedAt: now },
        });
      return now;
    },
    async remove() {
      await db
        .delete(learnerProgress)
        .where(eq(learnerProgress.userId, user.userId));
    },
  };
}

import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

let initialized = false;

export async function getDb() {
  if (!env.DB) throw new Error('Cloud progress storage is unavailable.');
  if (!initialized) {
    await env.DB.batch([
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS learner_progress (
        user_id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        progress_json TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`),
      env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_learner_progress_updated_at ON learner_progress(updated_at)'),
    ]);
    initialized = true;
  }
  return drizzle(env.DB, { schema });
}

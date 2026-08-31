import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const learnerProgress = sqliteTable(
  'learner_progress',
  {
    userId: text('user_id').primaryKey(),
    email: text('email').notNull(),
    progressJson: text('progress_json').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [index('idx_learner_progress_updated_at').on(table.updatedAt)],
);

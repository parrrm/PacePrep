export type ProgressStat = {
  attempts: number;
  correct: number;
  total: number;
  best: number;
  recent: boolean[];
  last: number;
  box?: number;
  intervalDays?: number;
  dueAt?: number;
  lapses?: number;
};

export type ProgressAttempt = {
  id: string;
  topic: string;
  q: string;
  a: string;
  correct: boolean;
  skipped?: boolean;
  raw?: string;
  ms: number;
  at: number;
  sessionId?: string;
  answerMode?: 'mcq' | 'typed';
};

export type SavedProgress = {
  stats?: Record<string, ProgressStat>;
  history?: ProgressAttempt[];
  completedSessions?: number;
  dark?: boolean;
  input?: 'mcq' | 'typed';
};

const unsafeKeys = new Set(['__proto__', 'prototype', 'constructor']);
function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function number(value: unknown, integer = false): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 &&
    value <= Number.MAX_SAFE_INTEGER && (!integer || Number.isInteger(value));
}
function text(value: unknown, max = 1000): value is string {
  return typeof value === 'string' && value.length <= max;
}
function optional(value: unknown, check: (value: unknown) => boolean) {
  return value === undefined || check(value);
}
function stat(value: unknown): value is ProgressStat {
  if (!record(value)) return false;
  return number(value.attempts, true) && number(value.correct, true) &&
    value.correct <= value.attempts && number(value.total) && number(value.best) &&
    number(value.last, true) && Array.isArray(value.recent) &&
    value.recent.length <= 6 && value.recent.every((item) => typeof item === 'boolean') &&
    optional(value.box, (item) => number(item, true) && item >= 1 && item <= 5) &&
    optional(value.intervalDays, (item) => number(item) && item <= 30) &&
    optional(value.dueAt, (item) => number(item, true)) &&
    optional(value.lapses, (item) => number(item, true) && item <= (value.attempts as number));
}
function attempt(value: unknown): value is ProgressAttempt {
  return record(value) && text(value.id, 200) && value.id.length > 0 &&
    !unsafeKeys.has(value.id) && text(value.topic, 100) && value.topic.length > 0 &&
    text(value.q) && text(value.a) && typeof value.correct === 'boolean' &&
    number(value.ms) && number(value.at, true) &&
    optional(value.skipped, (item) => typeof item === 'boolean') &&
    optional(value.raw, (item) => text(item)) &&
    optional(value.sessionId, (item) => text(item, 200)) &&
    optional(value.answerMode, (item) => item === 'mcq' || item === 'typed');
}

/** Validate data before it reaches the learning engine, regardless of its source. */
export function isSavedProgress(value: unknown): value is SavedProgress {
  if (!record(value)) return false;
  const allowed = new Set(['stats', 'history', 'completedSessions', 'dark', 'input']);
  if (Object.keys(value).some((key) => !allowed.has(key))) return false;
  return optional(value.stats, (items) => record(items) &&
    Object.keys(items).length <= 10000 && Object.entries(items).every(([key, item]) =>
      key.length > 0 && key.length <= 200 && !unsafeKeys.has(key) && stat(item))) &&
    optional(value.history, (items) => Array.isArray(items) && items.length <= 1500 && items.every(attempt)) &&
    optional(value.completedSessions, (item) => number(item, true)) &&
    optional(value.dark, (item) => typeof item === 'boolean') &&
    optional(value.input, (item) => item === 'mcq' || item === 'typed');
}

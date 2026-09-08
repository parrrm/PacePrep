/** Shared scheduling and snapshot merging for recall and mental operations. */
export const DAY_MS = 86_400_000;
const LEITNER_INTERVALS = [0, 1, 3, 7, 14, 30];

export type Stat = {
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

export type SavedProgress<T extends ProgressAttempt = ProgressAttempt> = {
  stats?: Record<string, Stat>;
  history?: T[];
  completedSessions?: number;
  dark?: boolean;
  input?: 'mcq' | 'typed';
};

export function updateStat(
  old: Stat | undefined,
  correct: boolean,
  ms: number,
  now = Date.now(),
): Stat {
  const current = old ?? {
    attempts: 0,
    correct: 0,
    total: 0,
    best: 0,
    recent: [],
    last: 0,
    box: 0,
    lapses: 0,
  };
  const elapsed = Number.isFinite(ms) ? Math.max(0, ms) : 0;
  const at = Number.isFinite(now) ? Math.max(0, now) : Date.now();
  const previousBox = Math.max(0, Math.min(5, Math.floor(current.box ?? 0)));
  const outOfOrder = at < current.last;
  const earlyReview = !!current.dueAt && current.dueAt > at;
  // A correct answer to a new/relearning fact earns one day. Further tiers
  // require successful reviews when due, rather than repeated same-day clicks.
  const nextBox = correct
    ? earlyReview || outOfOrder
      ? previousBox
      : Math.min(5, (current.intervalDays === 0 ? 0 : previousBox) + 1)
    : 1;
  const intervalDays = correct ? LEITNER_INTERVALS[nextBox] : 0;
  const schedule = outOfOrder || (correct && earlyReview)
    ? {
        box: current.box,
        intervalDays: current.intervalDays,
        dueAt: current.dueAt,
      }
    : {
        box: nextBox,
        intervalDays,
        dueAt: correct ? at + intervalDays * DAY_MS : at + 10 * 60_000,
      };
  return {
    attempts: current.attempts + 1,
    correct: current.correct + (correct ? 1 : 0),
    total: current.total + elapsed,
    best: current.best ? Math.min(current.best, elapsed) : elapsed,
    recent: outOfOrder ? current.recent : [...current.recent.slice(-5), correct],
    last: Math.max(current.last, at),
    ...schedule,
    lapses: (current.lapses ?? 0) + (correct ? 0 : 1),
  };
}

export function tryKey(item: ProgressAttempt) {
  return `${item.id}|${item.at}|${item.ms}|${item.raw ?? ''}|${item.skipped ? 1 : 0}`;
}

function uniqueHistory<T extends ProgressAttempt>(history: T[]) {
  return [...new Map(history.map((item) => [tryKey(item), item])).values()]
    .sort((a, b) => a.at - b.at);
}

export function mergeProgress<T extends ProgressAttempt>(
  local: SavedProgress<T>,
  cloud: SavedProgress<T> | null,
): SavedProgress<T> {
  if (!cloud) return local;
  const cloudHistory = uniqueHistory(cloud.history ?? []);
  const localHistory = uniqueHistory(local.history ?? []);
  const known = new Set(cloudHistory.map(tryKey));
  const extraLocal = localHistory.filter((item) => !known.has(tryKey(item)));
  const mergedStats = { ...cloud.stats };
  const cloudVisibleCounts = new Map<string, number>();
  for (const item of cloudHistory)
    cloudVisibleCounts.set(item.id, (cloudVisibleCounts.get(item.id) ?? 0) + 1);
  const cloudHistoryStart = cloudHistory[0]?.at ?? Infinity;
  const localOnlyStats = new Set<string>();
  for (const [id, stat] of Object.entries(local.stats ?? {})) {
    if (!mergedStats[id]) {
      mergedStats[id] = stat;
      localOnlyStats.add(id);
    }
  }
  for (const item of extraLocal) {
    if (localOnlyStats.has(item.id)) continue;
    const cloudStat = cloud.stats?.[item.id];
    // Old snapshots may retain attempts already folded into the cloud totals
    // but dropped from its bounded history. Do not count those again.
    const outsideRetainedHistory = cloudStat &&
      cloudStat.attempts > (cloudVisibleCounts.get(item.id) ?? 0) &&
      item.at < cloudHistoryStart && item.at <= cloudStat.last;
    if (outsideRetainedHistory) continue;
    mergedStats[item.id] = updateStat(
      mergedStats[item.id], item.correct && !item.skipped, item.ms, item.at,
    );
  }
  // Repair a history-only cloud snapshot instead of silently losing its stats.
  for (const item of cloudHistory) {
    if (cloud.stats?.[item.id]) continue;
    if (localOnlyStats.has(item.id)) {
      if (localHistory.some((localItem) => tryKey(localItem) === tryKey(item))) continue;
      if (item.at <= (local.stats?.[item.id]?.last ?? 0)) continue;
    }
    mergedStats[item.id] = updateStat(
      mergedStats[item.id], item.correct && !item.skipped, item.ms, item.at,
    );
  }
  const history = uniqueHistory([...cloudHistory, ...extraLocal]).slice(-1500);
  const observedSessions = new Set(history.map((item) => item.sessionId).filter(Boolean)).size;
  return {
    stats: mergedStats,
    history,
    completedSessions: Math.max(
      cloud.completedSessions ?? 0,
      local.completedSessions ?? 0,
      // Only count known finished sessions: individual attempts also carry a
      // session id before that session is complete.
      Math.min(observedSessions, (cloud.completedSessions ?? 0) + (local.completedSessions ?? 0)),
    ),
    dark: local.dark ?? cloud.dark,
    input: local.input ?? cloud.input,
  };
}

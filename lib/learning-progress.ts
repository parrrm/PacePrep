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
  resetAt?: number;
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
  const schedule =
    outOfOrder || (correct && earlyReview)
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
    recent: outOfOrder
      ? current.recent
      : [...current.recent.slice(-5), correct],
    last: Math.max(current.last, at),
    ...schedule,
    lapses: (current.lapses ?? 0) + (correct ? 0 : 1),
  };
}

export function tryKey(item: ProgressAttempt) {
  return JSON.stringify([
    item.id,
    item.at,
    item.ms,
    item.raw ?? '',
    !!item.skipped,
  ]);
}

function uniqueHistory<T extends ProgressAttempt>(history: T[]) {
  return [
    ...new Map(history.map((item) => [tryKey(item), item])).values(),
  ].sort((a, b) => a.at - b.at);
}

export function mergeProgress<T extends ProgressAttempt>(
  local: SavedProgress<T>,
  cloud: SavedProgress<T> | null,
): SavedProgress<T> {
  if (!cloud) return local;
  // A reset is an explicit generation boundary, independent of device clocks.
  // Never revive an older snapshot even when its attempt timestamps are newer.
  if ((cloud.resetAt ?? 0) > (local.resetAt ?? 0)) return cloud;
  if ((local.resetAt ?? 0) > (cloud.resetAt ?? 0)) return local;
  const cloudHistory = uniqueHistory(cloud.history ?? []);
  const localHistory = uniqueHistory(local.history ?? []);
  const history = uniqueHistory([...cloudHistory, ...localHistory]);
  const group = (items: T[]) => {
    const result = new Map<string, T[]>();
    for (const item of items) {
      const previous = result.get(item.id) ?? [];
      previous.push(item);
      result.set(item.id, previous);
    }
    return result;
  };
  const cloudByFact = group(cloudHistory);
  const localByFact = group(localHistory);
  const allByFact = group(history);
  const ids = new Set([
    ...Object.keys(cloud.stats ?? {}),
    ...Object.keys(local.stats ?? {}),
    ...allByFact.keys(),
  ]);
  const mergedStats: Record<string, Stat> = {};
  for (const id of ids) {
    const cloudStat = cloud.stats?.[id];
    const localStat = local.stats?.[id];
    const cloudItems = cloudByFact.get(id) ?? [];
    const localItems = localByFact.get(id) ?? [];
    const allItems = allByFact.get(id) ?? [];
    const cloudUnseen = Math.max(
      0,
      (cloudStat?.attempts ?? 0) - cloudItems.length,
    );
    const localUnseen = Math.max(
      0,
      (localStat?.attempts ?? 0) - localItems.length,
    );
    if (!cloudUnseen && !localUnseen) {
      // Complete ledgers can be replayed in order. This also reconciles the
      // review schedule when an offline miss predates a newer cloud answer.
      for (const item of allItems)
        mergedStats[id] = updateStat(
          mergedStats[id],
          item.correct && !item.skipped,
          item.ms,
          item.at,
        );
      continue;
    }
    // Keep the aggregate with the largest retained prefix when old attempts
    // have been compacted out of history, then add only provably new events.
    const useLocal = !cloudStat || (localStat && localUnseen > cloudUnseen);
    const base = useLocal ? localStat! : cloudStat!;
    const baseItems = useLocal ? localItems : cloudItems;
    const baseHistory = useLocal ? localHistory : cloudHistory;
    const known = new Set(baseItems.map(tryKey));
    const oldestRetained = baseHistory[0]?.at ?? Infinity;
    mergedStats[id] = base;
    for (const item of allItems) {
      if (known.has(tryKey(item))) continue;
      // A bounded snapshot cannot distinguish an ancient offline event from
      // one already included in its aggregate. Replaying it risks double count.
      if (item.at < oldestRetained && item.at <= base.last) continue;
      mergedStats[id] = updateStat(
        mergedStats[id],
        item.correct && !item.skipped,
        item.ms,
        item.at,
      );
    }
  }
  return {
    ...((local.resetAt ?? cloud.resetAt)
      ? { resetAt: local.resetAt ?? cloud.resetAt }
      : {}),
    stats: mergedStats,
    history: history.slice(-1500),
    // Attempts carry session IDs before completion. They cannot be used to
    // infer completed sessions or to add overlapping snapshot counters.
    completedSessions: Math.max(
      cloud.completedSessions ?? 0,
      local.completedSessions ?? 0,
    ),
    dark: local.dark ?? cloud.dark,
    input: local.input ?? cloud.input,
  };
}

/** Compare each repeated fact once, in the same answer mode and a later session. */
export function comparableAttempts<T extends ProgressAttempt>(
  history: T[],
  limit = 20,
) {
  if (!Number.isFinite(limit) || limit < 1) return { before: [], now: [] };
  const first = new Map<string, T>();
  const latest = new Map<string, T>();
  for (const item of [...history].sort((a, b) => a.at - b.at)) {
    if (item.skipped || !item.answerMode || !item.sessionId) continue;
    const key = `${item.id}|${item.answerMode}`;
    const before = first.get(key);
    if (!before) first.set(key, item);
    else if (item.at > before.at && before.sessionId !== item.sessionId)
      latest.set(key, item);
  }
  const pairs = [...latest]
    .sort(([, a], [, b]) => a.at - b.at)
    .slice(-Math.floor(limit));
  return {
    before: pairs.map(([key]) => first.get(key)!),
    now: pairs.map(([, item]) => item),
  };
}

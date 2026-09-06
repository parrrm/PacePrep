import { progressStorageKey } from '@/lib/account-storage';

const DAY_MS = 86_400_000;
const LEITNER_INTERVALS = [0, 1, 3, 7, 14, 30];

type Stat = {
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

type HistoryItem = {
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

type SavedProgress = {
  stats?: Record<string, Stat>;
  history?: HistoryItem[];
  completedSessions?: number;
  dark?: boolean;
  input?: 'mcq' | 'typed';
};

function readProgress(): SavedProgress {
  try {
    return JSON.parse(localStorage.getItem(progressStorageKey(null)) || '{}');
  } catch {
    return {};
  }
}

function writeProgress(next: SavedProgress) {
  localStorage.setItem(progressStorageKey(null), JSON.stringify(next));
}

function updateStat(old: Stat | undefined, correct: boolean, ms: number, now: number): Stat {
  const current = old ?? {
    attempts: 0,
    correct: 0,
    total: 0,
    best: 0,
    recent: [],
    last: 0,
    box: 1,
    lapses: 0,
  };
  const previousBox = current.box ?? 1;
  const nextBox = correct ? Math.min(5, previousBox + 1) : 1;
  const intervalDays = correct ? LEITNER_INTERVALS[nextBox] : 0;
  return {
    attempts: current.attempts + 1,
    correct: current.correct + (correct ? 1 : 0),
    total: current.total + ms,
    best: current.best ? Math.min(current.best, ms) : ms,
    recent: [...current.recent.slice(-5), correct],
    last: now,
    box: nextBox,
    intervalDays,
    dueAt: correct ? now + intervalDays * DAY_MS : now + 10 * 60_000,
    lapses: (current.lapses ?? 0) + (correct ? 0 : 1),
  };
}

export function recordOperationAttempt(item: {
  id: string;
  topic: string;
  q: string;
  a: string;
  raw: string;
  correct: boolean;
  skipped?: boolean;
  ms: number;
  sessionId: string;
}) {
  if (typeof window === 'undefined') return;
  const saved = readProgress();
  const at = Date.now();
  const historyItem: HistoryItem = {
    id: item.id,
    topic: item.topic,
    q: item.q,
    a: item.a,
    correct: item.correct,
    skipped: item.skipped,
    raw: item.raw,
    ms: item.ms,
    at,
    sessionId: item.sessionId,
    answerMode: 'typed',
  };
  const stats = { ...(saved.stats || {}) };
  stats[item.id] = updateStat(stats[item.id], item.correct && !item.skipped, item.ms, at);
  writeProgress({
    ...saved,
    stats,
    history: [...(saved.history || []), historyItem].slice(-1500),
    input: 'typed',
  });
}

export function completeOperationSession() {
  if (typeof window === 'undefined') return;
  const saved = readProgress();
  writeProgress({
    ...saved,
    completedSessions: (saved.completedSessions || 0) + 1,
  });
}

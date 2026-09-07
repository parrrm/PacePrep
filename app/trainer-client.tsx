'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getAuthClient,
  getProgressAccount,
  progressRequest,
} from '@/lib/auth-client';
import { progressStorageKey } from '@/lib/account-storage';
import { cloudAuthReady, onVercel } from '@/lib/hosting';
import {
  OPERATION_FACTS,
  OPERATION_TARGETS,
  type OpTopic,
} from '@/lib/mental-ops';
import { isRecallFamily } from '@/lib/practice-families';
import PracticeHome from './practice/practice-client';
import { signInHref, signOutHref, signInLabel } from '@/lib/hosting';
import {
  BarChart3,
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  Clock3,
  Flame,
  FlagTriangleRight,
  Grid3X3,
  Keyboard,
  Moon,
  Play,
  RotateCcw,
  Share2,
  Sun,
  Target,
  User,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SiteLink as Link } from './site-link';
import {
  answersMatch,
  decimalSlip,
  questionsPerMinute,
} from '@/lib/recall-math';
import { InstallButton } from './pwa-provider';
import { type BaselineAttempt } from '@/lib/baseline';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

type Topic =
  | 'fractions'
  | 'tables'
  | 'squares'
  | 'cubes'
  | 'consecutive'
  | OpTopic;
type PracticeCategory =
  | 'fractions'
  | 'tables'
  | 'powers'
  | 'percentages'
  | 'squares'
  | 'cubes'
  | 'consecutive';
type Level = 'Weak' | 'Learning' | 'Strong' | 'Mastered';
type Mode =
  | 'learn'
  | 'focus'
  | 'mixed'
  | 'weak'
  | 'random'
  | 'test10'
  | 'test25'
  | 'test50'
  | 'sprint';
type Fact = {
  id: string;
  topic: Topic;
  group: string;
  q: string;
  a: string;
  reverse?: boolean;
  strategy?: string;
};
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
type Try = {
  id: string;
  topic: Topic;
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
type AuthUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
};
type AuthStatus = 'checking' | 'anonymous' | 'guest' | 'signed-in';
type CloudStatus = 'idle' | 'saving' | 'saved' | 'error';
type SavedProgress = {
  stats?: Record<string, Stat>;
  history?: Try[];
  completedSessions?: number;
  dark?: boolean;
  input?: 'mcq' | 'typed';
};
const LEGACY_STORAGE_KEY = 'recall-lab';
const DAY_MS = 86_400_000;
const LEITNER_INTERVALS = [0, 1, 3, 7, 14, 30];
const TOPICS: Record<Topic, { name: string; short: string; target: number }> = {
  addition: {
    name: 'Addition',
    short: 'Addition',
    target: OPERATION_TARGETS.addition,
  },
  subtraction: {
    name: 'Subtraction',
    short: 'Subtraction',
    target: OPERATION_TARGETS.subtraction,
  },
  multiplication: {
    name: 'Mental multiplication',
    short: 'Multiplication',
    target: OPERATION_TARGETS.multiplication,
  },
  division: {
    name: 'Mental division',
    short: 'Division',
    target: OPERATION_TARGETS.division,
  },
  fractions: {
    name: 'Fraction ↔ Percentage',
    short: 'Fractions',
    target: 2600,
  },
  tables: { name: 'Multiplication Tables', short: 'Tables', target: 2200 },
  squares: { name: 'Squares', short: 'Squares', target: 2000 },
  cubes: { name: 'Cubes', short: 'Cubes', target: 2200 },
  consecutive: {
    name: 'Consecutive Multiplication',
    short: 'Consecutive',
    target: 2800,
  },
};
const FR: [number, number][] = [
  [1, 2],
  [1, 3],
  [2, 3],
  [1, 4],
  [3, 4],
  [1, 5],
  [2, 5],
  [3, 5],
  [4, 5],
  [1, 6],
  [5, 6],
  [1, 7],
  [2, 7],
  [3, 7],
  [4, 7],
  [5, 7],
  [6, 7],
  [1, 8],
  [3, 8],
  [5, 8],
  [7, 8],
  [1, 9],
  [2, 9],
  [4, 9],
  [5, 9],
  [7, 9],
  [8, 9],
  [1, 10],
  [3, 10],
  [7, 10],
  [9, 10],
  [1, 11],
  [2, 11],
  [3, 11],
  [4, 11],
  [5, 11],
  [6, 11],
  [7, 11],
  [8, 11],
  [9, 11],
  [10, 11],
  [1, 12],
  [5, 12],
  [7, 12],
  [11, 12],
  [1, 13],
  [2, 13],
  [3, 13],
  [4, 13],
  [5, 13],
  [6, 13],
  [7, 13],
  [8, 13],
  [9, 13],
  [10, 13],
  [11, 13],
  [12, 13],
  [1, 14],
  [3, 14],
  [5, 14],
  [9, 14],
  [11, 14],
  [13, 14],
  [1, 15],
  [2, 15],
  [4, 15],
  [7, 15],
  [8, 15],
  [11, 15],
  [13, 15],
  [14, 15],
  [1, 16],
  [3, 16],
  [5, 16],
  [7, 16],
  [9, 16],
  [11, 16],
  [13, 16],
  [15, 16],
  [1, 20],
  [3, 20],
  [7, 20],
  [9, 20],
  [11, 20],
  [13, 20],
  [17, 20],
  [19, 20],
  [1, 25],
  [2, 25],
  [3, 25],
  [4, 25],
  [6, 25],
  [7, 25],
  [8, 25],
  [9, 25],
];
const MIXED: [number, number, number][] = [
  [1, 1, 4],
  [1, 1, 2],
  [1, 5, 8],
  [1, 3, 4],
  [2, 1, 4],
  [2, 1, 2],
  [2, 3, 4],
  [3, 1, 8],
];
const percent = (n: number, d: number) => {
  const scaledNumerator = n * 100;
  const whole = Math.floor(scaledNumerator / d);
  let remainder = scaledNumerator % d;
  if (!remainder) return `${whole}%`;

  // Banking-exam recall banks use the exact terminating value, and the first
  // two decimal digits (without rounding) for recurring values such as 1/6.
  let denominator = d;
  while (denominator % 2 === 0) denominator /= 2;
  while (denominator % 5 === 0) denominator /= 5;
  const decimalLimit = denominator === 1 ? 12 : 2;
  let decimals = '';
  while (remainder && decimals.length < decimalLimit) {
    remainder *= 10;
    decimals += Math.floor(remainder / d);
    remainder %= d;
  }
  return `${whole}.${decimals}%`;
};
function bank() {
  const f: Fact[] = [];
  FR.forEach(([n, d]) => {
    const p = percent(n, d);
    f.push(
      {
        id: `f${n}-${d}`,
        topic: 'fractions',
        group: `Denominator ${d}`,
        q: `${n}/${d} → ?`,
        a: p,
      },
      {
        id: `f${n}-${d}r`,
        topic: 'fractions',
        group: `Denominator ${d}`,
        q: `${p} → ?`,
        a: `${n}/${d}`,
        reverse: true,
      },
    );
  });
  MIXED.forEach(([whole, n, d]) => {
    const improper = whole * d + n,
      p = percent(improper, d),
      mixed = `${whole} ${n}/${d}`;
    f.push(
      {
        id: `fm${whole}-${n}-${d}`,
        topic: 'fractions',
        group: 'Mixed numbers',
        q: `${p} → ?`,
        a: mixed,
        reverse: true,
      },
      {
        id: `fm${whole}-${n}-${d}r`,
        topic: 'fractions',
        group: 'Mixed numbers',
        q: `${mixed} → ?`,
        a: p,
      },
    );
  });
  for (let n = 12; n <= 30; n++)
    for (let x = 1; x <= 10; x++) {
      const s = n <= 15 ? 12 : n <= 20 ? 16 : n <= 25 ? 21 : 26,
        e = s === 26 ? 30 : s + 4,
        g = `Tables ${s}–${e}`;
      f.push(
        {
          id: `t${n}-${x}`,
          topic: 'tables',
          group: g,
          q: `${n} × ${x} = ?`,
          a: String(n * x),
        },
        {
          id: `t${n}-${x}r`,
          topic: 'tables',
          group: g,
          q: `${n * x} ÷ ${n} = ?`,
          a: String(x),
          reverse: true,
        },
      );
    }
  for (let n = 1; n <= 35; n++) {
    const s = n <= 10 ? 1 : n <= 20 ? 11 : n <= 30 ? 21 : 31,
      e = s === 31 ? 35 : s + 9,
      g = `Squares ${s}–${e}`;
    f.push(
      {
        id: `s${n}`,
        topic: 'squares',
        group: g,
        q: `${n}² = ?`,
        a: String(n * n),
      },
      {
        id: `s${n}r`,
        topic: 'squares',
        group: g,
        q: `?² = ${n * n}`,
        a: String(n),
        reverse: true,
      },
    );
  }
  for (let n = 1; n <= 15; n++) {
    const s = n <= 5 ? 1 : n <= 10 ? 6 : 11,
      g = `Cubes ${s}–${s + 4}`;
    f.push(
      {
        id: `c${n}`,
        topic: 'cubes',
        group: g,
        q: `${n}³ = ?`,
        a: String(n * n * n),
      },
      {
        id: `c${n}r`,
        topic: 'cubes',
        group: g,
        q: `?³ = ${n * n * n}`,
        a: String(n),
        reverse: true,
      },
    );
  }
  for (let n = 11; n <= 19; n++)
    f.push(
      {
        id: `m${n}`,
        topic: 'consecutive',
        group: 'Consecutive 11–20',
        q: `${n} × ${n + 1} = ?`,
        a: String(n * (n + 1)),
      },
      {
        id: `m${n}r`,
        topic: 'consecutive',
        group: 'Consecutive 11–20',
        q: `${n} × ? = ${n * (n + 1)}`,
        a: String(n + 1),
        reverse: true,
      },
    );
  return f;
}
const FACTS: Fact[] = [...bank(), ...OPERATION_FACTS];
const level = (s?: Stat, target = 2200): Level => {
  if (!s || s.attempts < 2) return 'Weak';
  const ac = s.correct / s.attempts,
    av = s.total / s.attempts,
    rec = s.recent.filter(Boolean).length / s.recent.length;
  if (
    s.attempts >= 6 &&
    ac >= 0.9 &&
    rec >= 0.8 &&
    av <= target &&
    (s.box ?? 1) >= 4
  )
    return 'Mastered';
  if (s.attempts >= 4 && ac >= 0.8 && av <= target * 1.45) return 'Strong';
  return ac >= 0.55 ? 'Learning' : 'Weak';
};
const day = (t = Date.now()) => new Date(t).toLocaleDateString('en-CA'),
  accuracy = (a: Try[]) => {
    const scored = a.filter((x) => !x.skipped);
    return scored.length
      ? Math.round(
          (scored.filter((x) => x.correct).length / scored.length) * 100,
        )
      : 0;
  },
  average = (a: Try[]) => {
    const scored = a.filter((x) => !x.skipped);
    return scored.length
      ? scored.reduce((n, x) => n + x.ms, 0) / scored.length
      : 0;
  };

function answerHint(fact: Fact) {
  if (fact.a.includes(' ') && fact.a.includes('/'))
    return 'Enter a mixed number or an equivalent improper fraction (for example, 3 1/2 or 7/2).';
  if (fact.a.includes('/'))
    return 'Enter a simplified fraction (for example, 7/16). Equivalent fractions are accepted.';
  if (fact.a.includes('%'))
    return 'Enter the exact exam-recall percentage, including the shown decimal places.';
  return 'Enter digits only.';
}
function FractionValue({ value }: { value: string }) {
  const match = value.match(/^(-?\d+\s+)?(\d+)\/(\d+)$/);
  if (!match) return <>{value}</>;
  return (
    <span className="fraction-value" aria-label={value}>
      {match[1] && <span className="fraction-whole">{match[1].trim()}</span>}
      <span className="fraction-stack" aria-hidden="true">
        <span>{match[2]}</span>
        <span>{match[3]}</span>
      </span>
    </span>
  );
}
function MathText({ value }: { value: string }) {
  const parts = value.split(/((?:-?\d+\s+)?\d+\/\d+)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, index) =>
        /^(-?\d+\s+)?\d+\/\d+$/.test(part) ? (
          <FractionValue key={index} value={part} />
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}
function updateStat(
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
function dueLabel(stat?: Stat) {
  if (!stat?.dueAt || stat.dueAt <= Date.now()) return 'Due now';
  const daysAway = Math.ceil((stat.dueAt - Date.now()) / DAY_MS);
  if (daysAway === 1) return 'Review tomorrow';
  return `Predicted review ${new Date(stat.dueAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
}
function tryKey(item: Try) {
  return `${item.id}|${item.at}|${item.ms}|${item.raw ?? ''}|${item.skipped ? 1 : 0}`;
}
function mergeProgress(
  local: SavedProgress,
  cloud: SavedProgress | null,
): SavedProgress {
  if (!cloud) return local;
  const cloudHistory = cloud.history ?? [];
  const known = new Set(cloudHistory.map(tryKey));
  const extraLocal = (local.history ?? []).filter(
    (item) => !known.has(tryKey(item)),
  );
  const mergedStats = { ...cloud.stats };
  if (!cloud.stats && local.stats) Object.assign(mergedStats, local.stats);
  else {
    extraLocal.forEach((item) => {
      mergedStats[item.id] = updateStat(
        mergedStats[item.id],
        item.correct && !item.skipped,
        item.ms,
        item.at,
      );
    });
  }
  return {
    stats: mergedStats,
    history: [...cloudHistory, ...extraLocal]
      .sort((a, b) => a.at - b.at)
      .slice(-1500),
    completedSessions: Math.max(
      cloud.completedSessions ?? 0,
      local.completedSessions ?? 0,
    ),
    dark: local.dark ?? cloud.dark,
    input: local.input ?? cloud.input,
  };
}
function practiceStreak(history: Try[]) {
  const activeDays = new Set(
      history.filter((item) => !item.skipped).map((item) => day(item.at)),
    ),
    cursor = new Date();
  if (!activeDays.has(day(cursor.getTime())))
    cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (activeDays.has(day(cursor.getTime()))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function factWeight(fact: Fact, stats: Record<string, Stat>) {
  const s = stats[fact.id],
    l = level(s, TOPICS[fact.topic].target),
    slow = s && s.total / s.attempts > TOPICS[fact.topic].target,
    due = !s?.dueAt || s.dueAt <= Date.now(),
    overdueDays = s?.dueAt ? Math.max(0, (Date.now() - s.dueAt) / DAY_MS) : 2;
  return (
    (l === 'Weak' ? 9 : l === 'Learning' ? 5 : l === 'Strong' ? 2 : 0.7) +
    (slow ? 2 : 0) +
    (due ? 6 + Math.min(6, overdueDays) : -0.35) +
    (!s ? 4 : Math.min(3, Math.max(0, (Date.now() - s.last) / 259200000)))
  );
}
function weightedOrder(pool: Fact[], stats: Record<string, Stat>) {
  return pool
    .map((fact) => ({
      fact,
      rank:
        -Math.log(Math.max(Number.EPSILON, Math.random())) /
        factWeight(fact, stats),
    }))
    .sort((a, b) => a.rank - b.rank)
    .map(({ fact }) => fact);
}
function balancedDeck(
  pool: Fact[],
  stats: Record<string, Stat>,
  adaptive = true,
) {
  const topics = shuffle([...new Set(pool.map((fact) => fact.topic))]),
    buckets = new Map<Topic, Fact[]>(
      topics.map((topic) => {
        const facts = pool.filter((fact) => fact.topic === topic);
        return [topic, adaptive ? weightedOrder(facts, stats) : shuffle(facts)];
      }),
    ),
    deck: Fact[] = [];
  let added = true;
  while (added) {
    added = false;
    topics.forEach((topic) => {
      const next = buckets.get(topic)?.shift();
      if (next) {
        deck.push(next);
        added = true;
      }
    });
  }
  return deck;
}
function expandPool(
  targets: Fact[],
  source: Fact[],
  stats: Record<string, Stat>,
) {
  if (targets.length >= 12) return targets;
  const targetIds = new Set(targets.map((fact) => fact.id)),
    support = weightedOrder(
      source.filter((fact) => !targetIds.has(fact.id)),
      stats,
    ).slice(0, 12 - targets.length);
  return [...targets, ...support];
}
function modePool(
  mode: Mode,
  stats: Record<string, Stat>,
  topic: Topic,
  group: string,
  retryIds: string[] = [],
) {
  if (mode === 'sprint') return FACTS.filter((fact) => !fact.strategy);
  if (retryIds.length) {
    const targets = FACTS.filter((fact) => retryIds.includes(fact.id)),
      topics = new Set(targets.map((fact) => fact.topic));
    return expandPool(
      targets,
      FACTS.filter((fact) => topics.has(fact.topic)),
      stats,
    );
  }
  if (mode === 'learn') return FACTS.filter((fact) => !fact.reverse);
  if (mode === 'focus') {
    const topicFacts = FACTS.filter((fact) => fact.topic === topic),
      targets =
        group === 'All groups'
          ? topicFacts
          : topicFacts.filter((fact) => fact.group === group);
    return expandPool(targets, topicFacts, stats);
  }
  if (mode === 'weak') {
    const practiced = FACTS.filter((fact) => stats[fact.id]?.attempts >= 2),
      targets = practiced.filter((fact) => {
        const s = stats[fact.id];
        return (
          ['Weak', 'Learning'].includes(level(s, TOPICS[fact.topic].target)) ||
          s.total / s.attempts > TOPICS[fact.topic].target * 1.45
        );
      }),
      base = targets.length ? targets : practiced;
    return base.length ? expandPool(base, FACTS, stats) : FACTS;
  }
  return FACTS;
}
function testDeck(limit: number, pool: Fact[]) {
  const topics = [...new Set(pool.map((fact) => fact.topic))],
    quota = Math.floor(limit / topics.length),
    remainder = limit % topics.length,
    selected = topics.flatMap((topic, index) => {
      const count = quota + (index < remainder ? 1 : 0),
        direct = shuffle(
          pool.filter((fact) => fact.topic === topic && !fact.reverse),
        ),
        reverse = shuffle(
          pool.filter((fact) => fact.topic === topic && fact.reverse),
        ),
        topicDeck: Fact[] = [];
      while (topicDeck.length < count && (direct.length || reverse.length)) {
        const source = topicDeck.length % 2 === 0 ? direct : reverse;
        const fallback = source.length
          ? source
          : direct.length
            ? direct
            : reverse;
        const next = fallback.shift();
        if (next) topicDeck.push(next);
      }
      return topicDeck;
    });
  return shuffle(selected);
}
function createDeck(mode: Mode, pool: Fact[], stats: Record<string, Stat>) {
  const limit =
    mode === 'test10'
      ? 10
      : mode === 'test25'
        ? 25
        : mode === 'test50'
          ? 50
          : 0;
  if (limit) return testDeck(limit, pool);
  if (mode === 'random') return balancedDeck(pool, stats, false);
  return balancedDeck(pool, stats, true);
}
function choices(f: Fact) {
  const n = Number(f.a.replace('%', ''));
  if (Number.isNaN(n)) {
    const answerKind =
      f.a.includes(' ') && f.a.includes('/')
        ? 'mixed'
        : f.a.includes('/')
          ? 'fraction'
          : 'text';
    const candidates = FACTS.filter((x) => {
        const candidateKind =
          x.a.includes(' ') && x.a.includes('/')
            ? 'mixed'
            : x.a.includes('/')
              ? 'fraction'
              : 'text';
        return (
          x.topic === f.topic &&
          x.id !== f.id &&
          x.reverse === f.reverse &&
          candidateKind === answerKind
        );
      }),
      sameFamily = candidates.filter(
        (candidate) => candidate.group === f.group,
      ),
      others = shuffle([
        ...new Set([...sameFamily, ...candidates].map((x) => x.a)),
      ]).slice(0, 3);
    return [f.a, ...others].sort(() => Math.random() - 0.5);
  }
  const usesPercent = f.a.includes('%');
  const exactDistractors = [
    ...new Set(
      FACTS.filter(
        (candidate) =>
          candidate.id !== f.id &&
          candidate.topic === f.topic &&
          candidate.reverse === f.reverse &&
          candidate.a.includes('%') === usesPercent &&
          !Number.isNaN(Number(candidate.a.replace('%', ''))),
      ).map((candidate) => candidate.a),
    ),
  ]
    .sort(
      (a, b) =>
        Math.abs(Number(a.replace('%', '')) - n) -
        Math.abs(Number(b.replace('%', '')) - n),
    )
    .slice(0, 10);
  const nearbyDistractors = shuffle(exactDistractors).slice(0, 3);
  return shuffle([f.a, ...nearbyDistractors]);
}
function topConfusion(history: Try[]) {
  const counts = new Map<string, { ids: [string, string]; count: number }>();
  history
    .filter((item) => !item.correct && !item.skipped && item.raw)
    .forEach((item) => {
      const source = FACTS.find((fact) => fact.id === item.id);
      if (!source) return;
      const confused = FACTS.find(
        (candidate) =>
          candidate.id !== source.id &&
          candidate.topic === source.topic &&
          candidate.group === source.group &&
          candidate.reverse === source.reverse &&
          answersMatch(item.raw || '', candidate.a),
      );
      if (!confused) return;
      const ids = [source.id, confused.id].sort() as [string, string];
      const key = ids.join('|');
      const previous = counts.get(key);
      counts.set(key, { ids, count: (previous?.count ?? 0) + 1 });
    });
  return [...counts.values()].sort((a, b) => b.count - a.count)[0] ?? null;
}
export default function Home({ grokTest = false }: { grokTest?: boolean }) {
  const progressAccount = useRef<{ userId: string | null; key: string } | null>(
    null,
  );
  const requestProgress = useCallback(
    (init: RequestInit = {}) => {
      if (grokTest)
        return Promise.resolve(
          Response.json({ authenticated: false }, { status: 401 }),
        );
      if (!progressAccount.current)
        throw new Error('Progress is still loading');
      return progressRequest(init, progressAccount.current.userId);
    },
    [grokTest],
  );
  const [entryCategory, setEntryCategory] = useState<PracticeCategory | null>(
    null,
  );
  const [reviewEntry, setReviewEntry] = useState(false);
  const [view, setView] = useState<
      'dashboard' | 'practiceHub' | 'practice' | 'summary' | 'mastery'
    >('dashboard'),
    [dark, setDark] = useState(false),
    [stats, setStats] = useState<Record<string, Stat>>({}),
    [history, setHistory] = useState<Try[]>([]),
    [completedSessions, setCompletedSessions] = useState(0),
    [ready, setReady] = useState(false),
    [mode, setMode] = useState<Mode>('mixed'),
    [session, setSession] = useState<Try[]>([]),
    [skippedIds, setSkippedIds] = useState<string[]>([]),
    [profileOpen, setProfileOpen] = useState(false),
    [fact, setFact] = useState(FACTS.find((f) => f.id === 'f7-16')!),
    [opts, setOpts] = useState<string[]>([]),
    [answer, setAnswer] = useState(''),
    [result, setResult] = useState<{
      ok: boolean;
      ms: number;
      raw: string;
    } | null>(null),
    [input, setInput] = useState<'mcq' | 'typed'>('mcq'),
    [topic, setTopic] = useState<Topic>('fractions'),
    [group, setGroup] = useState('All groups'),
    [left, setLeft] = useState(60),
    [authStatus, setAuthStatus] = useState<AuthStatus>('guest'),
    [authUser, setAuthUser] = useState<AuthUser | null>(null),
    [cloudReady, setCloudReady] = useState(false),
    [cloudStatus, setCloudStatus] = useState<CloudStatus>('idle'),
    [syncTick, setSyncTick] = useState(0),
    [localSaveError, setLocalSaveError] = useState(false),
    [elapsedMs, setElapsedMs] = useState(0);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const family = new URLSearchParams(window.location.search).get(
        'practice',
      );
      if (isRecallFamily(family)) {
        setEntryCategory(family);
        setTopic(family);
        setView('practiceHub');
      } else if (family === 'mixed') {
        setReviewEntry(true);
        setView('practiceHub');
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const started = useRef(0),
    sessionStarted = useRef(0),
    sessionKey = useRef(''),
    answerLocked = useRef(false),
    advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null),
    advanceAction = useRef<(() => void) | null>(null),
    cloudSave = useRef<Promise<void> | null>(null),
    deletingProgress = useRef(false),
    localSnapshot = useRef<SavedProgress>({}),
    sessionCounted = useRef(false),
    sessionAttempts = useRef(0),
    activePool = useRef<Fact[]>(FACTS),
    deck = useRef<Fact[]>([]),
    sessionTargets = useRef<Set<string>>(new Set()),
    field = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let active = true;
    const id = window.setTimeout(async () => {
      // Resolve the current session before reading any account's local history.
      // A stale localStorage marker is never evidence of a signed-in account.
      const userId = grokTest
        ? null
        : await getProgressAccount().catch(() => null);
      if (!active) return;
      const storageKey = grokTest
        ? 'paceprep-grok-test'
        : progressStorageKey(userId);
      progressAccount.current = { userId, key: storageKey };
      try {
        const raw =
          localStorage.getItem(storageKey) ??
          (storageKey === 'paceprep-progress'
            ? localStorage.getItem(LEGACY_STORAGE_KEY)
            : null) ??
          '{}';
        const s = JSON.parse(raw) as SavedProgress;
        const pending = JSON.parse(
          sessionStorage.getItem('paceprep-pending-baseline') || '[]',
        ) as BaselineAttempt[];
        if (Array.isArray(pending) && pending.length) {
          const baselineId = `baseline-${pending[0].at}`;
          const known = new Set((s.history || []).map(tryKey));
          const fresh = pending.filter(
            (item) =>
              FACTS.some((fact) => fact.id === item.id) &&
              !known.has(tryKey(item)),
          );
          s.stats = { ...s.stats };
          fresh.forEach((item) => {
            s.stats![item.id] = updateStat(
              s.stats![item.id],
              item.correct && !item.skipped,
              item.ms,
              item.at,
            );
          });
          s.history = [
            ...(s.history || []),
            ...fresh.map((item) => ({ ...item, sessionId: baselineId })),
          ];
          if (fresh.some((item) => !item.skipped))
            s.completedSessions = (s.completedSessions || 0) + 1;
          sessionStorage.removeItem('paceprep-pending-baseline');
        }
        localSnapshot.current = s;
        setStats(s.stats || {});
        setHistory(s.history || []);
        setCompletedSessions(s.completedSessions || 0);
        setDark(!!s.dark);
        setInput(s.input === 'typed' ? 'typed' : 'mcq');
      } catch {}
      setReady(true);
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(id);
    };
  }, [grokTest]);
  useEffect(() => {
    if (!ready || !cloudAuthReady || grokTest) return;
    let active = true;
    let unsubscribe: (() => void) | undefined;
    void getAuthClient().then((client) => {
      if (!active) return;
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        if (
          active &&
          (session?.user.id ?? null) !== progressAccount.current?.userId
        )
          window.location.reload();
      });
      unsubscribe = () => data.subscription.unsubscribe();
    });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [ready, grokTest]);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    if (ready) {
      const snapshot = {
        stats,
        history: history.slice(-1500),
        completedSessions,
        dark,
        input,
      };
      localSnapshot.current = snapshot;
      try {
        localStorage.setItem(
          progressAccount.current!.key,
          JSON.stringify(snapshot),
        );
        queueMicrotask(() => setLocalSaveError(false));
      } catch {
        queueMicrotask(() => setLocalSaveError(true));
      }
    }
  }, [stats, history, completedSessions, dark, input, ready]);
  useEffect(() => {
    const reconnect = () => setSyncTick((value) => value + 1);
    window.addEventListener('online', reconnect);
    return () => window.removeEventListener('online', reconnect);
  }, []);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    requestProgress()
      .then(async (response) => {
        if (!active) return;
        if (response.status === 401) {
          setAuthUser(null);
          setCloudReady(false);
          setAuthStatus('guest');
          return;
        }
        if (!response.ok) throw new Error('Progress service unavailable');
        const payload = (await response.json()) as {
          user: AuthUser;
          progress: SavedProgress | null;
        };
        if (!active) return;
        setAuthUser(payload.user);
        const merged = mergeProgress(localSnapshot.current, payload.progress);
        setStats(merged.stats || {});
        setHistory(merged.history || []);
        setCompletedSessions(merged.completedSessions || 0);
        setDark(!!merged.dark);
        setInput(merged.input === 'typed' ? 'typed' : 'mcq');
        setCloudReady(true);
        setCloudStatus('saved');
        setAuthStatus('signed-in');
      })
      .catch(() => {
        if (active) {
          setCloudReady(false);
          setCloudStatus('error');
        }
      });
    return () => {
      active = false;
    };
  }, [ready, syncTick, requestProgress]);
  useEffect(() => {
    if (
      !ready ||
      !cloudReady ||
      authStatus !== 'signed-in' ||
      (!history.length && !Object.keys(stats).length)
    )
      return;
    const id = window.setTimeout(() => {
      if (deletingProgress.current) return;
      setCloudStatus('saving');
      cloudSave.current = requestProgress({
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          stats,
          history: history.slice(-1500),
          completedSessions,
          dark,
          input,
        }),
      })
        .then((response) => {
          if (!response.ok) throw new Error('Cloud save failed');
          setCloudStatus('saved');
        })
        .catch(() => setCloudStatus('error'));
    }, 700);
    return () => window.clearTimeout(id);
  }, [
    stats,
    history,
    completedSessions,
    dark,
    input,
    ready,
    cloudReady,
    authStatus,
    syncTick,
    requestProgress,
  ]);
  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    },
    [],
  );
  function resetSessionTiming() {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceAction.current = null;
    answerLocked.current = false;
    sessionStarted.current = performance.now();
    sessionKey.current = `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setElapsedMs(0);
  }
  function advanceNow() {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    const action = advanceAction.current;
    advanceAction.current = null;
    action?.();
  }
  useEffect(() => {
    if (view !== 'practice') return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [view]);
  function sessionDeck(sessionMode: Mode, source: Fact[]) {
    const ordered = createDeck(sessionMode, source, stats);
    if (!sessionTargets.current.size) return ordered;
    return [
      ...weightedOrder(
        ordered.filter((candidate) => sessionTargets.current.has(candidate.id)),
        stats,
      ),
      ...ordered.filter(
        (candidate) => !sessionTargets.current.has(candidate.id),
      ),
    ];
  }
  function showFact(nextFact: Fact) {
    if (nextFact.strategy) setInput('typed');
    answerLocked.current = false;
    setFact(nextFact);
    setOpts(choices(nextFact));
    setAnswer('');
    setResult(null);
    started.current = performance.now();
    setTimeout(() => field.current?.focus(), 20);
  }
  function next(old?: string, excluded = skippedIds) {
    let nextFact = deck.current.shift();
    while (
      nextFact &&
      (nextFact.id === old || excluded.includes(nextFact.id))
    ) {
      nextFact = deck.current.shift();
    }
    if (!nextFact && excluded.length) {
      nextFact = FACTS.find((candidate) => candidate.id === excluded[0]);
    }
    if (!nextFact) {
      deck.current = sessionDeck(mode, activePool.current).filter(
        (candidate) => candidate.id !== old,
      );
      nextFact = deck.current.shift();
    }
    if (nextFact) showFact(nextFact);
  }
  function start(m: Mode) {
    resetSessionTiming();
    const resolvedMode =
        m === 'weak' &&
        !FACTS.some((candidate) => stats[candidate.id]?.attempts)
          ? 'sprint'
          : m,
      nextPool = modePool(resolvedMode, stats, topic, group);
    sessionTargets.current = new Set(
      nextPool
        .filter((candidate) => {
          if (resolvedMode === 'focus')
            return group !== 'All groups' && candidate.group === group;
          if (resolvedMode !== 'weak') return false;
          const s = stats[candidate.id];
          return (
            s?.attempts >= 2 &&
            (['Weak', 'Learning'].includes(
              level(s, TOPICS[candidate.topic].target),
            ) ||
              s.total / s.attempts > TOPICS[candidate.topic].target * 1.45)
          );
        })
        .map((candidate) => candidate.id),
    );
    const nextDeck = sessionDeck(resolvedMode, nextPool),
      first = nextDeck.shift();
    sessionCounted.current = false;
    sessionAttempts.current = 0;
    setSkippedIds([]);
    setMode(resolvedMode);
    setSession([]);
    setLeft(60);
    setView('practice');
    activePool.current = nextPool;
    deck.current = nextDeck;
    if (first) setTimeout(() => showFact(first), 0);
  }
  function startCategory(
    category: PracticeCategory,
    direction: 'direct' | 'reverse' | 'all',
    sessionMode: Mode = 'focus',
  ) {
    resetSessionTiming();
    const nextPool = FACTS.filter((candidate) => {
      if (category === 'tables')
        return (
          candidate.topic === 'tables' &&
          (direction === 'all' ||
            candidate.reverse === (direction === 'reverse'))
        );
      if (
        category === 'squares' ||
        category === 'cubes' ||
        category === 'consecutive'
      )
        return (
          candidate.topic === category &&
          (direction === 'all' ||
            candidate.reverse === (direction === 'reverse'))
        );
      if (category === 'powers')
        return (
          (candidate.topic === 'squares' || candidate.topic === 'cubes') &&
          (direction === 'all' ||
            candidate.reverse === (direction === 'reverse'))
        );
      if (candidate.topic !== 'fractions') return false;
      if (direction === 'all') return true;
      return category === 'fractions'
        ? candidate.reverse === (direction === 'direct')
        : candidate.reverse === (direction === 'reverse');
    });
    sessionTargets.current = new Set(nextPool.map((candidate) => candidate.id));
    const nextDeck = sessionDeck(sessionMode, nextPool);
    const first = nextDeck.shift();
    sessionCounted.current = false;
    sessionAttempts.current = 0;
    setMode(sessionMode);
    setSkippedIds([]);
    setSession([]);
    setLeft(60);
    setView('practice');
    activePool.current = nextPool;
    deck.current = nextDeck;
    if (first) setTimeout(() => showFact(first), 0);
  }
  function retryFacts(ids: string[]) {
    resetSessionTiming();
    const unique = [...new Set(ids)],
      nextPool = modePool('weak', stats, topic, group, unique);
    sessionTargets.current = new Set(unique);
    const nextDeck = sessionDeck('weak', nextPool),
      first = nextDeck.shift();
    if (!unique.length || !first) return start('weak');
    sessionCounted.current = false;
    sessionAttempts.current = 0;
    setMode('weak');
    setSkippedIds([]);
    setSession([]);
    setLeft(60);
    setView('practice');
    activePool.current = nextPool;
    deck.current = nextDeck;
    setTimeout(() => showFact(first), 0);
  }
  function reviewSkipped() {
    const skippedFact = FACTS.find(
      (candidate) => candidate.id === skippedIds[0],
    );
    if (skippedFact) showFact(skippedFact);
  }
  async function deleteProgress() {
    if (
      !window.confirm(
        authUser
          ? 'Permanently delete your cloud progress and reset this device?'
          : 'Delete all PacePrep progress saved on this device?',
      )
    )
      return;
    if (authUser) {
      deletingProgress.current = true;
      try {
        await cloudSave.current;
        const response = await requestProgress({ method: 'DELETE' });
        if (!response.ok) throw new Error('Delete failed');
      } catch {
        deletingProgress.current = false;
        setCloudStatus('error');
        return;
      }
    }
    setStats({});
    setHistory([]);
    setCompletedSessions(0);
    setCloudStatus('saved');
    localStorage.removeItem(progressAccount.current!.key);
    if (!progressAccount.current!.userId && !grokTest)
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    setProfileOpen(false);
    setView('dashboard');
    deletingProgress.current = false;
  }
  const finishSession = useCallback(() => {
    answerLocked.current = true;
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceAction.current = null;
    const elapsed = Math.max(0, performance.now() - sessionStarted.current);
    setElapsedMs(mode === 'sprint' ? Math.min(60_000, elapsed) : elapsed);
    if (!sessionCounted.current && sessionAttempts.current) {
      sessionCounted.current = true;
      setCompletedSessions((count) => count + 1);
    }
    setView('summary');
  }, [mode]);
  function skip() {
    if (result || answerLocked.current) return;
    if (
      mode === 'sprint' &&
      performance.now() - sessionStarted.current >= 60_000
    )
      return finishSession();
    answerLocked.current = true;
    const t: Try = {
      id: fact.id,
      topic: fact.topic,
      q: fact.q,
      a: fact.a,
      correct: false,
      skipped: true,
      raw: '',
      ms: Math.max(100, performance.now() - started.current),
      at: Date.now(),
      sessionId: sessionKey.current,
      answerMode: input,
    };
    const nextSkippedIds = skippedIds.includes(fact.id)
      ? skippedIds
      : [...skippedIds, fact.id];
    setSkippedIds(nextSkippedIds);
    setStats((current) => {
      return {
        ...current,
        [fact.id]: updateStat(current[fact.id], false, t.ms, t.at),
      };
    });
    setHistory((items) => [...items, t]);
    setSession((items) => [...items, t]);
    sessionAttempts.current++;
    next(fact.id, nextSkippedIds);
  }
  const limit =
    mode === 'test10'
      ? 10
      : mode === 'test25'
        ? 25
        : mode === 'test50'
          ? 50
          : 0;
  function submit(raw: string) {
    if (result || answerLocked.current || !raw.trim()) return;
    if (
      mode === 'sprint' &&
      performance.now() - sessionStarted.current >= 60_000
    )
      return finishSession();
    answerLocked.current = true;
    const ms = Math.max(100, performance.now() - started.current),
      ok = answersMatch(raw, fact.a),
      t: Try = {
        id: fact.id,
        topic: fact.topic,
        q: fact.q,
        a: fact.a,
        correct: ok,
        raw,
        ms,
        at: Date.now(),
        sessionId: sessionKey.current,
        answerMode: input,
      },
      answeredAt = Date.now();
    setStats((s) => ({
      ...s,
      [fact.id]: updateStat(s[fact.id], ok, ms, answeredAt),
    }));
    setHistory((h) => [...h, t]);
    setSession((s) => [...s, t]);
    sessionAttempts.current++;
    const remainingSkipped = skippedIds.filter((id) => id !== fact.id),
      answeredCount = session.filter((item) => !item.skipped).length + 1;
    setSkippedIds(remainingSkipped);
    setResult({ ok, ms, raw });
    advanceAction.current = () => {
      if (limit && answeredCount >= limit) {
        const revisit = FACTS.find(
          (candidate) => candidate.id === remainingSkipped[0],
        );
        return revisit ? showFact(revisit) : finishSession();
      }
      next(fact.id, remainingSkipped);
    };
    advanceTimer.current = setTimeout(
      advanceNow,
      mode === 'sprint' ? 450 : ok ? 800 : 3200,
    );
  }
  useEffect(() => {
    if (view !== 'practice' || mode !== 'sprint') return;
    const id = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil(
          (60_000 - (performance.now() - sessionStarted.current)) / 1000,
        ),
      );
      setLeft(remaining);
      if (!remaining) {
        clearInterval(id);
        finishSession();
      }
    }, 200);
    return () => clearInterval(id);
  }, [view, mode, finishSession]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (view === 'practice' && result && e.key === 'Enter') {
        e.preventDefault();
        advanceNow();
        return;
      }
      if (
        view === 'practice' &&
        !result &&
        input === 'mcq' &&
        ['1', '2', '3', '4'].includes(e.key)
      )
        submit(opts[+e.key - 1]);
      if (
        view === 'practice' &&
        !result &&
        input === 'mcq' &&
        e.key.toLowerCase() === 's'
      )
        skip();
      if (view === 'practice' && e.key === 'Escape') finishSession();
    };
    addEventListener('keydown', h);
    return () => removeEventListener('keydown', h);
  });
  const today = history.filter((x) => day(x.at) === day()),
    topicRows = (Object.keys(TOPICS) as Topic[])
      .map((t) => {
        const fs = FACTS.filter((f) => f.topic === t),
          pr = fs.filter((f) => stats[f.id]),
          score =
            pr.reduce(
              (n, f) =>
                n +
                { Weak: 12, Learning: 42, Strong: 72, Mastered: 100 }[
                  level(stats[f.id], TOPICS[t].target)
                ],
              0,
            ) / fs.length;
        return {
          t,
          score: Math.round(score),
          tries: history.filter((x) => x.topic === t),
        };
      })
      .sort((a, b) => a.score - b.score),
    mastered = FACTS.filter(
      (f) => level(stats[f.id], TOPICS[f.topic].target) === 'Mastered',
    ).length;
  return (
    <main>
      {grokTest && (
        <output className="grok-test-banner">
          Grok QA mode · isolated guest progress ·{' '}
          <Link href="/grok-test">open test checklist</Link>
        </output>
      )}
      {view !== 'practice' && view !== 'summary' && <MathAtmosphere />}
      <Header
        dark={dark}
        setDark={setDark}
        view={view}
        setView={(nextView) => {
          if (nextView === 'practiceHub') {
            setEntryCategory(null);
            setReviewEntry(false);
          }
          setView(nextView);
        }}
        onMixed={() => start('mixed')}
        onProfile={() => setProfileOpen(true)}
        attempts={history.length}
      />
      {localSaveError && (
        <p className="storage-warning" role="alert">
          This browser could not save progress. Keep this tab open and allow
          site storage before continuing.
        </p>
      )}
      {profileOpen && (
        <ProfilePanel
          dark={dark}
          setDark={setDark}
          input={input}
          setInput={setInput}
          attempts={history.length}
          mastered={mastered}
          user={authUser}
          cloudStatus={cloudStatus}
          deleteProgress={deleteProgress}
          close={() => setProfileOpen(false)}
        />
      )}
      {view === 'dashboard' && (
        <HomeDashboard
          today={today}
          history={history}
          stats={stats}
          completedSessions={completedSessions}
          rows={topicRows}
          start={start}
          retry={retryFacts}
          openPractice={() => {
            setEntryCategory(null);
            setReviewEntry(false);
            setView('practiceHub');
          }}
        />
      )}{' '}
      {view === 'practiceHub' && (
        <PracticeHub
          start={start}
          startCategory={startCategory}
          initialCategory={entryCategory}
          reviewEntry={reviewEntry}
          ready={ready}
          grokTest={grokTest}
          stats={stats}
          topic={topic}
          setTopic={setTopic}
          group={group}
          setGroup={setGroup}
        />
      )}{' '}
      {view === 'practice' && (
        <Practice
          fact={fact}
          opts={opts}
          result={result}
          submit={submit}
          answer={answer}
          setAnswer={setAnswer}
          input={input}
          setInput={setInput}
          current={session.filter((item) => !item.skipped).length + 1}
          limit={limit}
          left={mode === 'sprint' ? left : null}
          end={finishSession}
          skip={skip}
          skippedCount={skippedIds.length}
          reviewSkipped={reviewSkipped}
          field={field}
          continueNext={advanceNow}
          correctCount={
            session.filter((item) => item.correct && !item.skipped).length
          }
        />
      )}{' '}
      {view === 'summary' && (
        <Summary
          tries={session}
          prior={history.slice(0, Math.max(0, history.length - session.length))}
          sprint={mode === 'sprint'}
          elapsedMs={elapsedMs}
          home={() => setView('dashboard')}
          weak={() => start('weak')}
          retry={retryFacts}
        />
      )}{' '}
      {view === 'mastery' && (
        <Mastery stats={stats} history={history} start={start} />
      )}
    </main>
  );
}

function MathAtmosphere() {
  return <div className="math-atmosphere" aria-hidden="true" />;
}

function Header({
  dark,
  setDark,
  view,
  setView,
  onMixed,
  onProfile,
  attempts,
}: {
  dark: boolean;
  setDark: (x: boolean) => void;
  view: string;
  setView: (v: 'dashboard' | 'practiceHub' | 'mastery') => void;
  onMixed: () => void;
  onProfile: () => void;
  attempts: number;
}) {
  return (
    <header
      className={`topbar ${view === 'practice' || view === 'summary' ? 'hide' : ''}`}
    >
      <button className="brand" onClick={() => setView('dashboard')}>
        <b>
          <Zap size={16} />
        </b>
        Pace<span>Prep</span>
      </button>
      <nav aria-label="Primary navigation">
        <button
          className={view === 'dashboard' ? 'active' : ''}
          aria-current={view === 'dashboard' ? 'page' : undefined}
          onClick={() => setView('dashboard')}
        >
          Home
        </button>
        <button
          className={view === 'practiceHub' ? 'active' : ''}
          aria-current={view === 'practiceHub' ? 'page' : undefined}
          onClick={() => setView('practiceHub')}
        >
          Practice
        </button>
        <button
          className={view === 'mastery' ? 'active' : ''}
          aria-current={view === 'mastery' ? 'page' : undefined}
          onClick={() => setView('mastery')}
        >
          Progress
        </button>
      </nav>
      <div>
        <Button variant="outline" className="nav-mixed" onClick={onMixed}>
          <Play fill="currentColor" /> Mixed practice
        </Button>
        <div
          className="nav-xp"
          aria-label={`Level ${Math.floor(attempts / 50) + 1}, ${attempts % 50} of 50 XP`}
        >
          <span>
            <b>LVL {Math.floor(attempts / 50) + 1}</b>
            <small>{Math.floor(attempts / 10)} focus tokens</small>
          </span>
          <i>
            <b style={{ width: `${(attempts % 50) * 2}%` }} />
          </i>
        </div>
        <button
          className="icon profile-trigger"
          aria-label="Open learner profile and settings"
          onClick={onProfile}
        >
          <User />
        </button>
        <button
          className="icon"
          aria-label={dark ? 'Use light mode' : 'Use dark mode'}
          onClick={() => setDark(!dark)}
        >
          {dark ? <Sun /> : <Moon />}
        </button>
      </div>
    </header>
  );
}
function ProfilePanel({
  dark,
  setDark,
  input,
  setInput,
  attempts,
  mastered,
  user,
  cloudStatus,
  deleteProgress,
  close,
}: {
  dark: boolean;
  setDark: (value: boolean) => void;
  input: 'mcq' | 'typed';
  setInput: (value: 'mcq' | 'typed') => void;
  attempts: number;
  mastered: number;
  user: AuthUser | null;
  cloudStatus: CloudStatus;
  deleteProgress: () => void;
  close: () => void;
}) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent
        className="profile-panel accessible-profile"
        showCloseButton={false}
      >
        <header>
          <span>
            <small>LEARNER PROFILE</small>
            <DialogTitle id="profile-title">
              {user?.displayName || 'Guest learner'}
            </DialogTitle>
          </span>
          <button
            className="icon"
            aria-label="Close profile and settings"
            onClick={close}
          >
            <X />
          </button>
        </header>
        <DialogDescription className="sr-only">
          Manage your progress, display preferences, and PacePrep app
          installation.
        </DialogDescription>
        <div className="profile-level">
          <i>
            <User />
          </i>
          <span>
            <b>Level {Math.floor(attempts / 50) + 1}</b>
            <small>
              {attempts} answers · {mastered} mastered facts ·{' '}
              {Math.floor(attempts / 10)} focus tokens
            </small>
          </span>
        </div>
        {user ? (
          <p className="profile-sync">
            <Check />{' '}
            {cloudStatus === 'saving'
              ? 'Saving progress…'
              : cloudStatus === 'error'
                ? 'Cloud sync needs attention.'
                : 'Progress synced across signed-in devices over HTTPS.'}
            <small>{user.email}</small>
          </p>
        ) : (
          <p>
            Your progress is stored on this device.{' '}
            {onVercel && !cloudAuthReady ? (
              'Account sign-in and cloud sync are not available in this preview.'
            ) : (
              <>
                <Link href={signInHref} target="_top">
                  {signInLabel}
                </Link>{' '}
                to keep it across devices.
              </>
            )}
          </p>
        )}
        <div className="preference-row">
          <span>
            <b>PacePrep on your phone</b>
            <small>Add a home-screen shortcut for daily practice.</small>
          </span>
          <InstallButton />
        </div>
        <div className="preference-row">
          <span>
            <b>Default answer mode</b>
            <small>Choose how new sessions open.</small>
          </span>
          <fieldset aria-label="Default answer mode">
            <button
              className={input === 'mcq' ? 'active' : ''}
              onClick={() => setInput('mcq')}
            >
              Choices
            </button>
            <button
              className={input === 'typed' ? 'active' : ''}
              onClick={() => setInput('typed')}
            >
              Type
            </button>
          </fieldset>
        </div>
        <div className="preference-row">
          <span>
            <b>Appearance</b>
            <small>Use the theme that is most comfortable.</small>
          </span>
          <button className="preference-action" onClick={() => setDark(!dark)}>
            {dark ? <Sun /> : <Moon />}
            {dark ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
        <footer>
          <button className="delete-progress" onClick={deleteProgress}>
            Delete progress
          </button>
          {user && (
            <Link className="sign-out" href={signOutHref} target="_top">
              Sign out
            </Link>
          )}
          <Button onClick={close}>Save preferences</Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
function HomeDashboard({
  today,
  history,
  stats,
  completedSessions,
  rows,
  start,
  retry,
  openPractice,
}: {
  today: Try[];
  history: Try[];
  stats: Record<string, Stat>;
  completedSessions: number;
  rows: { t: Topic; score: number; tries: Try[] }[];
  start: (m: Mode) => void;
  retry: (ids: string[]) => void;
  openPractice: () => void;
}) {
  const [renderedAt] = useState(() => Date.now());
  const scoredHistory = history.filter((item) => !item.skipped);
  const streak = practiceStreak(history);
  const recent = scoredHistory.slice(-20);
  const prior = scoredHistory.slice(-40, -20);
  const accuracyDelta = prior.length
    ? accuracy(recent) - accuracy(prior)
    : null;
  const speedDelta = prior.length
    ? (average(prior) - average(recent)) / 1000
    : null;
  const scoreFor = (predicate: (fact: Fact) => boolean) => {
    const facts = FACTS.filter(predicate);
    if (!facts.length) return 0;
    const score = facts.reduce((sum, item) => {
      const status = stats[item.id]
        ? level(stats[item.id], TOPICS[item.topic].target)
        : 'Weak';
      return (
        sum +
        (stats[item.id]?.attempts
          ? { Weak: 12, Learning: 42, Strong: 72, Mastered: 100 }[status]
          : 0)
      );
    }, 0);
    return Math.round(score / facts.length);
  };
  const categories = [
    {
      key: 'fractions',
      label: 'Fractions',
      score: scoreFor((fact) => fact.topic === 'fractions' && !!fact.reverse),
      tone: 'violet',
    },
    {
      key: 'tables',
      label: 'Tables',
      score: scoreFor((fact) => fact.topic === 'tables'),
      tone: 'blue',
    },
    {
      key: 'powers',
      label: 'Squares & cubes',
      score: scoreFor(
        (fact) => fact.topic === 'squares' || fact.topic === 'cubes',
      ),
      tone: 'amber',
    },
    {
      key: 'percentages',
      label: 'Percentages',
      score: scoreFor((fact) => fact.topic === 'fractions' && !fact.reverse),
      tone: 'green',
    },
  ].sort((a, b) => a.score - b.score);
  const overall = Math.round(
    categories.reduce((sum, row) => sum + row.score, 0) / categories.length,
  );
  const weakest = rows
    .filter(
      (row) =>
        row.tries.some((item) => !item.skipped) &&
        (accuracy(row.tries) < 85 || average(row.tries) > 8000),
    )
    .sort((a, b) => {
      const aAccuracy = accuracy(a.tries);
      const bAccuracy = accuracy(b.tries);
      return aAccuracy - bAccuracy || average(b.tries) - average(a.tries);
    })[0];
  const dueFacts = FACTS.filter((item) => {
    const stat = stats[item.id];
    return stat?.attempts && (!stat.dueAt || stat.dueAt <= renderedAt);
  });
  const estimatedMinutes = Math.max(1, Math.ceil((dueFacts.length * 2.5) / 60));
  const trendText = (value: number | null, suffix: string) =>
    value === null
      ? 'Baseline forming'
      : (value >= 0 ? '+' : '') + value.toFixed(1) + suffix + ' vs prior 20';

  return (
    <div className="page home-dashboard dashboard-v4">
      <section
        className="dashboard-scoreboard"
        aria-label="Overall learning pulse"
      >
        <div className="score-hero">
          <small>OVERALL RECALL MASTERY</small>
          <div>
            <strong>{history.length ? overall : '—'}</strong>
            <span>/100</span>
          </div>
          <p>
            {history.length
              ? 'Fact-level score across the active recall bank.'
              : 'Complete a diagnostic to establish your first mastery score.'}
          </p>
          <div
            className="xp-track"
            aria-label={
              'Level ' + (Math.floor(history.length / 50) + 1) + ' progress'
            }
          >
            <span>
              <b>LEVEL {Math.floor(history.length / 50) + 1}</b>
              <em>{history.length % 50}/50 XP</em>
            </span>
            <i>
              <b style={{ width: (history.length % 50) * 2 + '%' }} />
            </i>
          </div>
        </div>
        <div className="streak-hero">
          <i className={streak ? 'active' : ''}>
            <Flame />
          </i>
          <small>CURRENT STREAK</small>
          <strong>{streak}</strong>
          <b>{streak === 1 ? 'day' : 'days'}</b>
          <p>
            {streak
              ? 'Keep the chain alive with facts due today.'
              : 'One accurate session starts the chain.'}
          </p>
        </div>
      </section>

      <section className="due-nudge" aria-label="Facts due today">
        <span>
          <small>DUE-TODAY MICRO SESSION</small>
          <h1>
            {dueFacts.length
              ? dueFacts.length + ' facts are due today'
              : 'Your next review is being scheduled'}
          </h1>
          <p>
            {dueFacts.length
              ? 'About ' +
                estimatedMinutes +
                ' ' +
                (estimatedMinutes === 1 ? 'minute' : 'minutes') +
                ' · PacePrep Recall Loop prioritises overdue and fragile facts.'
              : 'Start a mixed set while the Leitner scheduler builds your first review intervals.'}
          </p>
        </span>
        <Button
          onClick={() =>
            dueFacts.length
              ? retry(dueFacts.map((item) => item.id))
              : start('mixed')
          }
        >
          <Play fill="currentColor" />{' '}
          {dueFacts.length ? 'Review due facts' : 'Start mixed practice'}
        </Button>
      </section>

      <section
        className="dashboard-trends"
        aria-label="Recent performance trends"
      >
        <article>
          <i>
            <Check />
          </i>
          <span>
            <small>ACCURACY TREND</small>
            <strong>
              {recent.length ? accuracy(recent) + '%' : 'Unranked'}
            </strong>
            <em>{trendText(accuracyDelta, ' pts')}</em>
          </span>
        </article>
        <article>
          <i>
            <Clock3 />
          </i>
          <span>
            <small>AVERAGE RESPONSE</small>
            <strong>
              {recent.length ? (average(recent) / 1000).toFixed(1) + 's' : '—'}
            </strong>
            <em>
              {speedDelta === null
                ? 'Baseline forming'
                : Math.abs(speedDelta).toFixed(1) +
                  's ' +
                  (speedDelta >= 0 ? 'faster' : 'slower') +
                  ' vs prior 20'}
            </em>
          </span>
        </article>
        <article>
          <i>
            <Target />
          </i>
          <span>
            <small>DRILLS COMPLETED</small>
            <strong>{completedSessions}</strong>
            <em>{today.length} questions today</em>
          </span>
        </article>
      </section>

      <section
        className="mastery-overview panel"
        aria-labelledby="mastery-overview-title"
      >
        <header>
          <span>
            <small>MASTERY BY CATEGORY</small>
            <h2 id="mastery-overview-title">Know where to train next</h2>
          </span>
          <button onClick={openPractice}>
            Open practice hub <ChevronRight />
          </button>
        </header>
        {!history.length ? (
          <div className="dashboard-empty">
            <BarChart3 />
            <span>
              <b>No placeholder percentages</b>
              <small>
                Your real category bars appear after the first drill.
              </small>
            </span>
            <Button onClick={() => start('sprint')}>
              Take 1-minute diagnostic
            </Button>
          </div>
        ) : (
          <div className="category-bars">
            {categories.map((row) => (
              <div key={row.key}>
                <span>
                  <b>{row.label}</b>
                  <em>{row.score}/100</em>
                </span>
                <i className={row.tone}>
                  <b style={{ width: row.score + '%' }} />
                </i>
              </div>
            ))}
          </div>
        )}
      </section>

      <section
        className="weakest-callout"
        aria-label="Weakest category recommendation"
      >
        <div>
          <i>
            <FlagTriangleRight />
          </i>
          <span>
            <small>FOCUS NEXT</small>
            <h2>
              {weakest
                ? TOPICS[weakest.t].short
                : history.length
                  ? 'Your practised topics are on track'
                  : 'Find your first target area'}
            </h2>
            <p>
              {weakest
                ? accuracy(weakest.tries) +
                  '% accurate · ' +
                  Math.max(0, 85 - accuracy(weakest.tries)) +
                  ' point gap to the stable threshold · ' +
                  (average(weakest.tries) / 1000).toFixed(1) +
                  's average'
                : history.length
                  ? 'No topic is below 85% accuracy or above 8 seconds on average. Keep reviewing to make that performance durable.'
                  : 'A short diagnostic identifies the fact family that will return the most time.'}
            </p>
          </span>
        </div>
        <Button
          onClick={() =>
            weakest
              ? retry(
                  FACTS.filter((fact) => fact.topic === weakest.t).map(
                    (fact) => fact.id,
                  ),
                )
              : start(history.length ? 'mixed' : 'sprint')
          }
        >
          <Target />{' '}
          {weakest
            ? 'Drill weaknesses'
            : history.length
              ? 'Continue review'
              : 'Start diagnostic'}
        </Button>
      </section>
    </div>
  );
}

function PracticeHub({
  initialCategory,
  reviewEntry,
  ready,
  grokTest,
  start,
  startCategory,
  stats,
  topic,
  setTopic,
  group,
  setGroup,
}: {
  initialCategory: PracticeCategory | null;
  reviewEntry: boolean;
  ready: boolean;
  grokTest: boolean;
  start: (m: Mode) => void;
  startCategory: (
    category: PracticeCategory,
    direction: 'direct' | 'reverse' | 'all',
    mode?: Mode,
  ) => void;
  stats: Record<string, Stat>;
  topic: Topic;
  setTopic: (t: Topic) => void;
  group: string;
  setGroup: (g: string) => void;
}) {
  const selected = initialCategory;
  const categoryFacts = (key: PracticeCategory) =>
    FACTS.filter((fact) =>
      key === 'tables' ||
      key === 'squares' ||
      key === 'cubes' ||
      key === 'consecutive'
        ? fact.topic === key
        : key === 'powers'
          ? fact.topic === 'squares' || fact.topic === 'cubes'
          : fact.topic === 'fractions' &&
            (key === 'fractions' ? !!fact.reverse : !fact.reverse),
    );
  const categoryScore = (key: PracticeCategory) => {
    const facts = categoryFacts(key);
    const practised = facts.filter((fact) => stats[fact.id]?.attempts);
    if (!practised.length) return 0;
    return Math.round(
      practised.reduce((sum, fact) => {
        const status = level(stats[fact.id], TOPICS[fact.topic].target);
        return (
          sum + { Weak: 12, Learning: 42, Strong: 72, Mastered: 100 }[status]
        );
      }, 0) / facts.length,
    );
  };
  const categoryMeta: Record<
    PracticeCategory,
    { title: string; copy: string; icon: typeof Brain; color: string }
  > = {
    squares: {
      title: 'Squares',
      copy: 'Squares up to 35² and roots in both directions.',
      icon: Brain,
      color: 'amber',
    },
    cubes: {
      title: 'Cubes',
      copy: 'Cubes up to 15³ and roots in both directions.',
      icon: Brain,
      color: 'green',
    },
    consecutive: {
      title: 'Consecutive products',
      copy: 'Neighbouring-number products from 11 × 12 to 19 × 20.',
      icon: Zap,
      color: 'violet',
    },
    fractions: {
      title: 'Fractions',
      copy: 'Recognise and reconstruct simplified fraction forms.',
      icon: BookOpen,
      color: 'violet',
    },
    tables: {
      title: 'Tables',
      copy: 'Tables 12–30 with multiplication and division recall.',
      icon: Grid3X3,
      color: 'blue',
    },
    powers: {
      title: 'Squares & cubes',
      copy: 'Roots and powers in both directions.',
      icon: Brain,
      color: 'amber',
    },
    percentages: {
      title: 'Percentages',
      copy: 'Convert exact banking-exam fraction–percentage pairs.',
      icon: Zap,
      color: 'green',
    },
  };
  const groups = [
    'All groups',
    ...new Set(
      FACTS.filter((fact) => fact.topic === topic).map((fact) => fact.group),
    ),
  ];

  if (reviewEntry)
    return (
      <section className="page practice-hub">
        <Link href={grokTest ? '/practice?grok-test=1' : '/practice'}>
          ← Practice home
        </Link>
        <div className="masteryTitle">
          <span>
            <small>MIXED / DUE REVIEWS</small>
            <h1>Review across families</h1>
            <p>
              Recall facts and mental operations share this review. Due and weak
              items come first; new items fill the gaps.
            </p>
          </span>
        </div>
        <p>
          Answer on this device. Focus on accuracy and end the review whenever
          you need.
        </p>
        <Button disabled={!ready} onClick={() => start('mixed')}>
          {ready ? 'Start mixed review' : 'Loading saved progress…'}
        </Button>
      </section>
    );
  if (!selected) return <PracticeHome embedded />;
  if (selected) {
    const meta = categoryMeta[selected];
    return (
      <div className="page practice-hub category-page">
        <nav className="practice-breadcrumb" aria-label="Breadcrumb">
          <Link href={grokTest ? '/practice?grok-test=1' : '/practice'}>
            Practice
          </Link>
          <ChevronRight />
          <span aria-current="page">{meta.title}</span>
        </nav>
        <div className="masteryTitle">
          <span>
            <small>{meta.title.toUpperCase()}</small>
            <h1>Choose a {meta.title.toLowerCase()} drill</h1>
            <p>
              {meta.copy} Direct and reverse directions are measured separately.
            </p>
          </span>
          <strong>{categoryScore(selected)}% mastery</strong>
        </div>
        <section
          className="category-mode-grid"
          aria-label={meta.title + ' practice modes'}
        >
          <button onClick={() => startCategory(selected, 'direct')}>
            <i className={meta.color}>
              <Play />
            </i>
            <span>
              <small>FOUNDATION</small>
              <b>Direct recall</b>
              <em>Build the fastest path from prompt to answer.</em>
            </span>
            <ChevronRight />
          </button>
          <button onClick={() => startCategory(selected, 'reverse')}>
            <i className={meta.color}>
              <RotateCcw />
            </i>
            <span>
              <small>PAIR RECALL</small>
              <b>Reverse recall</b>
              <em>Train the same fact in the opposite direction.</em>
            </span>
            <ChevronRight />
          </button>
          <button onClick={() => startCategory(selected, 'all', 'sprint')}>
            <i className={meta.color}>
              <Clock3 />
            </i>
            <span>
              <small>60 SECONDS</small>
              <b>Timed sprint</b>
              <em>A session timer—never an individual-question countdown.</em>
            </span>
            <ChevronRight />
          </button>
          <button onClick={() => startCategory(selected, 'all', 'test10')}>
            <i className={meta.color}>
              <Target />
            </i>
            <span>
              <small>MEASURE RECALL</small>
              <b>10-question benchmark</b>
              <em>A fixed-length check with an immediate results review.</em>
            </span>
            <ChevronRight />
          </button>
        </section>
        <section className="panel focus-hub">
          <Heading over="SPECIFIC FACT FAMILY" title="Narrow the drill" />
          <div className="focus">
            <select
              aria-label="Practice topic"
              value={topic}
              onChange={(event) => {
                setTopic(event.target.value as Topic);
                setGroup('All groups');
              }}
            >
              {(Object.keys(TOPICS) as Topic[]).map((item) => (
                <option key={item} value={item}>
                  {TOPICS[item].name}
                </option>
              ))}
            </select>
            <select
              aria-label="Fact group"
              value={group}
              onChange={(event) => setGroup(event.target.value)}
            >
              {groups.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <Button onClick={() => start('focus')}>
              Start focused drill <ChevronRight />
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return null;
}

function Heading({
  over,
  title,
  extra,
}: {
  over: string;
  title: string;
  extra?: string;
}) {
  return (
    <div className="heading">
      <span>
        <small>{over}</small>
        <h2>{title}</h2>
      </span>
      {extra && <em>{extra}</em>}
    </div>
  );
}
function AnimatedCount({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);
  useEffect(() => {
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const from = previous.current;
    const start = performance.now();
    let frame = 0;
    function tick(now: number) {
      const portion = reduced ? 1 : Math.min(1, (now - start) / 250);
      setDisplay(Math.round(from + (value - from) * portion));
      if (portion < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    previous.current = value;
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return (
    <span aria-label={String(value)}>
      <span aria-hidden="true">{display}</span>
    </span>
  );
}
function Practice({
  fact,
  opts,
  result,
  submit,
  answer,
  setAnswer,
  input,
  setInput,
  current,
  limit,
  left,
  end,
  skip,
  skippedCount,
  reviewSkipped,
  field,
  continueNext,
  correctCount,
}: {
  fact: Fact;
  opts: string[];
  result: { ok: boolean; ms: number; raw: string } | null;
  submit: (s: string) => void;
  answer: string;
  setAnswer: (s: string) => void;
  input: 'mcq' | 'typed';
  setInput: (x: 'mcq' | 'typed') => void;
  current: number;
  limit: number;
  left: number | null;
  end: () => void;
  skip: () => void;
  skippedCount: number;
  reviewSkipped: () => void;
  field: React.RefObject<HTMLInputElement | null>;
  continueNext: () => void;
  correctCount: number;
}) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  return (
    <div className="practicePage">
      <header className="practiceHead">
        <button className="brand">
          <b>
            <Zap />
          </b>
          Pace<span>Prep</span>
        </button>
        <span>
          Question {result ? current - 1 : current}
          {limit ? ` of ${limit}` : ''}
        </span>
        <div>
          {left !== null && (
            <b>
              {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
            </b>
          )}
          <Button
            variant="outline"
            aria-label="End session"
            onClick={() => (skippedCount ? setConfirmEnd(true) : end())}
          >
            End session
          </Button>
        </div>
      </header>
      <section className="quiz">
        <div className="quizline">
          <small>{TOPICS[fact.topic].name}</small>
          <b className="session-score">
            <Check size={15} /> <AnimatedCount value={correctCount} /> correct
          </b>
          <span>
            <button
              className={input === 'mcq' ? 'active' : ''}
              onClick={() => setInput('mcq')}
              disabled={!!fact.strategy}
            >
              Choices
            </button>
            <button
              className={input === 'typed' ? 'active' : ''}
              onClick={() => setInput('typed')}
            >
              Type
            </button>
          </span>
        </div>
        <div
          className={`qcard ${result ? (result.ok ? 'answer-correct' : 'answer-review-needed') : ''}`}
        >
          <small>
            {fact.strategy
              ? 'MENTAL OPERATION'
              : fact.reverse
                ? 'REVERSE RECALL'
                : 'DIRECT RECALL'}
          </small>
          <h1>
            <MathText value={fact.q} />
          </h1>
          {input === 'mcq' ? (
            <div className="choices">
              {opts.map((o, i) => (
                <button
                  key={o + i}
                  disabled={!!result}
                  onClick={() => submit(o)}
                  className={
                    result
                      ? answersMatch(o, fact.a)
                        ? 'correct'
                        : answersMatch(o, result.raw)
                          ? 'wrong'
                          : ''
                      : ''
                  }
                >
                  <kbd>{i + 1}</kbd>
                  <b>
                    <MathText value={o} />
                  </b>
                  {result && answersMatch(o, fact.a) && <Check />}
                  {result && !result.ok && answersMatch(o, result.raw) && <X />}
                </button>
              ))}
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(answer);
              }}
            >
              <input
                ref={field}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer"
                aria-label="Your answer"
                inputMode={fact.a.includes('/') ? 'text' : 'decimal'}
                autoComplete="off"
                disabled={!!result}
                maxLength={80}
              />
              <Button type="submit" disabled={!!result || !answer.trim()}>
                Check answer
              </Button>
              {(fact.a.includes('/') || fact.strategy) && (
                <div
                  className="fraction-keypad"
                  aria-label={
                    fact.strategy ? 'Number keypad' : 'Fraction keypad'
                  }
                >
                  {[
                    '1',
                    '2',
                    '3',
                    '4',
                    '5',
                    '6',
                    '7',
                    '8',
                    '9',
                    '0',
                    ...(fact.strategy ? [] : ['/', 'space']),
                  ].map((key) => (
                    <button
                      type="button"
                      disabled={!!result}
                      key={key}
                      onClick={() =>
                        setAnswer(answer + (key === 'space' ? ' ' : key))
                      }
                    >
                      {key === 'space' ? 'Space' : key}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={!!result}
                    onClick={() => setAnswer(answer.slice(0, -1))}
                  >
                    ⌫
                  </button>
                </div>
              )}
            </form>
          )}
          <p className="answer-format-hint">
            <b>Answer format:</b> {answerHint(fact)}
          </p>
          <output
            className={`feedback ${result ? (result.ok ? 'yes' : 'no') : ''}`}
            aria-live="polite"
          >
            {result && (
              <>
                <i>{result.ok ? <Check /> : <RotateCcw />}</i>
                <span>
                  <b>
                    {result.ok
                      ? 'Correct. Keep the pace.'
                      : 'A fact to lock in.'}{' '}
                    — {(result.ms / 1000).toFixed(2)} sec
                  </b>
                  {!result.ok && (
                    <small>
                      Correct answer: <MathText value={fact.a} />
                    </small>
                  )}
                  {!result.ok && (
                    <p>
                      {decimalSlip(result.raw, fact.a)
                        ? 'Possible decimal-place slip: check where the decimal belongs.'
                        : 'Compare the prompt and answer as one pair. You’ll review the explanation after this session.'}
                    </p>
                  )}
                </span>
                <button
                  onClick={continueNext}
                  aria-label="Continue to next question"
                >
                  Continue <ChevronRight />
                </button>
              </>
            )}
          </output>
          {!result && (
            <div className="quiz-actions">
              <button onClick={skip}>
                Skip <kbd>S</kbd>
              </button>
              {!!skippedCount && (
                <button onClick={reviewSkipped}>
                  Revisit skipped <b>{skippedCount}</b>
                </button>
              )}
            </div>
          )}
        </div>
        <p>
          <Keyboard /> Press <kbd>1</kbd>–<kbd>4</kbd> to answer · <kbd>S</kbd>{' '}
          to skip · Enter to continue · accuracy before speed
        </p>
      </section>
      {confirmEnd && (
        <Dialog open onOpenChange={setConfirmEnd}>
          <DialogContent className="end-confirm">
            <small>UNFINISHED REVIEW</small>
            <DialogTitle id="end-title">
              {skippedCount} skipped{' '}
              {skippedCount === 1 ? 'question' : 'questions'} remain
            </DialogTitle>
            <DialogDescription>
              Reviewing them now keeps difficult facts from disappearing from
              this session.
            </DialogDescription>
            <div>
              <Button variant="outline" onClick={end}>
                End anyway
              </Button>
              <Button
                onClick={() => {
                  setConfirmEnd(false);
                  reviewSkipped();
                }}
              >
                Review skipped
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
function strategyFor(item: Try) {
  const operation = FACTS.find((fact) => fact.id === item.id && fact.strategy);
  if (operation?.strategy)
    return { title: 'Hold it in your head', text: operation.strategy };
  if (item.topic === 'fractions') {
    const mixed = `${item.q} ${item.a}`.match(/(\d+)\s+(\d+)\/(\d+)/);
    if (mixed) {
      const [, whole, numerator, denominator] = mixed;
      return {
        title: 'Convert through an improper fraction',
        text: `Use (${whole} × ${denominator} + ${numerator})/${denominator}, then multiply by 100 for the percentage. Reverse the steps and simplify when converting back.`,
      };
    }
    const fraction = `${item.q} ${item.a}`.match(/(\d+)\/(\d+)/);
    if (fraction) {
      const [, numerator, denominator] = fraction;
      return {
        title: `Anchor on 1/${denominator}`,
        text: `Recall 1/${denominator} as a percentage, then multiply that value by ${numerator}. Keep recurring banking-exam values to their memorized two-decimal form without rounding up.`,
      };
    }
  }
  if (item.topic === 'tables') {
    return item.q.includes('÷')
      ? {
          title: 'Reverse the multiplication fact',
          text: `Ask which number multiplied by the divisor gives ${item.q.split('÷')[0].trim()}. Division recall should reuse the matching table fact.`,
        }
      : {
          title: 'Split around a friendly ten',
          text: 'Multiply by 10 first, then add the remaining multiples. With repetition, compress the steps into one recalled fact.',
        };
  }
  if (item.topic === 'squares')
    return {
      title: 'Use the nearest known square',
      text: 'For nearby numbers use (a ± 1)² = a² ± 2a + 1, then store the result as a direct recall fact.',
    };
  if (item.topic === 'cubes')
    return {
      title: 'Link root and final digits',
      text: 'Memorize cubes as root–value pairs. The final digit narrows the possible root and helps reverse recall.',
    };
  return {
    title: 'Use n² + n',
    text: 'For consecutive numbers, n(n + 1) equals n² + n. Recall the square, then add the smaller factor.',
  };
}
function Summary({
  tries,
  prior,
  sprint,
  elapsedMs,
  home,
  weak,
  retry,
}: {
  tries: Try[];
  prior: Try[];
  sprint: boolean;
  elapsedMs: number;
  home: () => void;
  weak: () => void;
  retry: (ids: string[]) => void;
}) {
  const [reviewFilter, setReviewFilter] = useState<
    'all' | 'incorrect' | 'skipped'
  >('all');
  const [detailed, setDetailed] = useState(false);
  const [shareStatus, setShareStatus] = useState('');
  const reviewItems = tries,
    wrong = reviewItems.filter((x) => !x.correct && !x.skipped),
    skipped = reviewItems.filter((x) => x.skipped),
    visibleReview = reviewItems.filter(
      (item) =>
        reviewFilter === 'all' ||
        (reviewFilter === 'incorrect'
          ? !item.correct && !item.skipped
          : item.skipped),
    ),
    scored = tries.filter((item) => !item.skipped),
    fast = scored.length ? Math.min(...scored.map((x) => x.ms)) : 0,
    matched = scored
      .map((item) => ({
        now: item,
        before: prior.findLast(
          (previous) =>
            previous.id === item.id &&
            previous.answerMode === item.answerMode &&
            !previous.skipped,
        ),
      }))
      .filter((pair) => !!pair.before),
    previousComparable = matched.map((pair) => pair.before!),
    currentComparable = matched.map((pair) => pair.now),
    topics = (Object.keys(TOPICS) as Topic[])
      .map((t) => ({ t, x: tries.filter((a) => a.topic === t) }))
      .filter((x) => x.x.length)
      .sort((a, b) => accuracy(a.x) - accuracy(b.x)),
    confusion = topConfusion([...prior, ...tries]);
  async function shareReport() {
    const text = [
      'PacePrep Recall Report',
      `${scored.length} answered · ${accuracy(tries)}% accuracy · ${(average(tries) / 1000).toFixed(1)}s average`,
      previousComparable.length
        ? `${matched.length} matched-fact comparisons: before ${accuracy(previousComparable)}% at ${(average(previousComparable) / 1000).toFixed(1)}s; now ${accuracy(currentComparable)}% at ${(average(currentComparable) / 1000).toFixed(1)}s`
        : 'Baseline session recorded',
      `Recorded ${new Date().toLocaleString('en-IN')}`,
      'Generated from recorded fact-level practice. Individual results vary.',
    ].join('\n');
    try {
      if (navigator.share)
        await navigator.share({ title: 'PacePrep Recall Report', text });
      else {
        await navigator.clipboard.writeText(text);
        setShareStatus('Report copied. Paste it into your study group.');
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError'))
        setShareStatus(
          'Sharing is unavailable in this browser. Your results remain saved here.',
        );
    }
  }
  return (
    <div className="summary">
      <section>
        <i className="done">
          <Check />
        </i>
        <small>SESSION COMPLETE</small>
        <h1>
          {!scored.length
            ? 'No scored answers yet.'
            : accuracy(tries) >= 90
              ? 'Accurate today. Automatic with practice.'
              : 'A clear next step, not just a score.'}
        </h1>
        <p>Each accurate repetition moves a fact closer to instant recall.</p>
        <div className="sumstats">
          <span>
            <small>ANSWERED</small>
            <b>{scored.length}</b>
          </span>
          <span>
            <small>ACCURACY</small>
            <b>{scored.length ? accuracy(tries) + '%' : '—'}</b>
          </span>
          <span>
            <small>AVG. RESPONSE</small>
            <b>
              {scored.length ? (average(tries) / 1000).toFixed(1) + 's' : '—'}
            </b>
          </span>
          <span>
            <small>FASTEST</small>
            <b>{fast ? (fast / 1000).toFixed(2) + 's' : '—'}</b>
          </span>
        </div>
        <div
          className="session-impact"
          aria-label="Session improvement comparison"
        >
          <BarChart3 />
          <div>
            <small>WHAT CHANGED</small>
            {previousComparable.length ? (
              <>
                <b>
                  {average(currentComparable) <= average(previousComparable)
                    ? `${((average(previousComparable) - average(currentComparable)) / 1000).toFixed(1)}s faster on matching facts`
                    : `${((average(currentComparable) - average(previousComparable)) / 1000).toFixed(1)}s slower on matching facts`}
                </b>
                <p>
                  Previous: {accuracy(previousComparable)}% at{' '}
                  {(average(previousComparable) / 1000).toFixed(1)}s · Now:{' '}
                  {accuracy(currentComparable)}% at{' '}
                  {(average(currentComparable) / 1000).toFixed(1)}s{' · '}
                  {matched.length} matched attempts in the same answer mode, not
                  an exam-score prediction.
                </p>
              </>
            ) : (
              <>
                <b>
                  {scored.length
                    ? 'Baseline recorded'
                    : 'Start when you’re ready'}
                </b>
                <p>
                  Your next comparable session will show exactly how much
                  accuracy and recall speed changed.
                </p>
              </>
            )}
          </div>
        </div>
        <div className="summary-takeaway">
          <b>
            {scored.filter((item) => item.correct).length} correct ·{' '}
            {scored.filter((item) => !item.correct).length} incorrect ·{' '}
            {skipped.length} skipped
          </b>
          <p>
            {wrong.length || skipped.length
              ? 'Your missed facts are ready for a targeted retry. Open the analysis when you want explanations.'
              : scored.length
                ? 'No missed answers in this session. Review later to check retention, not just recognition.'
                : 'Nothing has been scored. Return to the dashboard to choose a drill.'}
          </p>
        </div>
        <button
          className="analysis-toggle"
          aria-expanded={detailed}
          aria-controls="session-analysis"
          onClick={() => setDetailed(!detailed)}
        >
          <BarChart3 />
          {detailed ? 'Hide detailed analysis' : 'View detailed analysis'}
          <ChevronRight />
        </button>
        <div id="session-analysis" hidden={!detailed}>
          <div className="topic-analysis">
            <h2>Category breakdown</h2>
            <table>
              <caption className="sr-only">
                Accuracy and response time by topic in this session
              </caption>
              <thead>
                <tr>
                  <th scope="col">Topic</th>
                  <th scope="col">Accuracy</th>
                  <th scope="col">Average</th>
                </tr>
              </thead>
              <tbody>
                {topics.map(({ t, x }) => (
                  <tr key={t}>
                    <th scope="row">{TOPICS[t].short}</th>
                    <td>
                      {x.some((a) => !a.skipped)
                        ? accuracy(x) + '%'
                        : 'Skipped'}
                    </td>
                    <td>
                      {x.some((a) => !a.skipped)
                        ? (average(x) / 1000).toFixed(1) + 's'
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sumdetail">
            <div>
              <small>WEAKEST TOPIC</small>
              <b>
                {topics[0] ? TOPICS[topics[0].t].name : 'No weak topic yet'}
              </b>
              <em>
                {topics[0]
                  ? `${accuracy(topics[0].x)}% in this session`
                  : 'Complete a few questions'}
              </em>
            </div>
            <div>
              <small>REVIEW STATUS</small>
              <b>
                {wrong.length} incorrect · {skipped.length} skipped
              </b>
              <em>
                {wrong.length || skipped.length
                  ? 'Review the explanations below, then retry the facts.'
                  : 'No errors — excellent control.'}
              </em>
            </div>
          </div>
          {confusion && (
            <div className="confusion-callout">
              <RotateCcw />
              <span>
                <small>CONFUSION PAIR DETECTED</small>
                <b>
                  <MathText
                    value={
                      FACTS.find((item) => item.id === confusion.ids[0])?.q ||
                      ''
                    }
                  />
                  {' ↔ '}
                  <MathText
                    value={
                      FACTS.find((item) => item.id === confusion.ids[1])?.q ||
                      ''
                    }
                  />
                </b>
                <p>
                  PacePrep found {confusion.count} answer pattern suggesting
                  these facts are being mixed up.
                </p>
              </span>
              <Button variant="outline" onClick={() => retry(confusion.ids)}>
                Drill this pair
              </Button>
            </div>
          )}
          <section className="answer-review" aria-label="Question review">
            <header>
              <span>
                <small>ANSWER REVIEW</small>
                <h2>Understand every attempt</h2>
              </span>
              <nav aria-label="Review filters">
                <button
                  className={reviewFilter === 'all' ? 'active' : ''}
                  onClick={() => setReviewFilter('all')}
                >
                  All {reviewItems.length}
                </button>
                <button
                  className={reviewFilter === 'incorrect' ? 'active' : ''}
                  onClick={() => setReviewFilter('incorrect')}
                >
                  Incorrect {wrong.length}
                </button>
                <button
                  className={reviewFilter === 'skipped' ? 'active' : ''}
                  onClick={() => setReviewFilter('skipped')}
                >
                  Skipped {skipped.length}
                </button>
              </nav>
            </header>
            <div className="review-list">
              {visibleReview.length ? (
                visibleReview.map((item) => {
                  const strategy = strategyFor(item);
                  return (
                    <article
                      key={item.id + '-' + item.at}
                      className={
                        item.skipped
                          ? 'skipped'
                          : item.correct
                            ? 'correct'
                            : 'incorrect'
                      }
                    >
                      <div className="review-question">
                        <span>
                          <small>
                            {item.skipped
                              ? 'SKIPPED'
                              : item.correct
                                ? 'CORRECT'
                                : 'INCORRECT'}
                          </small>
                          <b>
                            <MathText value={item.q} />
                          </b>
                        </span>
                        <em>
                          {item.skipped
                            ? '—'
                            : `${(item.ms / 1000).toFixed(2)}s`}
                        </em>
                      </div>
                      <div className="review-answer">
                        <span>
                          <small>YOUR ANSWER</small>
                          <b>
                            {item.skipped
                              ? 'Not answered'
                              : item.raw || 'Not recorded'}
                          </b>
                        </span>
                        <span>
                          <small>CORRECT ANSWER</small>
                          <b>
                            <MathText value={item.a} />
                          </b>
                        </span>
                      </div>
                      <div className="review-strategy">
                        <Brain />
                        <span>
                          <b>{strategy.title}</b>
                          {!item.correct &&
                            !item.skipped &&
                            decimalSlip(item.raw || '', item.a) && (
                              <p>
                                <strong>Possible decimal-place slip.</strong>{' '}
                                Check the decimal position before using the
                                recall strategy.
                              </p>
                            )}
                          <p>{strategy.text}</p>
                        </span>
                      </div>
                      {!item.correct && (
                        <button onClick={() => retry([item.id])}>
                          Retry this fact <ChevronRight />
                        </button>
                      )}
                    </article>
                  );
                })
              ) : (
                <p className="review-empty">No questions match this filter.</p>
              )}
            </div>
            {!!(wrong.length || skipped.length) && (
              <Button
                onClick={() =>
                  retry([...wrong, ...skipped].map((item) => item.id))
                }
              >
                <RotateCcw /> Retry missed questions
              </Button>
            )}
          </section>
        </div>
        {sprint && (
          <div className="sprint">
            <Zap />
            <b>
              {scored.length} answered in {(elapsedMs / 1000).toFixed(1)}s ·{' '}
              {questionsPerMinute(scored.length, elapsedMs).toFixed(1)}{' '}
              questions/min
            </b>
          </div>
        )}
        <footer>
          <Button variant="outline" onClick={home}>
            Back to dashboard
          </Button>
          <Button
            variant="outline"
            onClick={shareReport}
            disabled={!scored.length}
          >
            <Share2 /> Share recall report
          </Button>
          <Button onClick={weak}>
            <RotateCcw /> Practice weak areas
          </Button>
        </footer>
        {shareStatus && <output className="share-status">{shareStatus}</output>}
      </section>
    </div>
  );
}
function ProgressImpact({
  stats,
  history,
  start,
}: {
  stats: Record<string, Stat>;
  history: Try[];
  start: (mode: Mode) => void;
}) {
  const sampleSize = Math.min(20, Math.floor(history.length / 2)),
    hasComparison = sampleSize >= 5,
    baseline = hasComparison ? history.slice(0, sampleSize) : [],
    current = hasComparison ? history.slice(-sampleSize) : [],
    accuracyGain = hasComparison ? accuracy(current) - accuracy(baseline) : 0,
    paceGain = hasComparison
      ? (average(baseline) - average(current)) / 1000
      : 0,
    timeSaved = Math.max(0, paceGain * 50),
    masteredFacts = FACTS.filter(
      (fact) => level(stats[fact.id], TOPICS[fact.topic].target) === 'Mastered',
    ).length,
    instantFacts = FACTS.filter((fact) => {
      const s = stats[fact.id];
      return (
        s &&
        s.attempts >= 3 &&
        s.correct / s.attempts >= 0.85 &&
        s.total / s.attempts <= 2500
      );
    }).length,
    topicOutcomes = (Object.keys(TOPICS) as Topic[])
      .map((topic) => {
        const tries = history.filter((item) => item.topic === topic);
        return {
          topic,
          tries,
          mastered: FACTS.filter(
            (fact) =>
              fact.topic === topic &&
              level(stats[fact.id], TOPICS[topic].target) === 'Mastered',
          ).length,
        };
      })
      .filter((row) => row.tries.length);

  return (
    <section
      className="panel impact-report"
      aria-label="PacePrep impact report"
    >
      <div className="impact-report-head">
        <span>
          <small>MEASURABLE OUTCOMES</small>
          <h2>Your PacePrep impact</h2>
          <p>
            See how repeated recall is changing your accuracy, pace, and exam
            readiness.
          </p>
        </span>
        <em>
          {hasComparison
            ? `Comparing ${sampleSize} early vs recent answers`
            : 'Benchmark in progress'}
        </em>
      </div>

      {!history.length ? (
        <div className="impact-empty">
          <i>
            <BarChart3 />
          </i>
          <span>
            <b>Create your first measurable benchmark</b>
            <small>
              A one-minute diagnostic records the baseline that every future
              session will be compared against.
            </small>
          </span>
          <Button onClick={() => start('sprint')}>
            <Zap /> Start diagnostic
          </Button>
        </div>
      ) : (
        <>
          <div className="impact-kpis">
            <span>
              <small>ACCURACY CHANGE</small>
              <b>
                {hasComparison
                  ? `${accuracyGain >= 0 ? '+' : ''}${accuracyGain} pts`
                  : `${accuracy(history)}%`}
              </b>
              <em>
                {hasComparison
                  ? `${accuracy(baseline)}% → ${accuracy(current)}%`
                  : 'Current accuracy baseline'}
              </em>
            </span>
            <span>
              <small>RECALL SPEED</small>
              <b>
                {hasComparison
                  ? `${Math.abs(paceGain).toFixed(1)}s ${paceGain >= 0 ? 'faster' : 'slower'}`
                  : `${(average(history) / 1000).toFixed(1)}s`}
              </b>
              <em>
                {hasComparison
                  ? `${(average(baseline) / 1000).toFixed(1)}s → ${(average(current) / 1000).toFixed(1)}s`
                  : 'Average time per answer'}
              </em>
            </span>
            <span>
              <small>INSTANT RECALL</small>
              <b>{instantFacts} facts</b>
              <em>≥85% accurate in 2.5s or less</em>
            </span>
            <span>
              <small>MASTERED BANK</small>
              <b>
                {masteredFacts} / {FACTS.length}
              </b>
              <em>Consistently accurate and on pace</em>
            </span>
          </div>

          <div className="impact-proof">
            <BarChart3 />
            <span>
              <small>PROJECTED EXAM IMPACT</small>
              <b>
                {hasComparison && paceGain > 0
                  ? `${timeSaved.toFixed(0)} seconds saved per 50 recall operations`
                  : 'Keep training to establish a reliable pace gain'}
              </b>
              <p>
                {hasComparison && paceGain > 0
                  ? 'Projection uses your measured early-to-recent response-time improvement; it is not an exam-score prediction.'
                  : 'A comparison unlocks after five early and five recent answers.'}
              </p>
            </span>
          </div>

          {!!topicOutcomes.length && (
            <div
              className="topic-outcomes"
              aria-label="Topic outcome breakdown"
            >
              {topicOutcomes.map((row) => (
                <div key={row.topic}>
                  <span>
                    <b>{TOPICS[row.topic].short}</b>
                    <small>
                      {row.tries.length}{' '}
                      {row.tries.length === 1 ? 'attempt' : 'attempts'}
                    </small>
                  </span>
                  <span>
                    <b>{accuracy(row.tries)}%</b>
                    <small>{(average(row.tries) / 1000).toFixed(1)}s avg</small>
                  </span>
                  <span>
                    <b>{row.mastered}</b>
                    <small>mastered</small>
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function Mastery({
  stats,
  history,
  start,
}: {
  stats: Record<string, Stat>;
  history: Try[];
  start: (mode: Mode) => void;
}) {
  const [topic, setTopic] = useState<Topic>('fractions'),
    [groupFilter, setGroupFilter] = useState('All groups'),
    [statusFilter, setStatusFilter] = useState<
      'all' | 'needs-work' | 'mastered'
    >('all'),
    [showAll, setShowAll] = useState(false);
  const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - 6 + i);
      return {
        label: i === 6 ? 'Today' : `Day ${i + 1}`,
        tries: history.filter((x) => day(x.at) === day(d.getTime())),
      };
    }),
    topicFacts = FACTS.filter((fact) => fact.topic === topic),
    groups = ['All groups', ...new Set(topicFacts.map((fact) => fact.group))],
    filteredFacts = topicFacts.filter((fact) => {
      const s = stats[fact.id],
        l = level(s, TOPICS[topic].target),
        inGroup = groupFilter === 'All groups' || fact.group === groupFilter,
        inStatus =
          statusFilter === 'all' ||
          (statusFilter === 'needs-work' &&
            (!s || l === 'Weak' || l === 'Learning')) ||
          (statusFilter === 'mastered' && l === 'Mastered');
      return inGroup && inStatus;
    }),
    visibleFacts = showAll ? filteredFacts : filteredFacts.slice(0, 48);
  return (
    <div className="page mastery">
      <div className="masteryTitle">
        <span>
          <small>FACT-BY-FACT PROGRESS</small>
          <h1>Mastery grid</h1>
          <p>
            Every fact strengthens through accurate, increasingly fast recall.
          </p>
        </span>
      </div>
      <ProgressImpact stats={stats} history={history} start={start} />
      <section
        className="panel progress-rhythm"
        aria-label="Seven-day practice rhythm"
      >
        <Heading over="PRACTICE RHYTHM" title="Last seven days" />
        <div className="progress-rhythm-grid">
          {days.map((d) => (
            <div key={d.label}>
              <i
                className={
                  d.tries.length >= 10 && accuracy(d.tries) >= 90
                    ? 'hit'
                    : d.tries.length
                      ? 'active'
                      : ''
                }
              >
                {d.tries.length || '·'}
              </i>
              <span>
                <b>{d.label}</b>
                <small>
                  {d.tries.length
                    ? `${accuracy(d.tries)}% · ${(average(d.tries) / 1000).toFixed(1)}s`
                    : 'No session'}
                </small>
              </span>
            </div>
          ))}
        </div>
      </section>
      <nav>
        {(Object.keys(TOPICS) as Topic[]).map((t) => (
          <button
            key={t}
            className={t === topic ? 'active' : ''}
            onClick={() => {
              setTopic(t);
              setGroupFilter('All groups');
              setShowAll(false);
            }}
          >
            {TOPICS[t].short}
          </button>
        ))}
      </nav>
      <section className="panel">
        <div className="mastery-toolbar">
          <label>
            <span>Fact family</span>
            <select
              value={groupFilter}
              onChange={(event) => {
                setGroupFilter(event.target.value);
                setShowAll(false);
              }}
            >
              {groups.map((group) => (
                <option key={group}>{group}</option>
              ))}
            </select>
          </label>
          <fieldset aria-label="Mastery status filter">
            <button
              className={statusFilter === 'all' ? 'active' : ''}
              onClick={() => {
                setStatusFilter('all');
                setShowAll(false);
              }}
            >
              All
            </button>
            <button
              className={statusFilter === 'needs-work' ? 'active' : ''}
              onClick={() => {
                setStatusFilter('needs-work');
                setShowAll(false);
              }}
            >
              Needs work
            </button>
            <button
              className={statusFilter === 'mastered' ? 'active' : ''}
              onClick={() => {
                setStatusFilter('mastered');
                setShowAll(false);
              }}
            >
              Mastered
            </button>
          </fieldset>
          <output>
            {filteredFacts.length}{' '}
            {filteredFacts.length === 1 ? 'fact' : 'facts'}
          </output>
        </div>
        <div className="legend">
          <span>
            <i className="New" />
            New
          </span>
          <span>
            <i className="Weak" />
            Weak
          </span>
          <span>
            <i className="Learning" />
            Learning
          </span>
          <span>
            <i className="Strong" />
            Strong
          </span>
          <span>
            <i className="Mastered" />
            Mastered
          </span>
        </div>
        <div className="factgrid">
          {visibleFacts.map((f) => {
            const s = stats[f.id],
              l = level(s, TOPICS[topic].target);
            return (
              <div className={s ? l : 'New'} key={f.id} title={`${f.q} ${f.a}`}>
                <b>
                  <MathText value={f.q.replace('= ?', '').replace('→ ?', '')} />
                </b>
                <small>
                  {s
                    ? `${Math.round((s.correct / s.attempts) * 100)}% · ${(s.total / s.attempts / 1000).toFixed(1)}s · ${dueLabel(s)}`
                    : 'New'}
                </small>
              </div>
            );
          })}
        </div>
        {filteredFacts.length > 48 && (
          <button
            className="mastery-load-more"
            onClick={() => setShowAll((value) => !value)}
          >
            {showAll
              ? 'Show first 48 facts'
              : `Show all ${filteredFacts.length} facts`}
          </button>
        )}
      </section>
      <details className="panel methodology">
        <summary>How PacePrep measures mastery</summary>
        <div>
          <span>
            <b>Accuracy first</b>
            <small>
              A fact cannot become Mastered from one correct answer. PacePrep
              requires repeated, consistent success.
            </small>
          </span>
          <span>
            <b>Speed with control</b>
            <small>
              Each topic has an exam-relevant pace target. Faster answers help
              only when accuracy remains strong.
            </small>
          </span>
          <span>
            <b>PacePrep Recall Loop</b>
            <small>
              A five-box Leitner scheduler gives accurate facts longer intervals
              and returns missed or overdue facts sooner. Every fact shows its
              next predicted review date in the grid.
            </small>
          </span>
          <span>
            <b>Exact exam values</b>
            <small>
              Terminating percentages stay exact and recurring banking-exam
              values use their memorized decimal form without rounding up.
            </small>
          </span>
        </div>
      </details>
    </div>
  );
}

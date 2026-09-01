'use client';
import { useEffect, useRef, useState } from 'react';
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
  Sun,
  Target,
  User,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type Topic = 'fractions' | 'tables' | 'squares' | 'cubes' | 'consecutive';
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
};
type Stat = {
  attempts: number;
  correct: number;
  total: number;
  best: number;
  recent: boolean[];
  last: number;
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
const TOPICS: Record<Topic, { name: string; short: string; target: number }> = {
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
const FACTS = bank();
const level = (s?: Stat, target = 2200): Level => {
  if (!s || s.attempts < 2) return 'Weak';
  const ac = s.correct / s.attempts,
    av = s.total / s.attempts,
    rec = s.recent.filter(Boolean).length / s.recent.length;
  if (s.attempts >= 6 && ac >= 0.9 && rec >= 0.8 && av <= target)
    return 'Mastered';
  if (s.attempts >= 4 && ac >= 0.8 && av <= target * 1.45) return 'Strong';
  return ac >= 0.55 ? 'Learning' : 'Weak';
};
const norm = (v: string) => v.trim().replace(/%|\s/g, '').toLowerCase(),
  day = (t = Date.now()) => new Date(t).toLocaleDateString('en-CA'),
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
    slow = s && s.total / s.attempts > TOPICS[fact.topic].target;
  return (
    (l === 'Weak' ? 9 : l === 'Learning' ? 5 : l === 'Strong' ? 2 : 0.7) +
    (slow ? 2 : 0) +
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
function testDeck(limit: number) {
  const topics = Object.keys(TOPICS) as Topic[],
    quota = Math.floor(limit / topics.length),
    remainder = limit % topics.length,
    selected = topics.flatMap((topic, index) => {
      const count = quota + (index < remainder ? 1 : 0),
        direct = shuffle(
          FACTS.filter((fact) => fact.topic === topic && !fact.reverse),
        ),
        reverse = shuffle(
          FACTS.filter((fact) => fact.topic === topic && fact.reverse),
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
  if (limit) return testDeck(limit);
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
const MODES: [Mode, string, string, typeof Brain][] = [
  ['learn', 'Learn', 'Build direct recall', BookOpen],
  ['focus', 'Focus', 'Drill one fact family', Target],
  ['mixed', 'Mixed Practice', 'Adaptive topic mix', Zap],
  ['weak', 'Weak Areas', 'Target slow facts', RotateCcw],
  ['random', 'Random Practice', 'Surprise recall check', Grid3X3],
  ['test10', '10-Question Test', 'Quick accuracy check', Check],
  ['test25', '25-Question Test', 'Focused test set', Check],
  ['test50', '50-Question Test', 'Full recall test', Check],
  ['sprint', '1-Minute Sprint', 'Sustained speed', Clock3],
];

export default function Home() {
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
    [authStatus, setAuthStatus] = useState<AuthStatus>('checking'),
    [authUser, setAuthUser] = useState<AuthUser | null>(null),
    [cloudReady, setCloudReady] = useState(false),
    [cloudStatus, setCloudStatus] = useState<CloudStatus>('idle');
  const started = useRef(0),
    sessionCounted = useRef(false),
    sessionAttempts = useRef(0),
    activePool = useRef<Fact[]>(FACTS),
    deck = useRef<Fact[]>([]),
    sessionTargets = useRef<Set<string>>(new Set()),
    field = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const s = JSON.parse(localStorage.getItem('recall-lab') || '{}');
        setStats(s.stats || {});
        setHistory(s.history || []);
        setCompletedSessions(s.completedSessions || 0);
        setDark(!!s.dark);
        setInput(s.input === 'typed' ? 'typed' : 'mcq');
      } catch {}
      setReady(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    if (ready)
      localStorage.setItem(
        'recall-lab',
        JSON.stringify({
          stats,
          history: history.slice(-1500),
          completedSessions,
          dark,
          input,
        }),
      );
  }, [stats, history, completedSessions, dark, input, ready]);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    fetch('/api/progress', { cache: 'no-store' })
      .then(async (response) => {
        if (!active) return;
        if (response.status === 401) {
          setAuthStatus('anonymous');
          return;
        }
        if (!response.ok) throw new Error('Progress service unavailable');
        const payload = (await response.json()) as {
          user: AuthUser;
          progress: SavedProgress | null;
        };
        setAuthUser(payload.user);
        if (payload.progress) {
          setStats(payload.progress.stats || {});
          setHistory(payload.progress.history || []);
          setCompletedSessions(payload.progress.completedSessions || 0);
          setDark(!!payload.progress.dark);
          setInput(payload.progress.input === 'typed' ? 'typed' : 'mcq');
        }
        setCloudReady(true);
        setCloudStatus('saved');
        setAuthStatus('signed-in');
      })
      .catch(() => {
        if (active) setAuthStatus('anonymous');
      });
    return () => {
      active = false;
    };
  }, [ready]);
  useEffect(() => {
    if (!ready || !cloudReady || authStatus !== 'signed-in') return;
    const id = window.setTimeout(() => {
      setCloudStatus('saving');
      fetch('/api/progress', {
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
  ]);
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
  function retryFacts(ids: string[]) {
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
        'Permanently delete your cloud progress and reset this device?',
      )
    )
      return;
    const response = await fetch('/api/progress', { method: 'DELETE' });
    if (!response.ok) {
      setCloudStatus('error');
      return;
    }
    setStats({});
    setHistory([]);
    setCompletedSessions(0);
    setCloudStatus('saved');
    localStorage.removeItem('recall-lab');
    setProfileOpen(false);
    setView('dashboard');
  }
  function skip() {
    if (result) return;
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
    };
    const nextSkippedIds = skippedIds.includes(fact.id)
      ? skippedIds
      : [...skippedIds, fact.id];
    setSkippedIds(nextSkippedIds);
    setStats((current) => {
      const old = current[fact.id] || {
        attempts: 0,
        correct: 0,
        total: 0,
        best: 0,
        recent: [],
        last: 0,
      };
      return {
        ...current,
        [fact.id]: {
          attempts: old.attempts + 1,
          correct: old.correct,
          total: old.total + t.ms,
          best: old.best || t.ms,
          recent: [...old.recent.slice(-5), false],
          last: Date.now(),
        },
      };
    });
    setHistory((items) => [...items, t]);
    setSession((items) => [...items, t]);
    sessionAttempts.current++;
    next(fact.id, nextSkippedIds);
  }
  function finishSession() {
    if (!sessionCounted.current && sessionAttempts.current) {
      sessionCounted.current = true;
      setCompletedSessions((count) => count + 1);
    }
    setView('summary');
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
    if (result) return;
    const ms = Math.max(100, performance.now() - started.current),
      ok = norm(raw) === norm(fact.a),
      t: Try = {
        id: fact.id,
        topic: fact.topic,
        q: fact.q,
        a: fact.a,
        correct: ok,
        raw,
        ms,
        at: Date.now(),
      },
      old = stats[fact.id] || {
        attempts: 0,
        correct: 0,
        total: 0,
        best: 0,
        recent: [],
        last: 0,
      };
    setStats((s) => ({
      ...s,
      [fact.id]: {
        attempts: old.attempts + 1,
        correct: old.correct + (ok ? 1 : 0),
        total: old.total + ms,
        best: old.best ? Math.min(old.best, ms) : ms,
        recent: [...old.recent.slice(-5), ok],
        last: Date.now(),
      },
    }));
    setHistory((h) => [...h, t]);
    setSession((s) => [...s, t]);
    sessionAttempts.current++;
    const remainingSkipped = skippedIds.filter((id) => id !== fact.id),
      answeredCount = session.filter((item) => !item.skipped).length + 1;
    setSkippedIds(remainingSkipped);
    setResult({ ok, ms, raw });
    setTimeout(
      () => {
        if (limit && answeredCount >= limit) {
          const revisit = FACTS.find(
            (candidate) => candidate.id === remainingSkipped[0],
          );
          return revisit ? showFact(revisit) : finishSession();
        }
        next(fact.id, remainingSkipped);
      },
      mode === 'sprint' ? 180 : ok ? 650 : 1150,
    );
  }
  useEffect(() => {
    if (view !== 'practice' || mode !== 'sprint') return;
    const id = setInterval(
      () =>
        setLeft((x) => {
          if (x <= 1) {
            clearInterval(id);
            setTimeout(finishSession, 0);
            return 0;
          }
          return x - 1;
        }),
      1000,
    );
    return () => clearInterval(id);
  }, [view, mode]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
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
  if (authStatus === 'checking' || authStatus === 'anonymous') {
    return <LandingPage onGuest={() => setAuthStatus('guest')} />;
  }
  return (
    <main>
      {view !== 'practice' && view !== 'summary' && <MathAtmosphere />}
      <Header
        dark={dark}
        setDark={setDark}
        view={view}
        setView={setView}
        onMixed={() => start('mixed')}
        onProfile={() => setProfileOpen(true)}
        attempts={history.length}
        mastered={mastered}
      />
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
          completedSessions={completedSessions}
          rows={topicRows}
          start={start}
          openPractice={() => setView('practiceHub')}
        />
      )}{' '}
      {view === 'practiceHub' && (
        <PracticeHub
          start={start}
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
        />
      )}{' '}
      {view === 'summary' && (
        <Summary
          tries={session}
          prior={history.slice(0, Math.max(0, history.length - session.length))}
          sprint={mode === 'sprint'}
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

function LandingPage({ onGuest }: { onGuest: () => void }) {
  return (
    <main className="landing-shell">
      <MathAtmosphere />
      <header className="landing-nav">
        <span className="brand" aria-label="RecallLab home">
          <b>
            <Zap size={16} />
          </b>
          Recall<span>Lab</span>
        </span>
        <div>
          <button onClick={onGuest}>Continue as guest</button>
          <a href="/signin-with-chatgpt?return_to=/" target="_top">
            Start free
          </a>
        </div>
      </header>
      <section className="landing-hero">
        <div className="landing-copy">
          <small>MENTAL MATH TRAINING FOR COMPETITIVE EXAMS</small>
          <h1>Turn calculation into instant recall.</h1>
          <p>
            Train the exact fractions, tables, squares, cubes, and mental
            patterns that decide speed in SBI PO and IBPS PO quantitative
            aptitude.
          </p>
          <div className="landing-actions">
            <a href="/signin-with-chatgpt?return_to=/" target="_top">
              <User /> Start free with ChatGPT
            </a>
            <button onClick={onGuest}>
              Try without an account <ChevronRight />
            </button>
          </div>
          <div className="landing-trust">
            <span>
              <Check /> No password handled by RecallLab
            </span>
            <span>
              <Check /> Guest practice stays on this device
            </span>
            <span>
              <Check /> Signed-in progress syncs securely
            </span>
          </div>
        </div>
        <aside
          className="landing-preview"
          aria-label="RecallLab training preview"
        >
          <small>EXAMPLE PROGRESS VIEW</small>
          <div className="preview-question">
            <b>7/16</b>
            <span>→</span>
            <strong>43.75%</strong>
          </div>
          <p>Accuracy first. Then faster recall, measured answer by answer.</p>
          <div className="preview-metrics">
            <span>
              <small>ACCURACY</small>
              <b>91%</b>
            </span>
            <span>
              <small>AVG. TIME</small>
              <b>2.4s</b>
            </span>
            <span>
              <small>IMPROVEMENT</small>
              <b>−1.1s</b>
            </span>
          </div>
          <em>
            Illustrative example. Your dashboard uses only your recorded
            practice results.
          </em>
        </aside>
      </section>
      <section className="landing-paths" aria-label="Training paths">
        <article>
          <BookOpen />
          <span>
            <b>Build recall</b>
            <small>Learn core facts with direct and reverse practice.</small>
          </span>
        </article>
        <article>
          <Target />
          <span>
            <b>Attack weak areas</b>
            <small>
              Spaced repetition prioritizes slow or inaccurate facts.
            </small>
          </span>
        </article>
        <article>
          <Clock3 />
          <span>
            <b>Build exam pace</b>
            <small>
              Use Velocity 10 to compare your baseline with day ten.
            </small>
          </span>
        </article>
      </section>
      <footer className="landing-footer">
        <span>
          RecallLab stores practice data only to measure learning progress.
        </span>
        <span>
          Guest mode is device-local · Signed-in mode uses secure cloud storage
        </span>
      </footer>
    </main>
  );
}

function MathAtmosphere() {
  const symbols = [
    '7/16',
    '43.75%',
    '√729',
    '17 × 8',
    '13³',
    '27²',
    '1 5/8',
    '136 ÷ 17',
    '12.5%',
    '19 × 20',
    '33.33%',
    '25²',
    '1/8',
    '2197',
    'x + 1',
    '62.5%',
    '15³',
    '289',
    '3/16',
    '144 ÷ 12',
    '91.66%',
    '35²',
    '11 × 12',
    '∑',
    '÷',
    '×',
    '%',
    '²',
    '³',
    '5/8',
    '37.5%',
    '22 × 7',
    '31²',
    '14³',
    '625',
    '8/9',
    '83.33%',
    '18 × 9',
    '√1024',
    '7³',
    '121',
    '4/15',
    '26 × 6',
    '2 1/4',
    '225%',
    '29²',
    '1728',
    '15 × 16',
    '9/20',
    '45%',
    '23 × 8',
    '34²',
    '11³',
    '75%',
    '5/12',
    '140 ÷ 14',
    '19²',
    '6.25%',
    '13 × 14',
    '10³',
    '7/8',
    '87.5%',
    '30²',
    '24 × 9',
  ];
  return (
    <div className="math-atmosphere" aria-hidden="true">
      {symbols.map((symbol, index) => (
        <span key={`${symbol}-${index}`}>{symbol}</span>
      ))}
    </div>
  );
}

function Header({
  dark,
  setDark,
  view,
  setView,
  onMixed,
  onProfile,
  attempts,
  mastered,
}: {
  dark: boolean;
  setDark: (x: boolean) => void;
  view: string;
  setView: (v: 'dashboard' | 'practiceHub' | 'mastery') => void;
  onMixed: () => void;
  onProfile: () => void;
  attempts: number;
  mastered: number;
}) {
  return (
    <header
      className={`topbar ${view === 'practice' || view === 'summary' ? 'hide' : ''}`}
    >
      <button className="brand" onClick={() => setView('dashboard')}>
        <b>
          <Zap size={16} />
        </b>
        Recall<span>Lab</span>
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
            <small>{mastered} mastered</small>
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
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    addEventListener('keydown', handleEscape);
    return () => removeEventListener('keydown', handleEscape);
  }, [close]);
  return (
    <div className="profile-backdrop" role="presentation">
      <dialog
        open
        className="profile-panel"
        aria-modal="true"
        aria-labelledby="profile-title"
      >
        <header>
          <span>
            <small>LEARNER PROFILE</small>
            <h2 id="profile-title">{user?.displayName || 'Guest learner'}</h2>
          </span>
          <button
            className="icon"
            aria-label="Close profile and settings"
            onClick={close}
          >
            <X />
          </button>
        </header>
        <div className="profile-level">
          <i>
            <User />
          </i>
          <span>
            <b>Level {Math.floor(attempts / 50) + 1}</b>
            <small>
              {attempts} answers · {mastered} mastered facts
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
                : 'Progress synced securely across signed-in devices.'}
            <small>{user.email}</small>
          </p>
        ) : (
          <p>
            Your progress is stored on this device.{' '}
            <a href="/signin-with-chatgpt?return_to=/" target="_top">
              Sign in with ChatGPT
            </a>{' '}
            to keep it across devices.
          </p>
        )}
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
          {user && (
            <button className="delete-progress" onClick={deleteProgress}>
              Delete progress
            </button>
          )}
          {user && (
            <a
              className="sign-out"
              href="/signout-with-chatgpt?return_to=/"
              target="_top"
            >
              Sign out
            </a>
          )}
          <Button onClick={close}>Save preferences</Button>
        </footer>
      </dialog>
    </div>
  );
}
function HomeDashboard({
  today,
  history,
  completedSessions,
  rows,
  start,
  openPractice,
}: {
  today: Try[];
  history: Try[];
  completedSessions: number;
  rows: { t: Topic; score: number; tries: Try[] }[];
  start: (m: Mode) => void;
  openPractice: () => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - 6 + i);
      return history.filter(
        (x) => !x.skipped && day(x.at) === day(d.getTime()),
      );
    }),
    streak = practiceStreak(history),
    velocityDays = Math.min(
      10,
      new Set(
        history.filter((item) => !item.skipped).map((item) => day(item.at)),
      ).size,
    ),
    experienced = completedSessions >= 3 && history.length >= 20,
    earlier = history.slice(0, Math.max(0, history.length - 10)),
    recent = history.slice(-10),
    accuracyNote = experienced
      ? `${accuracy(recent) - accuracy(earlier.slice(-10)) >= 0 ? '+' : ''}${accuracy(recent) - accuracy(earlier.slice(-10))} pts over prior set`
      : 'Complete 3 sessions to unlock trends',
    paceNote = experienced
      ? `${Math.abs((average(recent) - average(earlier.slice(-10))) / 1000).toFixed(1)}s ${average(recent) <= average(earlier.slice(-10)) ? 'faster' : 'to recover'}`
      : 'Baseline builds with every answer',
    interventionRows = rows
      .filter(
        (row) =>
          row.tries.length > 0 &&
          (accuracy(row.tries) < 85 || average(row.tries) > 8000),
      )
      .slice(0, 3),
    recommendedTopic =
      interventionRows[0]?.t ??
      rows.find((row) => row.tries.length)?.t ??
      rows[0].t,
    strongestTopic = [...rows]
      .filter((row) => row.tries.some((item) => !item.skipped))
      .sort(
        (a, b) =>
          accuracy(b.tries) - accuracy(a.tries) ||
          average(a.tries) - average(b.tries),
      )[0];
  return (
    <div className="page home-dashboard">
      <section className="home-hero" aria-label="Today's recommended workout">
        <div className="hero-copy">
          <span className="command-icon">
            <Target />
          </span>
          <div>
            <small>DAILY PRACTICE</small>
            <h1>
              {history.length
                ? "Today's adaptive workout"
                : 'Establish your baseline'}
            </h1>
            <p>
              {history.length
                ? '12 weak facts · 8 scheduled reviews · 5 mixed calculations'
                : 'A focused one-minute diagnostic will reveal your fastest and weakest fact families.'}
            </p>
            <em>
              {history.length
                ? `Recommended because ${TOPICS[recommendedTopic].short} currently needs the most attention.`
                : 'This first result becomes the benchmark for measuring every future gain.'}
            </em>
            <span className="hero-principle">
              Accuracy builds speed. Repetition makes it automatic.
            </span>
          </div>
        </div>
        <div className="hero-actions">
          <div
            className="velocity-progress"
            aria-label={`RecallLab Velocity 10: ${velocityDays} of 10 practice days complete`}
          >
            <span>
              <small>VELOCITY 10</small>
              <b>{velocityDays}/10 practice days</b>
            </span>
            <div>
              {Array.from({ length: 10 }, (_, index) => (
                <i
                  key={index}
                  className={index < velocityDays ? 'active' : ''}
                />
              ))}
            </div>
          </div>
          <Button onClick={() => start(history.length ? 'mixed' : 'sprint')}>
            <Play fill="currentColor" />{' '}
            {history.length ? 'Begin workout' : 'Start diagnostic'}
          </Button>
        </div>
      </section>

      <section
        className="metrics home-pulse"
        aria-label="Today's performance pulse"
      >
        <Metric
          I={Target}
          title="Today's questions"
          value={String(today.length)}
          note={
            experienced
              ? `${recent.length} in your latest set`
              : 'Building your baseline'
          }
          tone="purple"
        />
        <Metric
          I={Check}
          title="Today's accuracy"
          value={today.length ? `${accuracy(today)}%` : 'Unranked'}
          note={accuracyNote}
          tone="green"
        />
        <Metric
          I={Clock3}
          title="Avg. time per question"
          value={today.length ? `${(average(today) / 1000).toFixed(1)}s` : '—'}
          note={paceNote}
          tone="blue"
        />
        <div className="metric streak-metric">
          <i className={streak ? 'fire active' : 'fire empty'}>
            <Flame />
          </i>
          <span>
            <small>Practice streak</small>
            <b>
              {streak} {streak === 1 ? 'day' : 'days'}
            </b>
            <em>
              {experienced
                ? `${days.filter((d) => d.length >= 10).length} target days this week`
                : 'Build a consistent rhythm'}
            </em>
          </span>
          <div className="streak-dots" aria-label="Seven-day practice record">
            {days.map((d, i) => (
              <i
                key={i}
                className={
                  d.length >= 10 && accuracy(d) >= 90
                    ? 'hit'
                    : d.length
                      ? 'active'
                      : ''
                }
                title={`${d.length} questions`}
              />
            ))}
          </div>
        </div>
      </section>

      <section
        className="dashboard-launchpad"
        aria-label="Training control center"
      >
        <div className="launchpad-heading">
          <span>
            <small>TRAINING CONTROL CENTER</small>
            <h2>Choose your next move</h2>
          </span>
          <button onClick={openPractice}>
            See all practice modes <ChevronRight />
          </button>
        </div>
        <div className="training-categories">
          <article className="category-recall">
            <header>
              <BookOpen />
              <span>
                <b>Build recall</b>
                <small>Core facts and adaptive review</small>
              </span>
            </header>
            <div>
              <button onClick={() => start('learn')}>Learn</button>
              <button onClick={() => start('mixed')}>Mixed</button>
            </div>
          </article>
          <article className="category-target">
            <header>
              <Target />
              <span>
                <b>Target weaknesses</b>
                <small>Attack slow or missed facts</small>
              </span>
            </header>
            <div>
              <button onClick={() => start('weak')}>Weak areas</button>
              <button onClick={openPractice}>Focus drill</button>
            </div>
          </article>
          <article className="category-test">
            <header>
              <Check />
              <span>
                <b>Test readiness</b>
                <small>Bank-exam recall checkpoints</small>
              </span>
            </header>
            <div>
              <button onClick={() => start('test10')}>10Q</button>
              <button onClick={() => start('test25')}>25Q</button>
              <button onClick={() => start('test50')}>50Q</button>
            </div>
          </article>
          <article className="category-speed">
            <header>
              <Zap />
              <span>
                <b>Build speed</b>
                <small>Sustained pace and variety</small>
              </span>
            </header>
            <div>
              <button onClick={() => start('sprint')}>1-min sprint</button>
              <button onClick={() => start('random')}>Random</button>
            </div>
          </article>
        </div>
      </section>

      {!!history.length && (
        <section
          className="recent-signal"
          aria-label="Recent performance summary"
        >
          <span>
            <small>RECENT FORM</small>
            <b>{accuracy(recent)}% accuracy</b>
            <em>
              {recent.filter((item) => !item.skipped).length} scored{' '}
              {recent.filter((item) => !item.skipped).length === 1
                ? 'answer'
                : 'answers'}
            </em>
          </span>
          <span>
            <small>RECALL PACE</small>
            <b>{(average(recent) / 1000).toFixed(1)}s average</b>
            <em>{experienced ? paceNote : 'Building a reliable comparison'}</em>
          </span>
          <span>
            <small>STRONGEST TOPIC</small>
            <b>
              {strongestTopic ? TOPICS[strongestTopic.t].short : 'Benchmarking'}
            </b>
            <em>
              {strongestTopic
                ? `${accuracy(strongestTopic.tries)}% accurate`
                : 'Complete more topic sets'}
            </em>
          </span>
          <button onClick={() => start('mixed')}>
            Continue adaptive workout <ChevronRight />
          </button>
        </section>
      )}

      <section
        className="home-intervention panel"
        aria-label="Targeted interventions"
      >
        <Heading over="TARGETED INTERVENTION" title="Needs attention" />
        {!history.length ? (
          <div className="intervention-empty">
            <FlagTriangleRight />
            <span>
              <b>Your first benchmark awaits</b>
              <small>
                Complete the diagnostic to reveal the exact facts that need
                attention.
              </small>
            </span>
          </div>
        ) : !interventionRows.length ? (
          <div className="intervention-empty">
            <Check />
            <span>
              <b>No topic is below the intervention threshold</b>
              <small>
                Every practiced topic is at least 85% accurate and averages 8.0
                seconds or faster.
              </small>
            </span>
          </div>
        ) : (
          <div className="intervention-list">
            {interventionRows.map((r) => (
              <div key={r.t}>
                <i
                  className={
                    r.score >= 90
                      ? 'elite'
                      : r.score >= 50
                        ? 'grinding'
                        : 'target'
                  }
                />
                <span>
                  <b>{TOPICS[r.t].short}</b>
                  <small>{`${accuracy(r.tries)}% accurate · ${(average(r.tries) / 1000).toFixed(1)}s average`}</small>
                </span>
              </div>
            ))}
          </div>
        )}
        {!!history.length && (
          <Button onClick={() => start('weak')}>
            <Target /> Drill weaknesses
          </Button>
        )}
      </section>
    </div>
  );
}

function PracticeHub({
  start,
  topic,
  setTopic,
  group,
  setGroup,
}: {
  start: (m: Mode) => void;
  topic: Topic;
  setTopic: (t: Topic) => void;
  group: string;
  setGroup: (g: string) => void;
}) {
  const groups = [
    'All groups',
    ...new Set(FACTS.filter((f) => f.topic === topic).map((f) => f.group)),
  ];
  const modeGroups: { label: string; title: string; modes: Mode[] }[] = [
    {
      label: 'BUILD RECALL',
      title: 'Learn and reinforce',
      modes: ['learn', 'mixed', 'random'],
    },
    {
      label: 'TARGETED TRAINING',
      title: 'Attack weak facts',
      modes: ['focus', 'weak'],
    },
    {
      label: 'EXAM CHECKPOINTS',
      title: 'Measure accuracy and stamina',
      modes: ['test10', 'test25', 'test50'],
    },
    { label: 'SPEED WORK', title: 'Train sustained pace', modes: ['sprint'] },
  ];
  return (
    <div className="page practice-hub">
      <div className="masteryTitle">
        <span>
          <small>PRACTICE</small>
          <h1>Choose your training session</h1>
          <p>
            Start with the recommended mix or target one specific recall skill.
          </p>
        </span>
      </div>
      <div className="practice-categories" id="practice-modes">
        {modeGroups.map((category) => (
          <section className="panel session-panel" key={category.label}>
            <Heading over={category.label} title={category.title} />
            <div className="modes">
              {MODES.filter(([id]) => category.modes.includes(id)).map(
                ([id, title, copy, I]) => (
                  <button
                    key={id}
                    className={id === 'mixed' ? 'featured' : ''}
                    onClick={() => start(id)}
                  >
                    <i>
                      <I />
                    </i>
                    <span>
                      <b>{title}</b>
                      <small>{copy}</small>
                    </span>
                    <Play className="start-icon" fill="currentColor" />
                  </button>
                ),
              )}
            </div>
          </section>
        ))}
      </div>
      <section className="panel focus-hub">
        <Heading over="FOCUSED PRACTICE" title="Drill a specific group" />
        <div className="focus">
          <select
            aria-label="Practice topic"
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value as Topic);
              setGroup('All groups');
            }}
          >
            {(Object.keys(TOPICS) as Topic[]).map((t) => (
              <option key={t} value={t}>
                {TOPICS[t].name}
              </option>
            ))}
          </select>
          <select
            aria-label="Fact group"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
          >
            {groups.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
          <Button onClick={() => start('focus')}>
            Start drill <ChevronRight />
          </Button>
        </div>
        <p className="focus-note">
          Small fact families are blended with closely related facts to prevent
          repetitive loops.
        </p>
      </section>
    </div>
  );
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
function Metric({
  I,
  title,
  value,
  note,
  tone,
}: {
  I: typeof Target;
  title: string;
  value: string;
  note: string;
  tone: string;
}) {
  return (
    <div className="metric">
      <i className={tone}>
        <I />
      </i>
      <span>
        <small>{title}</small>
        <b>{value}</b>
        <em>{note}</em>
      </span>
    </div>
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
}) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  return (
    <div className="practicePage">
      <header className="practiceHead">
        <button className="brand">
          <b>
            <Zap />
          </b>
          Recall<span>Lab</span>
        </button>
        <span>
          Question {current}
          {limit ? ` of ${limit}` : ''}
        </span>
        <div>
          {left !== null && <b>0:{String(left).padStart(2, '0')}</b>}
          <Button
            variant="outline"
            onClick={() => (skippedCount ? setConfirmEnd(true) : end())}
          >
            End session
          </Button>
        </div>
      </header>
      <section className="quiz">
        <div className="quizline">
          <small>{TOPICS[fact.topic].name}</small>
          <span>
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
          </span>
        </div>
        <div className="qcard">
          <small>{fact.reverse ? 'REVERSE RECALL' : 'DIRECT RECALL'}</small>
          <h1>{fact.q}</h1>
          {input === 'mcq' ? (
            <div className="choices">
              {opts.map((o, i) => (
                <button
                  key={o + i}
                  disabled={!!result}
                  onClick={() => submit(o)}
                  className={
                    result
                      ? norm(o) === norm(fact.a)
                        ? 'correct'
                        : norm(o) === norm(result.raw)
                          ? 'wrong'
                          : ''
                      : ''
                  }
                >
                  <kbd>{i + 1}</kbd>
                  <b>{o}</b>
                  {result && norm(o) === norm(fact.a) && <Check />}
                  {result && !result.ok && norm(o) === norm(result.raw) && (
                    <X />
                  )}
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
                inputMode="decimal"
                autoComplete="off"
              />
              <Button type="submit">Check answer</Button>
            </form>
          )}
          <div
            className={`feedback ${result ? (result.ok ? 'yes' : 'no') : ''}`}
            aria-live="polite"
          >
            {result && (
              <>
                <i>{result.ok ? <Check /> : <X />}</i>
                <span>
                  <b>
                    {result.ok ? 'Correct' : 'Not quite'} —{' '}
                    {(result.ms / 1000).toFixed(2)} sec
                  </b>
                  {!result.ok && <small>Correct answer: {fact.a}</small>}
                </span>
              </>
            )}
          </div>
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
          to skip · accuracy before speed
        </p>
      </section>
      {confirmEnd && (
        <div className="end-backdrop" role="presentation">
          <dialog
            open
            className="end-confirm"
            aria-modal="true"
            aria-labelledby="end-title"
          >
            <small>UNFINISHED REVIEW</small>
            <h2 id="end-title">
              {skippedCount} skipped{' '}
              {skippedCount === 1 ? 'question' : 'questions'} remain
            </h2>
            <p>
              Reviewing them now keeps difficult facts from disappearing from
              this session.
            </p>
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
          </dialog>
        </div>
      )}
    </div>
  );
}
function strategyFor(item: Try) {
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
  home,
  weak,
  retry,
}: {
  tries: Try[];
  prior: Try[];
  sprint: boolean;
  home: () => void;
  weak: () => void;
  retry: (ids: string[]) => void;
}) {
  const [reviewFilter, setReviewFilter] = useState<
    'all' | 'incorrect' | 'skipped'
  >('all');
  const reviewItems = [...new Map(tries.map((x) => [x.id, x])).values()],
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
    previousComparable = prior.slice(-Math.max(tries.length, 10)),
    topics = (Object.keys(TOPICS) as Topic[])
      .map((t) => ({ t, x: tries.filter((a) => a.topic === t) }))
      .filter((x) => x.x.length)
      .sort((a, b) => accuracy(a.x) - accuracy(b.x));
  return (
    <div className="summary">
      <section>
        <i className="done">
          <Check />
        </i>
        <small>SESSION COMPLETE</small>
        <h1>Good work. Keep sharpening.</h1>
        <p>Each accurate repetition moves a fact closer to instant recall.</p>
        <div className="sumstats">
          <span>
            <small>QUESTIONS</small>
            <b>{tries.length}</b>
          </span>
          <span>
            <small>ACCURACY</small>
            <b>{accuracy(tries)}%</b>
          </span>
          <span>
            <small>AVG. RESPONSE</small>
            <b>{tries.length ? (average(tries) / 1000).toFixed(2) : '—'}s</b>
          </span>
          <span>
            <small>FASTEST</small>
            <b>{fast ? (fast / 1000).toFixed(2) : '—'}s</b>
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
                  {average(tries) <= average(previousComparable)
                    ? `${((average(previousComparable) - average(tries)) / 1000).toFixed(2)}s faster`
                    : 'Accuracy-building session'}
                </b>
                <p>
                  Previous: {accuracy(previousComparable)}% at{' '}
                  {(average(previousComparable) / 1000).toFixed(2)}s · Now:{' '}
                  {accuracy(tries)}% at {(average(tries) / 1000).toFixed(2)}s
                </p>
              </>
            ) : (
              <>
                <b>Baseline recorded</b>
                <p>
                  Your next comparable session will show exactly how much
                  accuracy and recall speed changed.
                </p>
              </>
            )}
          </div>
        </div>
        <div className="sumdetail">
          <div>
            <small>WEAKEST TOPIC</small>
            <b>{topics[0] ? TOPICS[topics[0].t].name : 'No weak topic yet'}</b>
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
                    key={item.id}
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
                        <b>{item.q}</b>
                      </span>
                      <em>
                        {item.skipped ? '—' : `${(item.ms / 1000).toFixed(2)}s`}
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
                        <b>{item.a}</b>
                      </span>
                    </div>
                    <div className="review-strategy">
                      <Brain />
                      <span>
                        <b>{strategy.title}</b>
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
        {sprint && (
          <div className="sprint">
            <Zap />
            <b>
              {tries.length} attempted · {tries.length} questions per minute
            </b>
          </div>
        )}
        <footer>
          <Button variant="outline" onClick={home}>
            Back to dashboard
          </Button>
          <Button onClick={weak}>
            <RotateCcw /> Practice weak areas
          </Button>
        </footer>
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
      aria-label="RecallLab impact report"
    >
      <div className="impact-report-head">
        <span>
          <small>MEASURABLE OUTCOMES</small>
          <h2>Your RecallLab impact</h2>
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
                <b>{f.q.replace('= ?', '').replace('→ ?', '')}</b>
                <small>
                  {s
                    ? `${Math.round((s.correct / s.attempts) * 100)}% · ${(s.total / s.attempts / 1000).toFixed(1)}s`
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
        <summary>How RecallLab measures mastery</summary>
        <div>
          <span>
            <b>Accuracy first</b>
            <small>
              A fact cannot become Mastered from one correct answer. RecallLab
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
            <b>Adaptive review</b>
            <small>
              Weak, slow, and overdue facts return more often; strong facts
              remain in occasional review.
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

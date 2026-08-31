'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  ms: number;
  at: number;
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
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const percent = (n: number, d: number) => {
  let reducedDenominator = d / gcd(n, d);
  while (reducedDenominator % 2 === 0) reducedDenominator /= 2;
  while (reducedDenominator % 5 === 0) reducedDenominator /= 5;
  const raw = (n / d) * 100;
  const value =
    reducedDenominator === 1
      ? Number(raw.toFixed(8)).toString()
      : (Math.trunc((raw + Number.EPSILON) * 100) / 100)
          .toFixed(2)
          .replace(/\.00$/, '')
          .replace(/(\.\d)0$/, '$1');
  return `${value}%`;
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
  accuracy = (a: Try[]) =>
    a.length
      ? Math.round((a.filter((x) => x.correct).length / a.length) * 100)
      : 0,
  average = (a: Try[]) =>
    a.length ? a.reduce((n, x) => n + x.ms, 0) / a.length : 0;
function pick(pool: Fact[], stats: Record<string, Stat>, old?: string) {
  const w = pool
      .filter((f) => f.id !== old)
      .map((f) => {
        const s = stats[f.id],
          l = level(s, TOPICS[f.topic].target),
          slow = s && s.total / s.attempts > TOPICS[f.topic].target;
        return {
          f,
          w:
            (l === 'Weak'
              ? 9
              : l === 'Learning'
                ? 5
                : l === 'Strong'
                  ? 2
                  : 0.7) +
            (slow ? 2 : 0) +
            (!s ? 4 : Math.min(3, (Date.now() - s.last) / 259200000)),
        };
      }),
    total = w.reduce((n, x) => n + x.w, 0);
  let r = Math.random() * total;
  return w.find((x) => (r -= x.w) <= 0)?.f || pool[0];
}
function choices(f: Fact) {
  const n = Number(f.a.replace('%', ''));
  if (Number.isNaN(n)) {
    const others = FACTS.filter((x) => x.topic === f.topic && x.id !== f.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((x) => x.a);
    return [f.a, ...others].sort(() => Math.random() - 0.5);
  }
  const d =
    f.topic === 'fractions'
      ? [6.25, -6.25, 12.5]
      : n > 500
        ? [11, -21, 31]
        : [1, -2, 3];
  return [
    f.a,
    ...d.map(
      (x) =>
        `${Math.max(0, Math.round((n + x) * 100) / 100)}${f.a.includes('%') ? '%' : ''}`,
    ),
  ].sort(() => Math.random() - 0.5);
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
    [ready, setReady] = useState(false),
    [mode, setMode] = useState<Mode>('mixed'),
    [session, setSession] = useState<Try[]>([]),
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
    [group, setGroup] = useState('Denominator 2'),
    [left, setLeft] = useState(60);
  const started = useRef(performance.now()),
    field = useRef<HTMLInputElement>(null);
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('recall-lab') || '{}');
      setStats(s.stats || {});
      setHistory(s.history || []);
      setDark(!!s.dark);
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    if (ready)
      localStorage.setItem(
        'recall-lab',
        JSON.stringify({ stats, history: history.slice(-1500), dark }),
      );
  }, [stats, history, dark, ready]);
  const pool = useMemo(() => {
    if (mode === 'learn') return FACTS.filter((f) => !f.reverse);
    if (mode === 'focus')
      return FACTS.filter((f) => f.topic === topic && f.group === group);
    if (mode === 'weak') {
      const p = FACTS.filter((f) =>
        ['Weak', 'Learning'].includes(
          level(stats[f.id], TOPICS[f.topic].target),
        ),
      );
      return p.length ? p : FACTS;
    }
    return FACTS;
  }, [mode, topic, group, stats]);
  function next(old?: string) {
    const f =
      mode === 'random'
        ? pool.filter((x) => x.id !== old)[
            Math.floor(Math.random() * Math.max(1, pool.length - 1))
          ]
        : pick(pool, stats, old);
    setFact(f);
    setOpts(choices(f));
    setAnswer('');
    setResult(null);
    started.current = performance.now();
    setTimeout(() => field.current?.focus(), 20);
  }
  function start(m: Mode) {
    setMode(m);
    setSession([]);
    setLeft(60);
    setView('practice');
    setTimeout(() => {
      const p =
        m === 'focus'
          ? FACTS.filter((f) => f.topic === topic && f.group === group)
          : m === 'learn'
            ? FACTS.filter((f) => !f.reverse)
            : FACTS;
      const f = pick(p, stats);
      setFact(f);
      setOpts(choices(f));
      setResult(null);
      started.current = performance.now();
    }, 0);
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
    setResult({ ok, ms, raw });
    setTimeout(
      () =>
        limit && session.length + 1 >= limit
          ? setView('summary')
          : next(fact.id),
      ok ? 650 : 1150,
    );
  }
  useEffect(() => {
    if (view !== 'practice' || mode !== 'sprint') return;
    const id = setInterval(
      () =>
        setLeft((x) => {
          if (x <= 1) {
            clearInterval(id);
            setTimeout(() => setView('summary'), 0);
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
      if (view === 'practice' && e.key === 'Escape') setView('summary');
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
      <Header
        dark={dark}
        setDark={setDark}
        view={view}
        setView={setView}
        attempts={history.length}
        mastered={mastered}
      />
      {view === 'dashboard' && (
        <HomeDashboard
          today={today}
          history={history}
          rows={topicRows}
          start={start}
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
          current={session.length + 1}
          limit={limit}
          left={mode === 'sprint' ? left : null}
          end={() => setView('summary')}
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
        />
      )}{' '}
      {view === 'mastery' && <Mastery stats={stats} history={history} />}
    </main>
  );
}

function Header({
  dark,
  setDark,
  view,
  setView,
  attempts,
  mastered,
}: {
  dark: boolean;
  setDark: (x: boolean) => void;
  view: string;
  setView: (v: 'dashboard' | 'practiceHub' | 'mastery') => void;
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
      <nav>
        <button
          className={view === 'dashboard' ? 'active' : ''}
          onClick={() => setView('dashboard')}
        >
          Home
        </button>
        <button
          className={view === 'practiceHub' ? 'active' : ''}
          onClick={() => setView('practiceHub')}
        >
          Practice
        </button>
        <button
          className={view === 'mastery' ? 'active' : ''}
          onClick={() => setView('mastery')}
        >
          Progress
        </button>
      </nav>
      <div>
        <div className="nav-xp" aria-label={`Level ${Math.floor(attempts / 50) + 1}, ${attempts % 50} of 50 XP`}>
          <span><b>LVL {Math.floor(attempts / 50) + 1}</b><small>{mastered} mastered</small></span>
          <i><b style={{ width: `${(attempts % 50) * 2}%` }} /></i>
        </div>
        <em>SBI PO · IBPS PO</em>
        <button className="icon" onClick={() => setDark(!dark)}>
          {dark ? <Sun /> : <Moon />}
        </button>
      </div>
    </header>
  );
}
function HomeDashboard({
  today,
  history,
  rows,
  start,
}: {
  today: Try[];
  history: Try[];
  rows: { t: Topic; score: number; tries: Try[] }[];
  start: (m: Mode) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - 6 + i);
      return history.filter((x) => day(x.at) === day(d.getTime()));
    }),
    streak = new Set(history.map((x) => day(x.at))).size,
    experienced = history.length >= 30,
    earlier = history.slice(0, Math.max(0, history.length - 10)),
    recent = history.slice(-10),
    accuracyNote = experienced
      ? `${accuracy(recent) - accuracy(earlier.slice(-10)) >= 0 ? '+' : ''}${accuracy(recent) - accuracy(earlier.slice(-10))} pts over prior set`
      : 'Complete 3 sessions to unlock trends',
    paceNote = experienced
      ? `${Math.abs((average(recent) - average(earlier.slice(-10))) / 1000).toFixed(1)}s ${average(recent) <= average(earlier.slice(-10)) ? 'faster' : 'to recover'}`
      : 'Baseline builds with every answer';
  return (
    <div className="page home-dashboard">
      <section className="home-hero" aria-label="Today's recommended workout">
        <div className="hero-copy">
          <span className="command-icon"><Target /></span>
          <div>
            <small>DAILY PRACTICE</small>
            <h1>{history.length ? "Today's adaptive workout" : 'Establish your baseline'}</h1>
            <p>{history.length ? '12 weak facts · 8 scheduled reviews · 5 mixed calculations' : 'A focused one-minute diagnostic will reveal your fastest and weakest fact families.'}</p>
            <em>{history.length ? `Recommended because ${TOPICS[rows[0].t].short} currently needs the most attention.` : 'This first result becomes the benchmark for measuring every future gain.'}</em>
          </div>
        </div>
        <div className="hero-actions">
          <Button variant="outline" onClick={() => start('mixed')}>Mixed practice</Button>
          <Button onClick={() => start(history.length ? 'mixed' : 'sprint')}><Play fill="currentColor" /> {history.length ? 'Begin workout' : 'Start diagnostic'}</Button>
        </div>
      </section>

      <section className="metrics home-pulse" aria-label="Today's performance pulse">
        <Metric I={Target} title="Today's questions" value={String(today.length)} note={experienced ? `${recent.length} in your latest set` : 'Building your baseline'} tone="purple" />
        <Metric I={Check} title="Today's accuracy" value={`${accuracy(today)}%`} note={accuracyNote} tone="green" />
        <Metric I={Clock3} title="Avg. time per question" value={`${today.length ? (average(today) / 1000).toFixed(1) : '0.0'}s`} note={paceNote} tone="blue" />
        <div className="metric streak-metric">
          <i className={streak ? 'fire active' : 'fire empty'}><Flame /></i>
          <span><small>Practice streak</small><b>{streak} {streak === 1 ? 'day' : 'days'}</b><em>{experienced ? `${days.filter((d) => d.length >= 10).length} target days this week` : 'Build a consistent rhythm'}</em></span>
          <div className="streak-dots" aria-label="Seven-day practice record">{days.map((d, i) => <i key={i} className={d.length >= 10 && accuracy(d) >= 90 ? 'hit' : d.length ? 'active' : ''} title={`${d.length} questions`} />)}</div>
        </div>
      </section>

      <section className="home-intervention panel" aria-label="Targeted interventions">
        <Heading over="TARGETED INTERVENTION" title="Needs attention" />
        {!history.length ? (
          <div className="intervention-empty"><FlagTriangleRight /><span><b>Your first benchmark awaits</b><small>Complete the diagnostic to reveal the exact facts that need attention.</small></span></div>
        ) : (
          <div className="intervention-list">{rows.slice(0, 3).map((r) => <div key={r.t}><i className={r.score >= 90 ? 'elite' : r.score >= 50 ? 'grinding' : 'target'} /><span><b>{TOPICS[r.t].short}</b><small>{r.tries.length ? `${accuracy(r.tries)}% accurate · ${(average(r.tries) / 1000).toFixed(1)}s average` : 'Level 1 · Ready to rank'}</small></span><em>{r.tries.length ? `${r.score}%` : 'UNRANKED'}</em></div>)}</div>
        )}
        <Button onClick={() => start(history.length ? 'weak' : 'sprint')}><Target /> {history.length ? 'Drill Weaknesses' : 'Start diagnostic'}</Button>
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
  const groups = [...new Set(FACTS.filter((f) => f.topic === topic).map((f) => f.group))];
  useEffect(() => { if (!groups.includes(group)) setGroup(groups[0]); }, [topic]);
  return (
    <div className="page practice-hub">
      <div className="masteryTitle"><span><small>PRACTICE</small><h1>Choose your training session</h1><p>Start with the recommended mix or target one specific recall skill.</p></span></div>
      <section className="panel session-panel" id="practice-modes">
        <Heading over="ALL PRACTICE MODES" title="Train with purpose" />
        <div className="modes">{MODES.map(([id, title, copy, I]) => <button key={id} className={id === 'mixed' ? 'featured' : ''} onClick={() => start(id)}><i><I /></i><span><b>{title}</b><small>{copy}</small></span><Play className="start-icon" fill="currentColor" /></button>)}</div>
      </section>
      <section className="panel focus-hub">
        <Heading over="FOCUSED PRACTICE" title="Drill a specific group" />
        <div className="focus"><select value={topic} onChange={(e) => setTopic(e.target.value as Topic)}>{(Object.keys(TOPICS) as Topic[]).map((t) => <option key={t} value={t}>{TOPICS[t].name}</option>)}</select><select value={group} onChange={(e) => setGroup(e.target.value)}>{groups.map((g) => <option key={g}>{g}</option>)}</select><Button onClick={() => start('focus')}>Start drill <ChevronRight /></Button></div>
      </section>
    </div>
  );
}

function Dashboard({
  today,
  history,
  rows,
  mastered,
  stats,
  start,
  topic,
  setTopic,
  group,
  setGroup,
}: {
  today: Try[];
  history: Try[];
  rows: { t: Topic; score: number; tries: Try[] }[];
  mastered: number;
  stats: Record<string, Stat>;
  start: (m: Mode) => void;
  topic: Topic;
  setTopic: (t: Topic) => void;
  group: string;
  setGroup: (g: string) => void;
}) {
  const groups = [
    ...new Set(FACTS.filter((f) => f.topic === topic).map((f) => f.group)),
  ];
  useEffect(() => {
    if (!groups.includes(group)) setGroup(groups[0]);
  }, [topic]);
  const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - 6 + i);
      return {
        label: i === 6 ? 'Today' : `−${6 - i}`,
        tries: history.filter((x) => day(x.at) === day(d.getTime())),
      };
    }),
    streak = new Set(history.map((x) => day(x.at))).size,
    compareSize = Math.min(20, Math.floor(history.length / 2)),
    baseline = compareSize ? history.slice(0, compareSize) : [],
    recent = compareSize ? history.slice(-compareSize) : [],
    paceGain = baseline.length
      ? Math.max(0, (average(baseline) - average(recent)) / 1000)
      : 0,
    accuracyGain = baseline.length ? accuracy(recent) - accuracy(baseline) : 0;
  return (
    <div className="page">
      <section className="welcome">
        <div>
          <small>DAILY PRACTICE</small>
          <h1>Train recall. Build speed.</h1>
          <p>Accuracy first. Speed follows mastery.</p>
        </div>
        <Button onClick={() => start('mixed')}>
          <Play fill="currentColor" /> Start mixed practice
        </Button>
      </section>
      <section className="metrics">
        <Metric
          I={Target}
          title="Today's questions"
          value={String(today.length)}
          note="Keep the rhythm"
          tone="purple"
        />
        <Metric
          I={Check}
          title="Today's accuracy"
          value={`${accuracy(today)}%`}
          note="Aim for 90%+"
          tone="green"
        />
        <Metric
          I={Clock3}
          title="Avg. time per question"
          value={`${today.length ? (average(today) / 1000).toFixed(2) : '0.00'}s`}
          note="Your lap pace"
          tone="blue"
        />
        <Metric
          I={Flame}
          title="Practice streak"
          value={`${streak} days`}
          note="Consistency compounds"
          tone={streak ? 'fire active' : 'fire empty'}
        />
      </section>
      <section
        className="student-command"
        aria-label="Recommended training and progress"
      >
        <div className="recommended-workout">
          <div className="workout-copy">
            <span className="command-icon"><Target /></span>
            <div>
              <small>{history.length ? 'RECOMMENDED · 8 MINUTES' : 'START HERE · 1 MINUTE'}</small>
              <h2>{history.length ? "Today's adaptive workout" : 'Establish your baseline'}</h2>
              <p>{history.length ? '12 weak facts · 8 scheduled reviews · 5 mixed calculations' : 'A short diagnostic will reveal your strongest and slowest fact families.'}</p>
              <em>{history.length ? `Recommended because ${TOPICS[rows[0].t].short.toLowerCase()} currently needs the most attention.` : 'Your first result becomes the benchmark for every future improvement.'}</em>
            </div>
          </div>
          <Button onClick={() => start(history.length ? 'mixed' : 'sprint')}>
            <Play fill="currentColor" /> {history.length ? 'Begin workout' : 'Start diagnostic'}
          </Button>
        </div>
        <div className="impact-card">
          <span className="impact-icon"><BarChart3 /></span>
          <div>
            <small>YOUR RECALLLAB IMPACT</small>
            <h2>{baseline.length ? 'You are measurably improving' : 'Your progress proof starts here'}</h2>
          </div>
          {baseline.length ? (
            <>
              <div className="impact-comparison">
                <span><small>BASELINE</small><b>{(average(baseline) / 1000).toFixed(2)}s</b><em>{accuracy(baseline)}% accurate</em></span>
                <i>→</i>
                <span><small>CURRENT</small><b>{(average(recent) / 1000).toFixed(2)}s</b><em>{accuracy(recent)}% accurate</em></span>
              </div>
              <p><b>{paceGain.toFixed(2)}s faster</b> · {accuracyGain >= 0 ? '+' : ''}{accuracyGain} accuracy points across comparable recent questions.</p>
            </>
          ) : (
            <p>Complete the diagnostic to unlock baseline-versus-current comparisons, weekly gains, and fact-level improvement.</p>
          )}
        </div>
      </section>
      <div className="columns">
        <div className="maincol">
          <section className="panel progress">
            <Heading
              over="OVERALL MASTERY"
              title={mastered ? `${Math.round((mastered / FACTS.length) * 100)}% of recall bank` : 'Unranked · Level 1'}
              extra={mastered ? `${mastered} / ${FACTS.length} mastered` : 'Complete your first run to earn XP'}
            />
            <div className="bigbar">
              <i style={{ width: `${(mastered / FACTS.length) * 100}%` }} />
            </div>
            <div className="topics">
              {rows.map((r) => (
                <div key={r.t}>
                  <span>
                    {TOPICS[r.t].short}
                    <b>{r.tries.length ? `${r.score}%` : 'UNRANKED'}</b>
                  </span>
                  <div
                    className={`topic-ring ${r.score >= 90 ? 'elite' : r.score >= 50 ? 'grinding' : 'target'}`}
                    style={{ '--ring-progress': `${r.score * 3.6}deg` } as React.CSSProperties}
                  >
                    <i />
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="panel session-panel" id="practice-modes">
            <Heading over="PRACTICE MODES" title="Choose your session" />
            <div className="modes">
              {MODES.map(([id, title, copy, I]) => (
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
              ))}
            </div>
          </section>
          <section className="panel">
            <Heading over="FOCUSED PRACTICE" title="Drill a specific group" />
            <div className="focus">
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value as Topic)}
              >
                {(Object.keys(TOPICS) as Topic[]).map((t) => (
                  <option key={t} value={t}>
                    {TOPICS[t].name}
                  </option>
                ))}
              </select>
              <select value={group} onChange={(e) => setGroup(e.target.value)}>
                {groups.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
              <Button onClick={() => start('focus')}>
                Start drill <ChevronRight />
              </Button>
            </div>
          </section>
        </div>
        <aside>
          <section className="panel">
            <Heading over="LAST 7 DAYS" title="Practice rhythm" />
            <div className="chart">
              {days.map((d) => (
                <div key={d.label}>
                  <i className={d.tries.length >= 10 && accuracy(d.tries) >= 90 ? 'hit' : d.tries.length ? 'active' : ''}>
                    {d.tries.length ? d.tries.length : '·'}
                  </i>
                  <small>{d.label}</small>
                </div>
              ))}
            </div>
            <div className="chartstats">
              <span>
                <b>{accuracy(history)}%</b>accuracy
              </span>
              <span>
                <b>
                  {history.length ? (average(history) / 1000).toFixed(1) : '—'}s
                </b>
                response
              </span>
            </div>
          </section>
          <section className="panel weak">
            <Heading over="SMART REVIEW" title="Needs attention" />
            {!history.length ? <div className="diagnostic-empty">
              <span className="starting-line" aria-hidden="true"><FlagTriangleRight /><i /><i /><i /></span>
              <b>Your first benchmark awaits</b>
              <small>Run a 60-second set to reveal your target areas.</small>
              <Button onClick={() => start('sprint')}><Zap /> Take a 1-minute diagnostic test</Button>
            </div> : rows.slice(0, 3).map((r) => (
              <div key={r.t}>
                <i className={r.score >= 90 ? 'elite' : r.score >= 50 ? 'grinding' : 'target'} />
                <span>
                  <b>{TOPICS[r.t].short}</b>
                  <small>
                    {r.tries.length
                      ? `${accuracy(r.tries)}% · ${(average(r.tries) / 1000).toFixed(1)}s avg`
                      : 'Level 1 · Ready to rank'}
                  </small>
                </span>
                <em>{r.tries.length ? `${r.score}%` : 'LVL 1'}</em>
              </div>
            ))}
            {!!history.length && <Button variant="outline" onClick={() => start('weak')}>
              Practice weak areas <ChevronRight />
            </Button>}
          </section>
          <div className="tip">
            <Brain />
            <span>
              <b>Recall principle</b>
              <small>
                Answer accurately, then repeat until the pause disappears.
              </small>
            </span>
          </div>
        </aside>
      </div>
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
  field: React.RefObject<HTMLInputElement | null>;
}) {
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
          <Button variant="outline" onClick={end}>
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
              />
              <Button type="submit">Check answer</Button>
            </form>
          )}
          <div
            className={`feedback ${result ? (result.ok ? 'yes' : 'no') : ''}`}
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
        </div>
        <p>
          <Keyboard /> Press <kbd>1</kbd>–<kbd>4</kbd> to answer · accuracy
          before speed
        </p>
      </section>
    </div>
  );
}
function Summary({
  tries,
  prior,
  sprint,
  home,
  weak,
}: {
  tries: Try[];
  prior: Try[];
  sprint: boolean;
  home: () => void;
  weak: () => void;
}) {
  const wrong = tries.filter((x) => !x.correct),
    review = [...new Map(wrong.map((x) => [x.id, x])).values()].slice(0, 4),
    fast = tries.length ? Math.min(...tries.map((x) => x.ms)) : 0,
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
        <div className="session-impact" aria-label="Session improvement comparison">
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
                <p>Your next comparable session will show exactly how much accuracy and recall speed changed.</p>
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
            <small>FACTS TO REVIEW</small>
            {review.length ? (
              review.map((x) => (
                <p key={x.id}>
                  {x.q} <b>{x.a}</b>
                </p>
              ))
            ) : (
              <p>No errors — excellent control.</p>
            )}
          </div>
        </div>
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
function Mastery({ stats, history }: { stats: Record<string, Stat>; history: Try[] }) {
  const [topic, setTopic] = useState<Topic>('fractions');
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    return {
      label: i === 6 ? 'Today' : `Day ${i + 1}`,
      tries: history.filter((x) => day(x.at) === day(d.getTime())),
    };
  });
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
      <section className="panel progress-rhythm" aria-label="Seven-day practice rhythm">
        <Heading over="PRACTICE RHYTHM" title="Last seven days" />
        <div className="progress-rhythm-grid">
          {days.map((d) => (
            <div key={d.label}>
              <i className={d.tries.length >= 10 && accuracy(d.tries) >= 90 ? 'hit' : d.tries.length ? 'active' : ''}>{d.tries.length || '·'}</i>
              <span><b>{d.label}</b><small>{d.tries.length ? `${accuracy(d.tries)}% · ${(average(d.tries) / 1000).toFixed(1)}s` : 'No session'}</small></span>
            </div>
          ))}
        </div>
      </section>
      <nav>
        {(Object.keys(TOPICS) as Topic[]).map((t) => (
          <button
            key={t}
            className={t === topic ? 'active' : ''}
            onClick={() => setTopic(t)}
          >
            {TOPICS[t].short}
          </button>
        ))}
      </nav>
      <section className="panel">
        <div className="legend">
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
          {FACTS.filter((f) => f.topic === topic).map((f) => {
            const s = stats[f.id],
              l = level(s, TOPICS[topic].target);
            return (
              <div className={l} key={f.id} title={`${f.q} ${f.a}`}>
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
      </section>
    </div>
  );
}

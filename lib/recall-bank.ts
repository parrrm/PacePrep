import { answersMatch } from './recall-math.ts';

export type Topic = 'fractions' | 'tables' | 'squares' | 'cubes' | 'consecutive';
export type Fact = {
  id: string;
  topic: Topic;
  group: string;
  q: string;
  a: string;
  reverse?: boolean;
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
export const percent = (n: number, d: number) => {
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
export function buildRecallBank() {
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
        q: `√${n * n} = ?`,
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
  return f.map((fact) => ({ ...fact, reverse: fact.reverse ?? false }));
}
export const FACTS = buildRecallBank();

export function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function choices(f: Fact) {
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
          !answersMatch(x.a, f.a) &&
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
    return shuffle([f.a, ...others]);
  }
  const usesPercent = f.a.includes('%');
  const exactDistractors = [
    ...new Set(
      FACTS.filter(
        (candidate) =>
          candidate.id !== f.id &&
          !answersMatch(candidate.a, f.a) &&
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

import type { Stat } from './learning-progress.ts';

type PracticeFact = { id: string; topic: string; reverse?: boolean };
export type PracticeReason = 'due' | 'repair' | 'new' | 'retain';

export function practiceReason(
  stat: Stat | undefined,
  now = Date.now(),
): PracticeReason {
  if (!stat?.attempts) return 'new';
  if (!stat.dueAt || stat.dueAt <= now) return 'due';
  if (
    stat.recent.length &&
    (stat.recent.at(-1) === false ||
      stat.recent.filter(Boolean).length / stat.recent.length < 0.8)
  )
    return 'repair';
  return 'retain';
}

function shuffled<T>(items: T[], random: () => number) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.max(0, Math.floor(random() * (i + 1))));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function interleave<T extends PracticeFact>(facts: T[]) {
  const groups = new Map<string, T[]>();
  for (const fact of facts) {
    const bucket = groups.get(fact.topic) ?? [];
    bucket.push(fact);
    groups.set(fact.topic, bucket);
  }
  const result: T[] = [];
  for (let index = 0; result.length < facts.length; index++) {
    for (const bucket of groups.values())
      if (bucket[index]) result.push(bucket[index]);
  }
  return result;
}

/** Due facts cannot be displaced by unpractised facts just because their topic
 * has a smaller bank. Interleave topics within each learning priority. */
export function adaptiveDeck<T extends PracticeFact>(
  pool: T[],
  stats: Record<string, Stat>,
  now = Date.now(),
  random = Math.random,
): T[] {
  const unique = [...new Map(pool.map((fact) => [fact.id, fact])).values()];
  const priorities: PracticeReason[] = ['due', 'repair', 'new', 'retain'];
  return priorities.flatMap((reason) => {
    const candidates = shuffled(
      unique.filter((fact) => practiceReason(stats[fact.id], now) === reason),
      random,
    );
    if (reason === 'due')
      candidates.sort(
        (a, b) => (stats[a.id]?.dueAt ?? 0) - (stats[b.id]?.dueAt ?? 0),
      );
    return interleave(candidates);
  });
}

/** A benchmark always stays inside the caller's pool. It balances available
 * topics and both directions without inventing or repeating questions. */
export function benchmarkDeck<T extends PracticeFact>(
  pool: T[],
  limit: number,
  random = Math.random,
): T[] {
  const unique = [...new Map(pool.map((fact) => [fact.id, fact])).values()];
  const topics = shuffled(
    [...new Set(unique.map((fact) => fact.topic))],
    random,
  );
  const ordered = topics.flatMap((topic) => {
    const direct = shuffled(
      unique.filter((fact) => fact.topic === topic && !fact.reverse),
      random,
    );
    const reverse = shuffled(
      unique.filter((fact) => fact.topic === topic && fact.reverse),
      random,
    );
    const result: T[] = [];
    for (
      let index = 0;
      index < Math.max(direct.length, reverse.length);
      index++
    ) {
      if (direct[index]) result.push(direct[index]);
      if (reverse[index]) result.push(reverse[index]);
    }
    return result;
  });
  return interleave(ordered).slice(0, Math.max(0, Math.floor(limit)));
}

export function sessionSize(mode: string, poolSize: number): number {
  if (mode === 'sprint') return 0;
  const requested = mode === 'test50' ? 50 : mode === 'test25' ? 25 : 10;
  return Math.min(requested, poolSize);
}

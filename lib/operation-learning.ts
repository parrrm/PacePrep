import type { ProgressAttempt, Stat } from './learning-progress.ts';
import { GENERATED_OPERATIONS, seededRandom } from './operation-generator.ts';
import type { GeneratedOperation } from './operation-generator.ts';
import { LEGACY_OPERATION_FACTS, operationsByTopic } from './mental-ops.ts';
import { adaptiveDeck, practiceReason } from './practice-engine.ts';
import { answersMatch } from './recall-math.ts';

const metadata = new Map(GENERATED_OPERATIONS.map((item) => [item.id, item]));

export function skillEvidence(
  history: ProgressAttempt[],
  skill: string,
  mode: 'mcq' | 'typed' = 'typed',
) {
  const items = history
    .filter(
      (item) =>
        metadata.get(item.id)?.skill === skill && item.answerMode === mode,
    )
    .toSorted((a, b) => a.at - b.at)
    .slice(-20);
  const answered = items.filter((item) => !item.skipped);
  const correct = answered.filter((item) => item.correct);
  return {
    attempts: items.length,
    answered: answered.length,
    accuracy: answered.length ? correct.length / answered.length : null,
    paceMs: correct.length
      ? correct.reduce((sum, item) => sum + item.ms, 0) / correct.length
      : null,
    last: items.at(-1)?.at ?? null,
    distinctItems: new Set(answered.map((item) => item.id)).size,
    days: new Set(
      answered.map((item) => new Date(item.at).toISOString().slice(0, 10)),
    ).size,
    confidence:
      answered.length >= 10 &&
      new Set(answered.map((item) => item.id)).size >= 5
        ? 'established'
        : 'early',
  };
}

/** Diagnose candidates, never infer a student's internal method as a fact. */
export function diagnoseOperation(
  id: string,
  raw: string,
): { pattern: string; advice: string } | null {
  const item = metadata.get(id);
  if (!item || !raw.trim() || answersMatch(raw, item.a)) return null;
  const [a, b] = item.operands;
  const candidates = [
    {
      answer: Number(item.a) * 10,
      pattern: 'Possible place-value slip',
      advice: 'Check the number of zeros and estimate the answer’s size.',
    },
    {
      answer: Number(item.a) / 10,
      pattern: 'Possible place-value slip',
      advice: 'Check the number of zeros and estimate the answer’s size.',
    },
    {
      answer:
        item.topic === 'addition'
          ? a - b
          : item.topic === 'subtraction'
            ? a + b
            : item.topic === 'multiplication'
              ? a / b
              : a * b,
      pattern: 'Possible operation mix-up',
      advice: 'Read the operation sign again before calculating.',
    },
    ...(item.topic === 'addition' && (a % 10) + (b % 10) >= 10
      ? [
          {
            answer: Number(item.a) - 10,
            pattern: 'Possible missed carry',
            advice: 'The ones make a new ten. Carry it into the tens column.',
          },
        ]
      : []),
    ...(item.topic === 'multiplication'
      ? [
          {
            answer: a * (b + 1),
            pattern: 'Possible neighboring multiple',
            advice: `Remove one group of ${a}, then retry this multiplication.`,
          },
          {
            answer: a * (b - 1),
            pattern: 'Possible neighboring multiple',
            advice: `Add one group of ${a}, then retry this multiplication.`,
          },
        ]
      : []),
  ];
  const matching = candidates.filter((candidate) =>
    answersMatch(raw, String(candidate.answer)),
  );
  const unique = [
    ...new Map(
      matching.map((candidate) => [candidate.pattern, candidate]),
    ).values(),
  ];
  return unique.length === 1
    ? { pattern: unique[0].pattern, advice: unique[0].advice }
    : null;
}

export function skillStage(
  history: ProgressAttempt[],
  item: GeneratedOperation,
) {
  const evidence = skillEvidence(history, item.skill);
  if (evidence.confidence !== 'established')
    return { stage: 'Learn', level: 1, evidence };
  if ((evidence.accuracy ?? 0) < 0.9)
    return { stage: 'Build accuracy', level: 1, evidence };
  // Promote only after success on the current tier, not repeated easy items.
  const tierReady = (level: number) => {
    const recent = history
      .filter(
        (attempt) =>
          metadata.get(attempt.id)?.skill === item.skill &&
          metadata.get(attempt.id)?.difficulty === level &&
          attempt.answerMode === 'typed',
      )
      .toSorted((a, b) => a.at - b.at)
      .slice(-10);
    return (
      recent.length === 10 &&
      recent.filter((attempt) => attempt.correct && !attempt.skipped).length >=
        9 &&
      new Set(recent.map((attempt) => attempt.id)).size >= 5
    );
  };
  const level = tierReady(2) ? 3 : tierReady(1) ? 2 : 1;
  const fluent = evidence.paceMs !== null && evidence.paceMs <= item.targetMs;
  const stage = !fluent
    ? 'Build fluency'
    : evidence.days >= 3
      ? 'Retention evidence'
      : 'Accurate';
  return { stage, level, evidence };
}

export function operationPracticeDeck(
  topic: GeneratedOperation['topic'],
  history: ProgressAttempt[],
  stats: Record<string, Stat>,
  seed: string,
  now = Date.now(),
) {
  const pool = operationsByTopic(topic);
  const representative = GENERATED_OPERATIONS.find(
    (item) => item.topic === topic,
  )!;
  const allowed = skillStage(history, representative).level;
  return adaptiveDeck(
    pool.filter((item) => {
      const meta = metadata.get(item.id);
      return (
        !meta ||
        meta.difficulty <= allowed ||
        ['due', 'repair'].includes(practiceReason(stats[item.id], now))
      );
    }),
    stats,
    now,
    seededRandom(seed),
  );
}

/** Reserve whole numeric variants across tiers, exclude legacy prompt overlap
 * and previously seen variants. Finite supply exhaustion is reported honestly. */
export function operationBenchmark(
  topic: GeneratedOperation['topic'],
  history: ProgressAttempt[],
  seed: string,
  limit = 10,
  stats: Record<string, Stat> = {},
) {
  const seen = new Set(history.map((item) => item.q));
  const legacy = new Set(LEGACY_OPERATION_FACTS.map((item) => item.q));
  const random = seededRandom(seed);
  const pool = GENERATED_OPERATIONS.filter(
    (item) =>
      item.topic === topic &&
      item.partition === 'benchmark' &&
      !stats[item.id]?.attempts &&
      !seen.has(item.q) &&
      !legacy.has(item.q),
  );
  const tiers = [1, 2, 3].map((level) =>
    pool.filter((item) => item.difficulty === level),
  );
  for (const tier of tiers)
    for (let i = tier.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [tier[i], tier[j]] = [tier[j], tier[i]];
    }
  const result: GeneratedOperation[] = [];
  for (let index = 0; index < pool.length && result.length < limit; index++)
    for (const tier of tiers)
      if (tier[index] && result.length < limit) result.push(tier[index]);
  return result;
}

export function operationMetadata(id: string) {
  return metadata.get(id);
}

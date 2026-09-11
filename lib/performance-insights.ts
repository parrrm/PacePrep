export type PerformanceAttempt = {
  correct: boolean;
  skipped?: boolean;
  ms: number;
  at?: number;
};

export type PerformanceInsight = {
  status: 'unmeasured' | 'accuracy-risk' | 'building' | 'pace-next' | 'ready';
  headline: string;
  what: string;
  why: string;
  next: string;
  accuracy: number | null;
  averageMs: number | null;
  answered: number;
  incorrect: number;
  skipped: number;
};

export function performanceInsight(
  attempts: PerformanceAttempt[],
  paceTargetMs = 3000,
): PerformanceInsight {
  const scored = attempts.filter((attempt) => !attempt.skipped);
  const answered = scored.length;
  const incorrect = scored.filter((attempt) => !attempt.correct).length;
  const skipped = attempts.filter((attempt) => attempt.skipped).length;

  if (!answered) {
    return {
      status: 'unmeasured',
      headline: 'Answer a short set to reveal your priority',
      what: skipped
        ? `${skipped} ${skipped === 1 ? 'question was' : 'questions were'} skipped; no score was estimated.`
        : 'No answers were scored.',
      why: 'Your readiness is still unknown.',
      next: 'Answer 5 or more untimed questions to find your first weakness.',
      accuracy: null,
      averageMs: null,
      answered,
      incorrect,
      skipped,
    };
  }

  const accuracy = Math.round(
    (scored.filter((attempt) => attempt.correct).length / answered) * 100,
  );
  const averageMs =
    scored.reduce(
      (total, attempt) =>
        total + (Number.isFinite(attempt.ms) ? Math.max(0, attempt.ms) : 0),
      0,
    ) / answered;
  const skippedNote = skipped
    ? ` You also skipped ${skipped} ${skipped === 1 ? 'question' : 'questions'}.`
    : '';

  if (accuracy < 70) {
    return {
      status: 'accuracy-risk',
      headline: 'Protect marks before chasing speed',
      what: `${accuracy}% accuracy · ${incorrect} incorrect.${skippedNote}`,
      why: 'Recall errors can turn solvable exam questions into lost marks.',
      next: 'Retry the misses now. Reach 90% accuracy before adding speed.',
      accuracy,
      averageMs,
      answered,
      incorrect,
      skipped,
    };
  }

  if (accuracy < 90) {
    return {
      status: 'building',
      headline: 'Close the remaining accuracy gaps',
      what: `${accuracy}% accuracy · ${incorrect} incorrect.${skippedNote}`,
      why: 'The remaining gaps can still make timed performance unpredictable.',
      next: 'Review each miss and hold 90% accuracy before adding speed.',
      accuracy,
      averageMs,
      answered,
      incorrect,
      skipped,
    };
  }

  if (averageMs > paceTargetMs) {
    return {
      status: 'pace-next',
      headline: 'Your accuracy is ready; recall speed is next',
      what: `${accuracy}% accuracy · ${(averageMs / 1000).toFixed(1)}s per answer.${skippedNote}`,
      why: 'Slow recall can consume time needed for full exam questions.',
      next: 'Keep the accuracy and use a 60-second sprint to reduce hesitation.',
      accuracy,
      averageMs,
      answered,
      incorrect,
      skipped,
    };
  }

  return {
    status: 'ready',
    headline: 'Your recall is becoming exam-ready',
    what: `${accuracy}% accuracy · ${(averageMs / 1000).toFixed(1)}s per answer.${skippedNote}`,
    why: 'Fast, reliable recall leaves more time for exam reasoning.',
    next: 'Return tomorrow to prove retention, then apply it in a mock test.',
    accuracy,
    averageMs,
    answered,
    incorrect,
    skipped,
  };
}

function localDayKey(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function practiceStreak(
  attempts: PerformanceAttempt[],
  now = Date.now(),
) {
  const activeDays = new Set(
    attempts
      .map((attempt) => attempt.at)
      .filter(
        (timestamp): timestamp is number =>
          typeof timestamp === 'number' && Number.isFinite(timestamp),
      )
      .map(localDayKey),
  );
  const cursor = new Date(now);
  let streak = 0;
  while (activeDays.has(localDayKey(cursor.getTime()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function performanceTrend(
  attempts: PerformanceAttempt[],
  windowSize = 10,
) {
  const scored = attempts.filter((attempt) => !attempt.skipped);
  if (windowSize < 1 || scored.length < windowSize * 2) return null;
  const current = scored.slice(-windowSize);
  const previous = scored.slice(-windowSize * 2, -windowSize);
  const accuracyOf = (items: PerformanceAttempt[]) =>
    Math.round(
      (items.filter((attempt) => attempt.correct).length / items.length) * 100,
    );
  const averageOf = (items: PerformanceAttempt[]) =>
    items.reduce((total, attempt) => total + attempt.ms, 0) / items.length;
  return {
    sampleSize: windowSize,
    accuracyDelta: accuracyOf(current) - accuracyOf(previous),
    paceDeltaMs: averageOf(previous) - averageOf(current),
  };
}

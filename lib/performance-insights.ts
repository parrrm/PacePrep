export type PerformanceAttempt = {
  correct: boolean;
  skipped?: boolean;
  ms: number;
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
      headline: 'Your readiness is not measured yet',
      what: skipped
        ? `${skipped} ${skipped === 1 ? 'question was' : 'questions were'} skipped, so there is no accuracy result yet.`
        : 'No answers were scored in this session.',
      why: 'A few answered questions are needed before PacePrep can find a reliable pattern.',
      next: 'Start an untimed set and answer at least 5 questions to create a useful starting point.',
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
      headline: 'Protect your marks with accuracy first',
      what: `${incorrect} of ${answered} answered ${answered === 1 ? 'question was' : 'questions were'} incorrect (${accuracy}% accuracy).${skippedNote}`,
      why: 'At this accuracy, avoidable calculation errors can cancel marks gained on questions you understand.',
      next: 'Retry only the missed questions untimed, use the explanation, then repeat until you reach 90% accuracy.',
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
      headline: 'Turn partial control into reliable marks',
      what: `${answered - incorrect} of ${answered} answered questions were correct (${accuracy}% accuracy).${skippedNote}`,
      why: 'Your method is working, but the remaining errors can still make timed performance unpredictable.',
      next: 'Review each miss, retry the weak facts, and hold 90% accuracy before adding time pressure.',
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
      what: `${accuracy}% accuracy at ${(averageMs / 1000).toFixed(1)} seconds per answer.${skippedNote}`,
      why: 'Reliable answers protect marks, but slow recall can consume time needed for full exam questions.',
      next: 'Keep the same facts accurate while reducing hesitation, then use a timed sprint to check the gain.',
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
    what: `${accuracy}% accuracy at ${(averageMs / 1000).toFixed(1)} seconds per answer.${skippedNote}`,
    why: 'Fast, reliable recall leaves more time and attention for the reasoning inside full exam questions.',
    next: 'Review again later to prove retention, then apply this speed in a full mock test.',
    accuracy,
    averageMs,
    answered,
    incorrect,
    skipped,
  };
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

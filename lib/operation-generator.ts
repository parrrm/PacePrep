/** Version 1 is immutable: IDs identify a mathematical item across devices. */
export type GeneratedOperation = {
  id: string;
  topic: 'addition' | 'subtraction' | 'multiplication' | 'division';
  group: string;
  q: string;
  a: string;
  strategy: string;
  skill: string;
  difficulty: 1 | 2 | 3;
  targetMs: number;
  operands: [number, number];
  steps: string[];
  partition: 'practice' | 'benchmark';
};

/** Small reproducible PRNG. No global Math.random mutation or time dependence. */
export function seededRandom(seed: string) {
  let state = 2166136261;
  for (const char of seed)
    state = Math.imul(state ^ char.charCodeAt(0), 16777619);
  return () => {
    state += 0x6d2b79f5;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildGeneratedOperations(): GeneratedOperation[] {
  const result: GeneratedOperation[] = [];
  for (const difficulty of [1, 2, 3] as const) {
    for (let index = 0; index < 60; index++) {
      const tens = 2 + Math.floor(index / 10);
      const ones = index % 10;
      const left = tens * 10 + ones;
      const right = difficulty === 1 ? 10 : difficulty === 2 ? 19 : 29;
      const factor = difficulty === 1 ? 5 : difficulty === 2 ? 25 : 11;
      const pairs = [
        {
          topic: 'addition' as const,
          a: left,
          b: right,
          answer: left + right,
          symbol: '+',
          steps: [
            `${left} + ${right - (right % 10)} = ${left + right - (right % 10)}`,
            `Add ${right % 10} → ${left + right}`,
          ],
          skill: 'addition-place-value',
        },
        {
          topic: 'subtraction' as const,
          a: left + right,
          b: right,
          answer: left,
          symbol: '−',
          steps: [
            `${left + right} − ${Math.ceil(right / 10) * 10} = ${left + right - Math.ceil(right / 10) * 10}`,
            `Add back ${Math.ceil(right / 10) * 10 - right} → ${left}`,
          ],
          skill: 'subtraction-compensation',
        },
        {
          topic: 'multiplication' as const,
          a: left,
          b: factor,
          answer: left * factor,
          symbol: '×',
          steps: [
            `${tens * 10} × ${factor} = ${tens * 10 * factor}`,
            `${ones} × ${factor} = ${ones * factor}`,
            `Add → ${left * factor}`,
          ],
          skill: 'multiplication-split',
        },
        {
          topic: 'division' as const,
          a: left * factor,
          b: factor,
          answer: left,
          symbol: '÷',
          steps: [
            `${factor} × ${tens * 10} = ${factor * tens * 10}`,
            `Remainder ${factor * ones} = ${factor} × ${ones}`,
            `Quotient ${tens * 10} + ${ones} = ${left}`,
          ],
          skill: 'division-decompose',
        },
      ];
      for (const item of pairs) {
        const prefix = {
          addition: 'add',
          subtraction: 'sub',
          multiplication: 'mul',
          division: 'div',
        }[item.topic];
        result.push({
          id: `${prefix}-v1-${difficulty}-${index}`,
          topic: item.topic,
          group: `Generated ${item.topic} · level ${difficulty}`,
          q: `${item.a} ${item.symbol} ${item.b} = ?`,
          a: String(item.answer),
          strategy: item.steps.join('. '),
          skill: item.skill,
          difficulty,
          targetMs:
            (item.topic === 'addition' ? 4500 : 5500) + difficulty * 1000,
          operands: [item.a, item.b],
          steps: item.steps,
          partition: index % 5 === 4 ? 'benchmark' : 'practice',
        });
      }
    }
  }
  return result;
}

export const GENERATED_OPERATIONS = buildGeneratedOperations();

export function generatedDeck(
  seed: string,
  topic: GeneratedOperation['topic'],
) {
  const random = seededRandom(seed);
  const deck = GENERATED_OPERATIONS.filter(
    (item) => item.topic === topic && item.partition === 'practice',
  );
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

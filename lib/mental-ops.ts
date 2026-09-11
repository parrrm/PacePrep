import { GENERATED_OPERATIONS } from './operation-generator.ts';

/** Legacy IDs remain available so saved progress and exact retries persist. */

export type OpTopic =
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'division';

export type OpFact = {
  id: string;
  topic: OpTopic;
  group: string;
  q: string;
  a: string;
  strategy: string;
};

function fact(
  topic: OpTopic,
  group: string,
  id: string,
  q: string,
  a: number | string,
  strategy: string,
): OpFact {
  return { id, topic, group, q, a: String(a), strategy };
}

function leftToRightAdd(a: number, b: number) {
  const aTens = Math.floor(a / 10) * 10;
  const bTens = Math.floor(b / 10) * 10;
  const ones = (a % 10) + (b % 10);
  if (b < 10) {
    return `${aTens} + ${b} = ${aTens + b}, then + ${a % 10}`;
  }
  return `${aTens}+${bTens}=${aTens + bTens}, ${a % 10}+${b % 10}=${ones}, ${aTens + bTens}+${ones}=${a + b}`;
}

function compensationSub(a: number, b: number) {
  const rounded = Math.ceil(b / 10) * 10;
  if (rounded === b) return `${a} − ${b} = ${a - b}`;
  const extra = rounded - b;
  return `${a} − ${rounded} = ${a - rounded}, add back ${extra} → ${a - b}`;
}

export function buildOperationBank(): OpFact[] {
  const items: OpFact[] = [];
  const seen = new Set<string>();
  const push = (item: OpFact) => {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    items.push(item);
  };

  for (let a = 1; a <= 9; a++) {
    const b = 10 - a;
    push(
      fact(
        'addition',
        'Complements to 10',
        `add-c10-${a}-${b}`,
        `${a} + ${b} = ?`,
        10,
        `${a} and ${b} make 10.`,
      ),
    );
  }

  for (let a = 15; a <= 85; a += 10) {
    const b = 100 - a;
    push(
      fact(
        'addition',
        'Complements to 100',
        `add-c100-${a}-${b}`,
        `${a} + ${b} = ?`,
        100,
        `${a} + ${b} = 100.`,
      ),
    );
  }

  for (let a = 21; a <= 48; a += 3) {
    const b = (a % 9) + 2;
    push(
      fact(
        'addition',
        '2-digit + 1-digit',
        `add-2d1d-${a}-${b}`,
        `${a} + ${b} = ?`,
        a + b,
        leftToRightAdd(a, b),
      ),
    );
  }

  const noCarry: Array<[number, number]> = [
    [21, 34],
    [42, 35],
    [50, 29],
    [63, 14],
    [31, 42],
    [12, 45],
    [70, 18],
    [22, 33],
    [41, 26],
    [15, 23],
    [54, 22],
    [80, 13],
    [36, 21],
    [44, 15],
    [61, 27],
    [13, 54],
  ];
  noCarry.forEach(([a, b]) =>
    push(
      fact(
        'addition',
        '2-digit + 2-digit, no carry',
        `add-nc-${a}-${b}`,
        `${a} + ${b} = ?`,
        a + b,
        leftToRightAdd(a, b),
      ),
    ),
  );

  const carry: Array<[number, number]> = [
    [28, 47],
    [39, 16],
    [57, 28],
    [68, 27],
    [19, 46],
    [35, 47],
    [48, 36],
    [29, 58],
    [17, 25],
    [58, 36],
    [49, 27],
    [67, 18],
    [38, 29],
    [46, 19],
    [24, 39],
    [56, 27],
  ];
  carry.forEach(([a, b]) =>
    push(
      fact(
        'addition',
        '2-digit + 2-digit, carry',
        `add-cy-${a}-${b}`,
        `${a} + ${b} = ?`,
        a + b,
        leftToRightAdd(a, b),
      ),
    ),
  );

  const near: Array<[number, number]> = [
    [99, 16],
    [98, 27],
    [97, 18],
    [96, 34],
    [95, 28],
    [89, 15],
    [88, 26],
    [79, 14],
  ];
  near.forEach(([a, b]) =>
    push(
      fact(
        'addition',
        'Compensation near 100',
        `add-near-${a}-${b}`,
        `${a} + ${b} = ?`,
        a + b,
        `${a} is ${100 - a} under 100. 100 + ${b} = ${100 + b}, subtract ${100 - a} → ${a + b}.`,
      ),
    ),
  );

  const triples: Array<[number, number, number]> = [
    [6, 8, 4],
    [7, 5, 9],
    [3, 8, 7],
    [9, 6, 5],
    [4, 7, 9],
    [8, 8, 6],
    [5, 9, 8],
    [2, 9, 7],
  ];
  triples.forEach(([a, b, c]) =>
    push(
      fact(
        'addition',
        'Three small addends',
        `add-3-${a}-${b}-${c}`,
        `${a} + ${b} + ${c} = ?`,
        a + b + c,
        `Pair a 10 if you can (${a}+${b}=${a + b}), then + ${c}.`,
      ),
    ),
  );

  for (let a = 1; a <= 9; a++) {
    push(
      fact(
        'subtraction',
        'Complements to 10',
        `sub-c10-10-${a}`,
        `10 − ${a} = ?`,
        10 - a,
        `${a} and ${10 - a} make 10.`,
      ),
    );
  }

  for (let a = 15; a <= 85; a += 10) {
    push(
      fact(
        'subtraction',
        'Subtract from 100',
        `sub-100-${a}`,
        `100 − ${a} = ?`,
        100 - a,
        `100 − ${a} = ${100 - a}.`,
      ),
    );
  }

  const subNoBorrow: Array<[number, number]> = [
    [48, 23],
    [67, 31],
    [59, 14],
    [86, 42],
    [75, 20],
    [38, 15],
    [94, 51],
    [66, 32],
    [47, 16],
    [89, 40],
    [55, 12],
    [73, 41],
  ];
  subNoBorrow.forEach(([a, b]) =>
    push(
      fact(
        'subtraction',
        '2-digit − 2-digit, no borrow',
        `sub-nb-${a}-${b}`,
        `${a} − ${b} = ?`,
        a - b,
        `${Math.floor(a / 10) * 10} − ${Math.floor(b / 10) * 10} = ${Math.floor(a / 10) * 10 - Math.floor(b / 10) * 10}, ones ${a % 10} − ${b % 10} = ${(a % 10) - (b % 10)}.`,
      ),
    ),
  );

  const subBorrow: Array<[number, number]> = [
    [52, 28],
    [71, 36],
    [40, 17],
    [63, 29],
    [81, 47],
    [90, 38],
    [54, 19],
    [72, 45],
    [31, 18],
    [60, 24],
    [83, 57],
    [44, 26],
  ];
  subBorrow.forEach(([a, b]) =>
    push(
      fact(
        'subtraction',
        '2-digit − 2-digit, borrow',
        `sub-br-${a}-${b}`,
        `${a} − ${b} = ?`,
        a - b,
        compensationSub(a, b),
      ),
    ),
  );

  const subComp: Array<[number, number]> = [
    [93, 48],
    [81, 39],
    [74, 28],
    [62, 19],
    [85, 47],
    [70, 38],
    [91, 26],
    [64, 29],
  ];
  subComp.forEach(([a, b]) =>
    push(
      fact(
        'subtraction',
        'Compensation subtraction',
        `sub-comp-${a}-${b}`,
        `${a} − ${b} = ?`,
        a - b,
        compensationSub(a, b),
      ),
    ),
  );

  const mulShortcuts: Array<[number, number, string]> = [
    [24, 5, '×5 = ×10 ÷ 2. 24×10=240, ÷2=120.'],
    [36, 5, '×5 = ×10 ÷ 2. 36×10=360, ÷2=180.'],
    [48, 5, '×5 = ×10 ÷ 2. 48×10=480, ÷2=240.'],
    [18, 4, '×4 = double twice. 18×2=36, ×2=72.'],
    [26, 4, '×4 = double twice. 26×2=52, ×2=104.'],
    [35, 4, '×4 = double twice. 35×2=70, ×2=140.'],
    [16, 8, '×8 = double three times. 16→32→64→128.'],
    [21, 8, '×8 = double three times. 21→42→84→168.'],
    [14, 25, '×25 = ×100 ÷ 4. 14×100=1400, ÷4=350.'],
    [16, 25, '×25 = ×100 ÷ 4. 16×100=1600, ÷4=400.'],
    [24, 25, '×25 = ×100 ÷ 4. 24×100=2400, ÷4=600.'],
    [18, 50, '×50 = ×100 ÷ 2. 18×100=1800, ÷2=900.'],
    [23, 50, '×50 = ×100 ÷ 2. 23×100=2300, ÷2=1150.'],
    [32, 11, '×11: 3+2=5, so 352.'],
    [43, 11, '×11: 4+3=7, so 473.'],
    [54, 11, '×11: 5+4=9, so 594.'],
    [27, 11, '×11: 2+7=9, so 297.'],
    [36, 15, '36×10 + 36×5 = 360 + 180 = 540.'],
    [24, 15, '24×10 + 24×5 = 240 + 120 = 360.'],
    [18, 15, '18×10 + 18×5 = 180 + 90 = 270.'],
    [42, 15, '42×10 + 42×5 = 420 + 210 = 630.'],
    [98, 7, '100×7=700, subtract 2×7=14 → 686.'],
    [99, 6, '100×6=600, subtract 6 → 594.'],
    [97, 8, '100×8=800, subtract 3×8=24 → 776.'],
    [96, 9, '100×9=900, subtract 4×9=36 → 864.'],
    [31, 6, '30×6=180, +6=186.'],
    [41, 7, '40×7=280, +7=287.'],
    [52, 6, '50×6=300, +12=312.'],
    [61, 8, '60×8=480, +8=488.'],
    [72, 3, '70×3=210, +6=216.'],
    [81, 4, '80×4=320, +4=324.'],
    [29, 6, '30×6=180, subtract 6 → 174.'],
    [39, 7, '40×7=280, subtract 7 → 273.'],
    [19, 8, '20×8=160, subtract 8 → 152.'],
    [49, 6, '50×6=300, subtract 6 → 294.'],
  ];
  mulShortcuts.forEach(([a, b, strategy]) =>
    push(
      fact(
        'multiplication',
        b === 11
          ? '×11'
          : b === 25 || b === 50
            ? '×25 and ×50'
            : a >= 96
              ? 'Near 100'
              : 'Split and double',
        `mul-${a}-${b}`,
        `${a} × ${b} = ?`,
        a * b,
        strategy,
      ),
    ),
  );

  const divExact: Array<[number, number, string]> = [
    [84, 4, 'Half twice. 84÷2=42, ÷2=21.'],
    [96, 4, 'Half twice. 96÷2=48, ÷2=24.'],
    [72, 8, 'Half three times. 72→36→18→9.'],
    [96, 8, 'Half three times. 96→48→24→12.'],
    [125, 5, '÷5 = ×2 ÷10. 125×2=250, ÷10=25.'],
    [240, 5, '÷5 = ×2 ÷10. 240×2=480, ÷10=48.'],
    [175, 5, '÷5 = ×2 ÷10. 175×2=350, ÷10=35.'],
    [200, 25, '÷25 = ×4 ÷100. 200×4=800, ÷100=8.'],
    [350, 25, '÷25 = ×4 ÷100. 350×4=1400, ÷100=14.'],
    [450, 25, '÷25 = ×4 ÷100. 450×4=1800, ÷100=18.'],
    [360, 12, '12×30=360.'],
    [144, 12, '12×12=144.'],
    [156, 12, '12×13=156.'],
    [168, 12, '12×14=168.'],
    [132, 11, '11×12=132.'],
    [165, 11, '11×15=165.'],
    [198, 11, '11×18=198.'],
    [91, 7, 'Recall 7 × 13 = 91, so 91 ÷ 7 = 13.'],
    [84, 7, 'Recall 7 × 12 = 84, so 84 ÷ 7 = 12.'],
    [96, 6, 'Recall 6 × 16 = 96, so 96 ÷ 6 = 16.'],
    [108, 9, '9×12=108.'],
    [135, 9, '9×15=135.'],
    [162, 9, '9×18=162.'],
    [128, 8, '8×16=128.'],
    [112, 8, '8×14=112.'],
    [105, 7, '7×15=105.'],
    [119, 7, '7×17=119.'],
    [133, 7, '7×19=133.'],
    [248, 8, 'Half three times. 248→124→62→31.'],
    [155, 5, '÷5 = ×2 ÷10. 155×2=310, ÷10=31.'],
  ];
  divExact.forEach(([a, b, strategy]) =>
    push(
      fact(
        'division',
        b === 25
          ? '÷25'
          : b === 5
            ? '÷5'
            : b === 4 || b === 8
              ? 'Halving'
              : 'Exact short division',
        `div-${a}-${b}`,
        `${a} ÷ ${b} = ?`,
        a / b,
        strategy,
      ),
    ),
  );

  return items;
}

export const LEGACY_OPERATION_FACTS = buildOperationBank();
const legacyPrompts = new Set(LEGACY_OPERATION_FACTS.map((item) => item.q));
export const OPERATION_FACTS = [
  ...LEGACY_OPERATION_FACTS,
  ...GENERATED_OPERATIONS.filter(
    (item) => item.partition === 'practice' && !legacyPrompts.has(item.q),
  ),
];

export const OPERATION_TARGETS: Record<OpTopic, number> = {
  addition: 5500,
  subtraction: 6000,
  multiplication: 7000,
  division: 7000,
};

export function operationsByTopic(topic: OpTopic) {
  return OPERATION_FACTS.filter((item) => item.topic === topic);
}

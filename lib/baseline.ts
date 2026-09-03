export type BaselineAttempt = {
  id: string;
  topic: 'fractions' | 'tables' | 'squares' | 'cubes' | 'consecutive';
  q: string;
  a: string;
  raw: string;
  correct: boolean;
  skipped?: boolean;
  ms: number;
  at: number;
  answerMode?: 'mcq' | 'typed';
};

// A small, deliberately varied starting sample; no duplicate fact in a baseline.
export const BASELINE_FACTS = [
  {
    id: 'f7-16',
    topic: 'fractions',
    q: '7/16 → ?%',
    a: '43.75%',
    choices: ['37.5%', '43.75%', '56.25%', '62.5%'],
  },
  {
    id: 't17-8',
    topic: 'tables',
    q: '17 × 8 = ?',
    a: '136',
    choices: ['126', '144', '136', '128'],
  },
  {
    id: 's27',
    topic: 'squares',
    q: '27² = ?',
    a: '729',
    choices: ['729', '649', '739', '841'],
  },
  {
    id: 'f3-8r',
    topic: 'fractions',
    q: '37.5% → ?',
    a: '3/8',
    choices: ['3/5', '5/8', '3/4', '3/8'],
  },
  {
    id: 'c13',
    topic: 'cubes',
    q: '13³ = ?',
    a: '2197',
    choices: ['1728', '2197', '2744', '2187'],
  },
  {
    id: 't23-6r',
    topic: 'tables',
    q: '138 ÷ 23 = ?',
    a: '6',
    choices: ['8', '4', '6', '7'],
  },
  {
    id: 'm16',
    topic: 'consecutive',
    q: '16 × 17 = ?',
    a: '272',
    choices: ['262', '282', '256', '272'],
  },
  {
    id: 'f1-8',
    topic: 'fractions',
    q: '1/8 → ?%',
    a: '12.5%',
    choices: ['12.5%', '8%', '8.25%', '15%'],
  },
  {
    id: 's31r',
    topic: 'squares',
    q: '?² = 961',
    a: '31',
    choices: ['29', '33', '31', '39'],
  },
  {
    id: 'c12r',
    topic: 'cubes',
    q: '?³ = 1728',
    a: '12',
    choices: ['14', '12', '11', '13'],
  },
  {
    id: 't29-7',
    topic: 'tables',
    q: '29 × 7 = ?',
    a: '203',
    choices: ['193', '196', '213', '203'],
  },
  {
    id: 'f5-8',
    topic: 'fractions',
    q: '5/8 → ?%',
    a: '62.5%',
    choices: ['62.5%', '58%', '67.5%', '75%'],
  },
] satisfies Array<
  Pick<BaselineAttempt, 'id' | 'topic' | 'q' | 'a'> & { choices: string[] }
>;

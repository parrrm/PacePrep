/** Practice-home information architecture for PacePrep. */

export const RECALL_FACT_FAMILY_IDS = [
  'fractions',
  'tables',
  'powers',
  'percentages',
] as const;

export const OPERATION_FAMILY_IDS = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
] as const;

export type RecallFactFamilyId = (typeof RECALL_FACT_FAMILY_IDS)[number];
export type OperationFamilyId = (typeof OPERATION_FAMILY_IDS)[number];
export type PracticeFamilyId = RecallFactFamilyId | OperationFamilyId;

export const OPERATION_FAMILIES: Record<
  OperationFamilyId,
  { title: string; copy: string; color: string }
> = {
  addition: {
    title: 'Addition',
    copy: 'Left-to-right sums and compensation, held in your head.',
    color: 'green',
  },
  subtraction: {
    title: 'Subtraction',
    copy: 'Borrow, complements, and subtract-from-100 without paper.',
    color: 'blue',
  },
  multiplication: {
    title: 'Multiplication',
    copy: 'Split factors and near-base products on top of tables.',
    color: 'amber',
  },
  division: {
    title: 'Division',
    copy: 'Reverse tables and exact short division in your head.',
    color: 'violet',
  },
};

export const PRACTICE_HUB_COPY = {
  eyebrow: 'PRACTICE HUB',
  title: 'Choose a quick focus',
  intro: 'Turn a short break into recall or mental-operation practice.',
  recallEyebrow: 'RECALL FACTS',
  recallTitle: 'Automatic pairs and tables',
  recallIntro:
    'Quick recall sets for fractions, percentages, tables, squares, and cubes.',
  opsEyebrow: 'MENTAL OPERATIONS',
  opsTitle: 'Add, subtract, multiply, divide in your head',
  opsIntro:
    'Ten-question mental drills with one practical strategy after every answer.',
  opsReadyLabel: 'Open',
  mixedEyebrow: 'CROSS-CATEGORY TRAINING',
  mixedTitle: 'Mixed review & timed practice',
  mixedIntro:
    'Use a spare minute to review due facts and recent mistakes first.',
} as const;

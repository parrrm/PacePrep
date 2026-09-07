/** Practice-home information architecture for PacePrep. */

export const RECALL_FACT_FAMILY_IDS = [
  'fractions',
  'tables',
  'squares',
  'cubes',
  'consecutive',
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
  title: 'Choose what to train',
  intro:
    'Recall facts first. Mental operations train + − × ÷ without pen or paper.',
  recallEyebrow: 'RECALL FACTS',
  recallTitle: 'Automatic pairs and tables',
  recallIntro:
    'Fractions ↔ percentages, tables, squares, cubes, and consecutive products. Practise each direction separately.',
  opsEyebrow: 'MENTAL OPERATIONS',
  opsTitle: 'Add, subtract, multiply, divide in your head',
  opsIntro:
    'Procedure fluency, not written algorithms. Type the answer; a strategy line appears after you check.',
  opsReadyLabel: 'Open',
  mixedEyebrow: 'CROSS-CATEGORY TRAINING',
  mixedTitle: 'Mixed / due reviews',
  mixedIntro:
    'Review recall facts and mental operations together, with due and weak items prioritised.',
} as const;

export function isRecallFamily(
  value: string | null,
): value is RecallFactFamilyId {
  return RECALL_FACT_FAMILY_IDS.some((id) => id === value);
}

export function isOperationFamily(
  value: string | null,
): value is OperationFamilyId {
  return OPERATION_FAMILY_IDS.some((id) => id === value);
}

/** Keep family selection in the URL so reload and browser Back preserve it. */
export function practiceHref(
  family: PracticeFamilyId | 'mixed',
  isolated = false,
) {
  const params = new URLSearchParams();
  if (isolated) params.set('grok-test', '1');
  if (isOperationFamily(family)) {
    params.set('family', family);
    return `/ops?${params}`;
  }
  params.set('practice', family);
  return `/?${params}`;
}

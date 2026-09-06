/** Shared trainer types, fact bank, and session helpers. */

import { answersMatch } from '@/lib/recall-math';
import { OPERATION_FACTS, OPERATION_TARGETS } from '@/lib/mental-ops';

export type Topic = 'fractions' | 'tables' | 'squares' | 'cubes' | 'consecutive' | 'addition' | 'subtraction' | 'multiplication' | 'division';
export type PracticeCategory = 'fractions' | 'tables' | 'powers' | 'percentages';
export type Level = 'Weak' | 'Learning' | 'Strong' | 'Mastered';
export type Mode =
  | 'learn'
  | 'focus'
  | 'mixed'
  | 'weak'
  | 'random'
  | 'test10'
  | 'test25'
  | 'test50'
  | 'sprint';
export type Fact = {
  id: string;
  topic: Topic;
  group: string;
  q: string;
  a: string;
  reverse?: boolean;
  strategy?: string;
};
export type Stat = {
  attempts: number;
  correct: number;
  total: number;
  best: number;
  recent: boolean[];
  last: number;
  box?: number;
  intervalDays?: number;
  dueAt?: number;
  lapses?: number;
};
export type Try = {
  id: string;
  topic: Topic;
  q: string;
  a: string;
  correct: boolean;
  skipped?: boolean;
  raw?: string;
  ms: number;
  at: number;
  sessionId?: string;
  answerMode?: 'mcq' | 'typed';
};
export type AuthUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
};
export type AuthStatus = 'checking' | 'anonymous' | 'guest' | 'signed-in';
export type CloudStatus = 'idle' | 'saving' | 'saved' | 'error';
export type SavedProgress = {
  stats?: Record<string, Stat>;
  history?: Try[];
  completedSessions?: number;
  dark?: boolean;
  input?: 'mcq' | 'typed';
};
export const LEGACY_STORAGE_KEY = 'recall-lab';
export const DAY_MS = 86_400_000;
export const LEITNER_INTERVALS = [0, 1, 3, 7, 14, 30];
export const TOPICS: Record<Topic, { name: string; short: string; target: number }> = {
  fractions: {
    name: 'Fraction \u2194 Percentage',
    short: 'Fractions',
    target: 2600,
  },
  tables: { name: 'Multiplication Tables', short: 'Tables', target: 2200 },
  squares: { name: 'Squares', short: 'Squares', target: 2000 },
  cubes: { name: 'Cubes', short: 'Cubes', target: 2200 },
  consecutive: {
    name: 'Consecutive Multiplication',
    short: 'Consecutive',
    target: 2800,
  },
  addition: { name: 'Mental Addition', short: 'Addition', target: OPERATION_TARGETS.addition },
  subtraction: {
    name: 'Mental Subtraction',
    short: 'Subtraction',
    target: OPERATION_TARGETS.subtraction,
  },
  multiplication: {
    name: 'Mental Multiplication',
    short: 'Multiplication',
    target: OPERATION_TARGETS.multiplication,
  },
  division: { name: 'Mental Division', short: 'Division', target: OPERATION_TARGETS.division },
};

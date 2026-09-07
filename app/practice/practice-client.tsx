'use client';

import {
  BookOpen,
  Brain,
  ChevronRight,
  Divide,
  Grid3X3,
  Minus,
  Plus,
  Target,
  X,
  Zap,
} from 'lucide-react';
import { SiteLink as Link } from '@/app/site-link';
import {
  OPERATION_FAMILIES,
  PRACTICE_HUB_COPY,
  type OperationFamilyId,
  practiceHref,
} from '@/lib/practice-families';
import PracticeNavigation, {
  useIsolatedPractice,
} from '@/app/practice-navigation';

const RECALL = [
  {
    family: 'fractions',
    title: 'Fractions ↔ percentages',
    copy: 'Recall banking-exam fraction and percentage pairs in both directions.',
    icon: BookOpen,
    color: 'violet',
  },
  {
    family: 'tables',
    title: 'Tables',
    copy: 'Recall tables 12–30 and their reverse division facts.',
    icon: Grid3X3,
    color: 'blue',
  },
  {
    family: 'squares',
    title: 'Squares',
    copy: 'Recall squares up to 35² and identify their roots.',
    icon: Brain,
    color: 'amber',
  },
  {
    family: 'cubes',
    title: 'Cubes',
    copy: 'Recall cubes up to 15³ and identify their roots.',
    icon: Brain,
    color: 'green',
  },
  {
    family: 'consecutive',
    title: 'Consecutive products',
    copy: 'Recall neighbouring-number products from 11 × 12 to 19 × 20.',
    icon: Zap,
    color: 'violet',
  },
] as const;

const ICONS = {
  addition: Plus,
  subtraction: Minus,
  multiplication: X,
  division: Divide,
} as const;

export default function PracticeHubPage({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const isolated = useIsolatedPractice();
  const Container = embedded ? 'div' : 'main';
  return (
    <Container className="page practice-hub practice-hub-v4">
      {!embedded && <PracticeNavigation />}
      <div className="masteryTitle">
        <span>
          <small>{PRACTICE_HUB_COPY.eyebrow}</small>
          <h1>Practice</h1>
          <p>{PRACTICE_HUB_COPY.intro}</p>
        </span>
      </div>

      <section className="practice-family" aria-labelledby="recall-facts-title">
        <header>
          <small>{PRACTICE_HUB_COPY.recallEyebrow}</small>
          <h2 id="recall-facts-title">{PRACTICE_HUB_COPY.recallTitle}</h2>
          <p>{PRACTICE_HUB_COPY.recallIntro}</p>
        </header>
        <section className="domain-grid" aria-label="Recall fact categories">
          {RECALL.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={practiceHref(item.family, isolated)}
                className="practice-family-card"
                aria-label={item.title}
              >
                <header>
                  <i className={item.color}>
                    <Icon />
                  </i>
                </header>
                <span>
                  <b>{item.title}</b>
                  <small>{item.copy}</small>
                </span>
                <footer>
                  <span>
                    <small>TRAINER</small>
                    <strong>Open</strong>
                  </span>
                  <ChevronRight />
                </footer>
              </Link>
            );
          })}
        </section>
      </section>

      <section className="practice-family" aria-labelledby="mental-ops-title">
        <header>
          <small>{PRACTICE_HUB_COPY.opsEyebrow}</small>
          <h2 id="mental-ops-title">{PRACTICE_HUB_COPY.opsTitle}</h2>
          <p>{PRACTICE_HUB_COPY.opsIntro}</p>
        </header>
        <section
          className="domain-grid"
          aria-label="Mental operation categories"
        >
          {(Object.keys(OPERATION_FAMILIES) as OperationFamilyId[]).map(
            (key) => {
              const meta = OPERATION_FAMILIES[key];
              const Icon = ICONS[key];
              return (
                <Link
                  key={key}
                  href={practiceHref(key, isolated)}
                  className="practice-family-card"
                  aria-label={meta.title + ' mental operations'}
                >
                  <header>
                    <i className={meta.color}>
                      <Icon />
                    </i>
                    <em>OPEN</em>
                  </header>
                  <span>
                    <b>{meta.title}</b>
                    <small>{meta.copy}</small>
                  </span>
                  <footer>
                    <span>
                      <small>IN YOUR HEAD</small>
                      <strong>Choose a drill</strong>
                    </span>
                    <ChevronRight />
                  </footer>
                </Link>
              );
            },
          )}
        </section>
      </section>

      <section className="mixed-review-row">
        <span>
          <i>
            <Target />
          </i>
          <span>
            <small>{PRACTICE_HUB_COPY.mixedEyebrow}</small>
            <h2>{PRACTICE_HUB_COPY.mixedTitle}</h2>
            <p>{PRACTICE_HUB_COPY.mixedIntro}</p>
          </span>
        </span>
        <div>
          <Link href={practiceHref('mixed', isolated)}>
            Open mixed / due reviews
          </Link>
        </div>
      </section>

      <p className="practice-scope">
        Guest progress stays on this device. PacePrep trains arithmetic recall
        and mental operations; it is not a full quant syllabus, a mock test, or
        a score guarantee.
      </p>
      <p>
        <Link href={isolated ? '/?grok-test=1' : '/'}>
          Back to PacePrep home
        </Link>
      </p>
    </Container>
  );
}

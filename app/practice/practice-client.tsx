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
} from '@/lib/practice-families';
import { operationsByTopic } from '@/lib/mental-ops';

const RECALL = [
  {
    href: '/?practice=fractions',
    title: 'Fractions',
    copy: 'Recognise and reconstruct simplified fraction forms.',
    icon: BookOpen,
    color: 'violet',
  },
  {
    href: '/?practice=tables',
    title: 'Tables',
    copy: 'Tables 12-30 with multiplication and division recall.',
    icon: Grid3X3,
    color: 'blue',
  },
  {
    href: '/?practice=powers',
    title: 'Squares and cubes',
    copy: 'Roots and powers in both directions.',
    icon: Brain,
    color: 'amber',
  },
  {
    href: '/?practice=percentages',
    title: 'Percentages',
    copy: 'Exact banking-exam fraction-percentage pairs.',
    icon: Zap,
    color: 'green',
  },
] as const;

const ICONS = {
  addition: Plus,
  subtraction: Minus,
  multiplication: X,
  division: Divide,
} as const;

export default function PracticeHubPage() {
  return (
    <main className="page practice-hub practice-hub-v4">
      <div className="masteryTitle">
        <span>
          <small>{PRACTICE_HUB_COPY.eyebrow}</small>
          <h1>{PRACTICE_HUB_COPY.title}</h1>
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
                href={item.href}
                className="practice-category-link"
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
                  href={`/ops?family=${key}`}
                  className="practice-category-link"
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
                      <small>BANK</small>
                      <strong>{operationsByTopic(key).length} facts</strong>
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
          <Link href="/?practice=all">Open recall trainer</Link>
          <Link href="/ops">Open operations</Link>
        </div>
      </section>

      <p>
        <Link href="/">Back to PacePrep home</Link>
      </p>
    </main>
  );
}

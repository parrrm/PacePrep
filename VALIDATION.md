# PacePrep V1 + installable web app — validation

## What this iteration covers

- Live 12-fact / 60-second homepage baseline, without an account gate.
- Explicit 18+ agreement before saving or syncing; unsaved diagnostic answers remain in memory.
- Exact BigInt-based fraction/decimal equivalence and decimal-slip coaching.
- Baseline import with de-duplication; comparisons use matching facts in the same answer mode.
- Strong green/amber answer feedback, reduced-motion support, and expandable results analysis.
- Correct elapsed-time sprint rates, deadline enforcement, double-submit protection, and auto-next cleanup.
- Targeted weak-topic routing, consistent category mastery denominators, and focus-trapped settings.
- Android/iOS web-app manifest/icons/install help, a public offline reconnect screen, and explicit update confirmation.
- No private API/auth caching. Guest deletion is available; signed-in deletion does not immediately recreate an empty record through autosave.
- Standard document links for brochure/auth pages, avoiding a reproduced Vinext client-link transition failure.

## Automated checks

`pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test` and `pnpm build` pass.
Nine unit tests cover exact grading, invalid inputs, decimal slips, sprint rates,
the baseline bank, manifest icons, and service-worker privacy/fallback behavior.
The browser smoke script covers the new-user journey and 390px mobile layouts.
It uses isolated test contexts and mocked authentication; it does not test a
real OAuth account or publish student data.

## Performance measurement — 4 September 2026

Lighthouse 13.4.1, mobile simulation, local production Worker build:

| Measure | Result |
| --- | ---: |
| Performance | 98/100 |
| Accessibility | 100/100 |
| Best practices | 96/100 |
| SEO | 100/100 |
| Largest Contentful Paint | 2.1 seconds |
| Cumulative Layout Shift | 0 |
| Total Blocking Time | 0 ms |

The best-practices deduction is the expected unauthenticated `401` from the
private progress endpoint. No missing assets or uncaught application errors
were present in the validated run. Production CSS fell from approximately
283 KB to 126 KB uncompressed by excluding unused scaffold utilities; the
account-entry dialog and trainer are deferred from first load.

These are **local lab measurements**, not field Core Web Vitals or a promise
for low-end phones on Indian mobile networks. TBT is not INP. Run PageSpeed
Insights/WebPageTest on the final custom domain and collect sufficient real
interaction data before claiming an INP percentile or production rating.
An intermediate audit made against a stale local Worker was discarded after
resource checks revealed missing assets; its score is not reported here.

## Honest release boundaries

This is not a complete V2/V3 release or a native-store app. Full offline reopening,
Hindi, Recall Age, DI transfer sets, persistent Velocity 10 commitments, verified
certificates, and advanced pressure/shortcut analytics are not claimed as shipped.
The misleading challenge tile now opens a genuine 10-question benchmark.

The owned domain, operator/grievance identity, final retention/pricing decisions,
and evidence/permission for testimonials must be resolved before general launch.
Public preview publishing requires the owner's confirmation. Moving origins
after an installation campaign requires reinstalling the web app and planning
guest-data migration.

## Sharing asset

`public/paceprep-social.png` is the 1200×630 sharing card, generated with the
built-in image tool and then resized for delivery. Prompt: a premium landscape
PacePrep card; bold geometric sans; deep navy, off-white, restrained violet and
amber; sparse mathematical symbols; exact copy “PacePrep”, “Turn calculation
into instant recall.”, “Fractions · Tables · Squares · Cubes”; no photos,
statistics, extra claims, or watermark. It is metadata-only, not a first-load image.

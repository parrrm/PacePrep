# PacePrep hardening validation — 9 September 2026

This record covers the source changes based on `8fa2bd9`, including checkpoints `cdbcfbe`, `96c9700`, and the browser-runner/profile-placement checkpoint containing this update. These changes have not been deployed to production.

## Actual checks

| Check | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Passed |
| `pnpm exec tsc --noEmit` | Passed |
| `pnpm lint:all` | Passed |
| `pnpm test` | 54 passed, 0 failed, 0 skipped |
| `pnpm build` | Sites/Cloudflare build passed |
| `pnpm run build:vercel` | Vercel build passed |
| `node scripts/verify-vercel-output.mjs` | Passed: Node 24, SSR/API routing, correct adapter, 60 public assets |
| `git diff --check` | Passed |
| `pnpm test:e2e` | Vercel production build: 16 passed, 2 Sites-only skips |
| `pnpm test:e2e:sites` | Sites production Worker: 18 passed, no skips |

Unit and mocked integration tests cover arithmetic correctness across the banks, distinct MCQs, rational-answer edge cases, scheduling, comparisons, bounded-history merging, account switching, guest import, malformed data, cross-origin/body limits, revision races, queue invalidation, reset generations, and Supabase owner-filtered writes. They do not prove live RLS policies are installed.

## Browser checks

The automated Playwright suite now runs the following on both desktop (1440px) and phone (390px), with isolated browser contexts and owned local production servers:

- All 12 baseline facts, correct score, pre-save non-persistence, consent gate, save and reload without duplicate imports.
- Profile heading and answer-mode controls stay in the viewport; keyboard focus, preference persistence and Escape dismissal work. This caught and fixed a double-translation/full-height CSS bug that hid settings above the viewport.
- Semantic hub links, selected table category, incorrect recall feedback, expanded analysis and ended-session timer cleanup.
- Numeric-equivalent operation answers, duplicate submits in the same event-loop turn, early results and back navigation.
- Empty 60-second sprint expiry without invented accuracy/pace or completed sessions.
- Cross-tab progress/reset propagation, interruption of stale recall, and new post-reset saves.
- Skipped-answer end confirmation and usable viewport controls.
- Public pages, manifest, service-worker control and actual offline navigation to the public reconnect screen.
- Actual built API anonymous/cross-origin rejection and private cache headers; forged Sites identity headers rejected on Vercel.
- Sites-only mocked account deletion/revision and new cloud-save flow. This scenario is skipped on Vercel and is not a live authentication/RLS test.

Final results: 16 passed and 2 intentional skips on Vercel (46.9s); all 18 passed on Sites (53.9s). No retries. Initial failures included an unfinished Chromium download, the real profile CSS bug, and a new test helper that initially omitted a third addition operand. Those issues were resolved before the passing full runs. The existing 54 unit/mocked integration tests, TypeScript, lint and both builds were also rerun successfully.

The former `tests/browser-smoke.mjs` was replaced by `tests/e2e/browser.spec.ts`. Setup, managed servers and separate platform report paths are documented in [docs/E2E.md](docs/E2E.md). CI installs Chromium and runs both platforms; the remote workflow has not yet executed. Earlier browser-tool observations of production landing/baseline/disabled sign-in remain historical observations, not validation of a new deployment.

## Deployment and release limits

Both public Vercel aliases were verified on the existing production deployment. No release, environment, DNS, alias or database change was made. No project environment variables/connected database were shown in the inspected Vercel dashboard. Enable cloud auth only after actual two-account and anonymous RLS checks, auth email/recovery tests and migration verification described in [docs/VERCEL.md](docs/VERCEL.md).

Operator/support/grievance details remain missing. This is a strengthened testing preview, not a completed general launch. Existing bounded histories cannot yield exact disjoint-device session counts; merging preserves conservative totals. No source or dependency change is claimed to produce a measured performance gain.

## Historical measurements

The repository previously recorded a 4 September local Worker Lighthouse run: performance 98, accessibility 100, best practices 96, SEO 100, LCP 2.1s, CLS 0, TBT 0ms. Those measurements were not repeated during this hardening task and must not be treated as current deployment results or field Core Web Vitals. No fresh assistive-technology or real-device audit is claimed.

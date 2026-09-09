# PacePrep hardening validation — 9 September 2026

This record covers the source changes based on `8fa2bd9`, including checkpoint `cdbcfbe` and the subsequent persistence and learning review. These changes have not been deployed to production.

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
| `node --experimental-strip-types tests/browser-smoke.mjs` | Could not start: Playwright package missing |

Unit and mocked integration tests cover arithmetic correctness across the banks, distinct MCQs, rational-answer edge cases, scheduling, comparisons, bounded-history merging, account switching, guest import, malformed data, cross-origin/body limits, revision races, queue invalidation, reset generations, and Supabase owner-filtered writes. They do not prove live RLS policies are installed.

## Browser checks

Available browser tools exercised the local application, separately from the standalone script:

- Completed all 12 baseline facts correctly, scored 100%, saved the synthetic baseline, and reloaded without importing it twice.
- Profile keyboard focus remained in its dialog; answer preference save/reload exercised.
- Recall category links, keyboard answer, grading, early end, results and expanded analysis worked.
- Isolated QA tabs received each other's progress. Reset stopped the other tab's active drill, discarded old history, and allowed fresh practice to save.
- Operations accepted equivalent numeric input, saved early results, returned to category choice, and expired at 60 seconds without answers. Empty results correctly avoid claiming accuracy or pace.
- At 390px: recall results, hub, operations, pricing, FAQ, privacy, terms, contact, install and sign-in showed no horizontal overflow. Hub links contain no nested buttons. Mobile Skip was visible.
- Production landing and baseline feedback/expiry were inspected. Production sign-in explicitly reports cloud accounts unavailable.

The standalone browser script supports `PACEPREP_PLAYWRIGHT_PATH` for an installed Playwright package, `PACEPREP_TEST_URL` for the test server, and optional `PACEPREP_BROWSER` for Chromium. Its mocked account section is Sites-only and requires `PACEPREP_TEST_SITES_AUTH=1`. The offline check runs only against the production Worker on port 8787. Neither optional section is claimed as passed here.

## Deployment and release limits

Both public Vercel aliases were verified on the existing production deployment. No release, environment, DNS, alias or database change was made. No project environment variables/connected database were shown in the inspected Vercel dashboard. Enable cloud auth only after actual two-account and anonymous RLS checks, auth email/recovery tests and migration verification described in [docs/VERCEL.md](docs/VERCEL.md).

Operator/support/grievance details remain missing. This is a strengthened testing preview, not a completed general launch. Existing bounded histories cannot yield exact disjoint-device session counts; merging preserves conservative totals. No source or dependency change is claimed to produce a measured performance gain.

## Historical measurements

The repository previously recorded a 4 September local Worker Lighthouse run: performance 98, accessibility 100, best practices 96, SEO 100, LCP 2.1s, CLS 0, TBT 0ms. Those measurements were not repeated during this hardening task and must not be treated as current deployment results or field Core Web Vitals. No fresh assistive-technology or real-device audit is claimed.

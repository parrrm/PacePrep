# PacePrep hardening validation — 9 September 2026

Source work based on `8fa2bd9`: checkpoints `cdbcfbe`, `96c9700`, `0c15b87` and the database/accessibility checkpoint containing this record. All locally actionable checkpoints are complete. No production release or live database migration was performed.

## Final checks actually run

| Check | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Passed |
| `pnpm exec tsc --noEmit` | Passed |
| `pnpm lint:all` | Passed |
| `pnpm test` | **63 passed**, zero failures/skips |
| `pnpm build:vercel` | Passed |
| `node scripts/verify-vercel-output.mjs` | Passed: Node 24, SSR/API routing, correct adapter, 60 public assets |
| `pnpm test:e2e` | **22 passed / 2 intentional Sites-only skips**, desktop and phone, 1.0m |
| `pnpm build` | Sites/Cloudflare build passed |
| `pnpm test:e2e:sites` | **27 passed / zero skips**, 1.2m |
| `pnpm audit:performance` | Both Lighthouse mobile simulations completed; results below |
| `pnpm test:staging` | Correctly refused missing credentials, exit 2; live check not run |
| Script syntax and `git diff --check` | Passed |
| GitHub review-branch push dry run | Blocked: no write credentials; no remote branch/CI run created |

Platforms were built and exercised sequentially. Test and audit servers stopped afterwards. Final Sites shutdown removed its temporary D1 database. Full source diff and accidental-file review completed; no credentials were added. This is a targeted review, not a certified secret scan.

## Database and boundary evidence

The original 54 tests cover math-bank invariants, scheduling and history merges, account switching/import, request validation, bounded bodies, revision races, queued saves and reset generations. New coverage adds:

- Three built-Worker D1 scenarios: concurrent insert/update winners, owner isolation, hostile identity text passed as a SQL parameter, rejected payload preservation, monotonic reset tombstones, stale-save rejection and fresh saves. Fixtures use synthetic dispatcher headers only on an owned local Worker; external Sites dispatcher authentication remains outside this evidence.
- Six PostgreSQL tests execute every committed migration in PGlite. Only the Auth schema/session bridge is simulated. Real PostgreSQL grants, policies, object/size constraints, owner deletion and Auth-user cascade are exercised. Each subtest rolls back its transaction.
- Three staging-harness guard tests: no network without explicit staging confirmation; no mutation when either account already has progress; cleanup of an accidentally accepted cross-owner fixture under simulated broken RLS. These guards are not live service verification.

The SQL tests reproduced excess authenticated TRUNCATE permission with older default grants. `202609090001_limit_progress_privileges.sql` revokes inherited table powers before granting only SELECT/INSERT/UPDATE/DELETE. The initial test failed; it passes with the new migration. Apply both migrations to staging before enabling cloud accounts. The migration was not applied remotely.

## Browser and accessibility evidence

Both viewport projects retain baseline scoring/consent/save/reload, profile viewport/focus/preferences, selected-category navigation, incorrect-answer feedback, result analysis, operation equivalence and duplicate submission, sprint expiry, cross-tab reset/new saves, end confirmation, public pages, manifest and actual service-worker offline fallback. Built API anonymous/cross-origin rejection and Vercel forged-header rejection pass. Sites also runs its mocked cloud reset/save journey.

Pinned axe scans cover ten public routes, settings, recall input/feedback/results and operations on desktop and phone. WCAG A/AA checks include visible-label matching. Findings fixed during the final audit:

- Numeric/fraction text used labels on generic spans that assistive technology could ignore. Accessible text now accompanies the visual rendering.
- Landing, hub and operation category labels omitted or differed from visible text. Controls now derive names from their content.
- An enabled baseline button briefly retained disabled opacity because of `transition-all`. Explicit transition properties remove the contrast failure when enabling controls.

The full final suites pass with no retries or disabled accessibility rules. These scans do not replace real assistive-technology testing. Earlier profile placement and learning/persistence fixes remain documented in `TASK_PROGRESS.md`.

## Fresh local performance measurements

Lighthouse **13.4.1**, mobile simulated throttling, Playwright Chromium, local Vercel production preview, 9 September 2026 at 10:55 UTC:

| Route | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 75 | 100 | 100 | 100 | 4.83s | 0.000075 | 11.5ms |
| `/practice` | 77 | 100 | 100 | 100 | 4.67s | 0 | 11.5ms |

Reports contain no run warnings. The local preview does not apply production CDN compression/cache headers. The generated Vercel configuration already sets immutable caching for hashed assets. Reports identify CSS/JS transfer cost, but these results do not establish deployed performance, field Core Web Vitals or a measured speed improvement. `pnpm audit:performance` writes HTML/JSON under ignored `outputs/lighthouse/`.

Historical 4 September Worker scores of 98/100/96/100 used a different build/runtime. They are not a valid before/after comparison with these measurements.

## Remaining external gates and exact next action

`git push --dry-run` failed because GitHub write credentials are unavailable. Configure GitHub authentication, push `codex/paceprep-hardening`, then inspect the validation job and both browser jobs for that commit. CI now runs on review-branch pushes as well as main/PRs. No remote execution is claimed.

Then access the intended staging Supabase project, apply both migrations, run `pnpm test:staging` with two empty disposable accounts and the secure test-only variables in [docs/VERCEL.md](docs/VERCEL.md), and verify confirmation/recovery/OAuth plus deployed application behavior. Keep cloud auth disabled until those checks pass. Operator/support/grievance details, deployed/field performance and real-device/assistive-technology verification remain unavailable.

Both production aliases remain unchanged. No guest-origin migration is attempted. Bounded legacy histories still cannot reconstruct exact disjoint-device session totals; conservative merging is deliberate. These limits must remain explicit before a general launch.

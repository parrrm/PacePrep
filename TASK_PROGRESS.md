# PacePrep production hardening

Updated: 2026-09-08. Base: `main` at `8fa2bd9` (fresh clone, no pre-existing local edits).

## Scope and architecture

User requests an implemented, independently reviewed production hardening pass, with durable checkpoints. React 19 / Vinext / Vite application, dual Sites Cloudflare D1 and Vercel Nitro/Supabase deployment adapters. Recall UI lives in `app/trainer-client.tsx`; `/ops` was a second practice implementation; `/practice` links both. Guest progress is browser-local JSON; accounts use an identity-scoped browser key plus `/api/progress`. Supabase verifies the bearer token and scopes queries to its user ID; migration enables owner RLS. No AGENTS.md existed.

## Checkpoints

1. **Investigation: substantially complete, production service access limited.** Read core UI, banks, persistence/auth/API, migration, configuration and prior validation docs. Production homepage differs from current main (old copy/testimonials; newer operations links in main). Browser confirmed baseline expiry, correct and incorrect feedback. Guest/account/mobile/full journeys still need verification.
2. **Learning corrections: implemented and unit-tested.** Extracted `lib/recall-bank.ts` and `lib/learning-progress.ts`; normalized direct facts to `reverse:false`, unique mathematically distinct choices, corrected first review to 1 day and prevented early repeats from advancing tiers. Merge overlap/idempotence and scheduling tests pass; broader concurrency review remains.
3. **Security/data integrity: partial.** Added API factory with account expectation binding, strict shape checks, bounded streaming body parsing, private/no-store responses; Sites identity lookup implemented. Auth adapters and Supabase errors changed. API boundary tests now pass. Finished account-aware operations persistence and serialized saves. Trainer safe hydration, account lookup failure handling and serialized autosave implemented; guest merge and adversarial review remain.
4. **Operations UI: implemented; storage API complete.** Explicit choose/running/done states; wall-clock deadline, sync answer lock, effect cleanup, equivalent numeric grading, empty-session results, reliable back/end navigation, labeled delete keypad, visible save errors. Needs browser and regression testing.
5. **Navigation/accessibility: pending.** `/practice` nests buttons in links and all recall categories lead to home without selecting a category. Ops links do not select family. Fix and verify.
6. **Build/CI/deployment/review: pending.** Add meaningful regression tests, run checks, add CI, inspect final diff/secrets, update deployment docs. Do not claim ready or deployed.

## Validation actually run

- `pnpm install --frozen-lockfile`: PASS (589 dependencies; bundled Node PATH needed).
- First Vercel build attempt: FAILED because `lib/learning-progress.ts` was not yet written while parallel agent worked. Retry now.
- `pnpm exec tsc --noEmit`: PASS before latest trainer hydration edits (rerun pending).
- `pnpm lint`: PASS before latest trainer hydration edits.
- `pnpm test`: PASS, 30 tests including API adversarial boundary, bank-wide options, scheduler, merge and operations storage.
- `pnpm run build:vercel`: PASS before latest trainer hydration edits.
- `pnpm lint:all`: FAILED on pre-existing scaffold-component issues and a few newly introduced errors since fixed; rerun pending.
- Full browser E2E and final Sites build remain pending.
- Original validation documents contain historical claims, not evidence for this patch.

## External production findings

Authenticated browser can view Mental Math Vercel project; API connector teams are empty. Project ID `prj_g0D0fCT58IQaRG4QKc4E5KIA4ci2`, repo `parrrm/PacePrep` connected. Dashboard production READY deployment `AkE4ix5Lxr2fUag7vXZMYm7Q5NN3` was CLI-created, canonical assigned domain `paceprep.vercel.app`. Requested `paceprep-mental-math.vercel.app` is reachable but not listed on this project's domain page; resolve before deployment/alias changes. No project environment variables configured in dashboard. Node 24.x. Production overrides use Other, `pnpm run build:vercel`, `.vercel/output/static`, frozen install. Last 6h panel showed 44 edge requests, 18 function invocations, 0% error rate. No live Supabase account/database access verified. Legal operator/support details are missing in existing preview copy; don't invent them.

## Exact next step

First finish trainer hydration/sync verification and guest migration. Then navigation, browser journeys/mobile, builds and independent diff review. Parallel agents were interrupted by account usage limit; their files are partial and are not implicitly reviewed.

## Runtime and workspace

Repo: `work/PacePrep` within `/Users/apple/Documents/Codex/2026-09-08/build-x20`.
Node: `/Users/apple/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`; prepend its directory to PATH for pnpm. Dev command: `pnpm run dev:vercel --host 127.0.0.1` (retained exec session 41059; check if alive before restarting). Intermediate script `../refactor_ops.py` is outside repo. User deliverables go in parent `outputs/`. Never print env or credential values.

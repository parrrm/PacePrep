# PacePrep production hardening

Updated: 2026-09-09. Base `8fa2bd9`; checkpoint 1 is `cdbcfbe`. Checkpoint 2 is `96c9700`. Checkpoint 3 is the commit containing this update on `codex/paceprep-hardening`; its implementation and validation are complete. All changes on this branch belong to this task.

## Architecture and scope

React 19 / Vinext / Vite with Vercel Nitro/Supabase and Sites Cloudflare D1 adapters. Recall: `app/trainer-client.tsx`; operations: `app/ops/ops-client.tsx`; hub: `/practice`. Guest JSON is browser-local. Account snapshots use identity-scoped local keys and `/api/progress`. Supabase verifies bearer tokens on the server and passes that token through owner-filtered PostgREST requests and RLS. Preserve both adapters and existing public origins.

## Completed checkpoints

- **Checkpoint 1 (`cdbcfbe`)**: extracted recall bank and scheduling/merge modules; fixed empty direct decks and equivalent correct MCQ options; one-day initial review and due-time promotion. Added authenticated account expectations, bounded JSON reads, validation, private/no-store responses, identity-only lookup, and fail-closed hydration. Operations now have explicit states, deadlines, immediate answer locking, numeric-equivalent grading, timer cleanup, correct end/back behavior, and account-scoped ordered persistence.
- **Checkpoint 2 (verified)**: atomic revision comparisons in D1 and Supabase; stale writes return 412, missing revision 428. Each client owns its revision and serializes transport; fresh reads invalidate older queued saves. Reset tombstones prevent older devices restoring deleted history while allowing new practice. Trainer merges disk snapshots before saving and receives cross-tab updates; a newer reset stops an active recall session. Guest import merges into the first/same account, deduplicates, preserves source on failure, and retains the previous identity claim through sign-out. Added visible retry for cloud failures.
- **Learning review**: chronological replay of complete histories, conservative merging of compacted aggregates, comparisons of matching facts/modes in distinct sessions, exact terminating percentages, explicitly approximate recurring values, unambiguous square-root prompts, strict comma grouping, and consistent decimal-slip coaching. No fabricated session counts from unfinished session IDs.
- **Product and maintenance**: semantic hub links preserve selected categories; mobile operations Skip and empty-result copy fixed; profile answer preference exposes selected state; baseline import persists before clearing pending data. Public sync/approximation copy corrected. Child pages no longer inherit a homepage canonical. Removed 58 unused UI scaffold modules and one unused hook; retained button/dialog. Added CI and Vercel output validator; corrected deployment docs. No dependency or security-rule weakening.

## Completed checkpoint 3 — browser regression runner

Started from clean `96c9700`. Added pinned `@playwright/test` 1.63.0 and installed Chromium. Replaced the unrun monolithic smoke script with nine independent scenarios on desktop and phone projects. The runner owns local production servers (Vercel 4173; Sites 8787), rejects occupied ports, uses isolated browser contexts, and retains separate platform traces/screenshots/reports on failure. Added CI jobs that build and test each adapter independently and updated `AGENTS.md` and `docs/E2E.md`.

The first real browser run exposed a production CSS bug: `.accessible-profile` applied a second centering transform on top of the dialog primitive's translation and inherited a full-height panel. Settings were above the viewport. Removed the duplicate transform and restored content-based height. New viewport assertions and ordinary clicks pass for both desktop and phone. An intermediate operation-test failure came from the new test helper summing only two of three operands; corrected the helper without changing valid application grading or weakening assertions.

Final browser results: **Vercel 16 passed, 2 intentionally skipped; Sites 18 passed, 0 skipped**. The two skips are the explicitly Sites-only mocked identity scenario, once per viewport. Verified baseline consent/scoring/import/reload, settings focus/preferences, selected recall category, incorrect feedback and timer cleanup, numeric-equivalent operation grading and synchronous duplicate submission, empty sprint expiry, cross-tab reset/new saves, skipped-answer confirmation, public pages/manifest/offline fallback, built API anonymous/cross-origin rejection, Vercel forged-header rejection, and Sites mocked reset/save revisions. No real credentials or production records were used. CI configuration was reviewed; no remote GitHub Actions run is claimed.

## Validation actually performed

Final source verification on 2026-09-09:

- `pnpm install --frozen-lockfile`: PASS during this task.
- `pnpm exec tsc --noEmit`: PASS.
- `pnpm lint:all`: PASS; scoped `pnpm lint` also passed earlier.
- `pnpm test`: PASS, **54 tests**, zero failures/skips. Includes math bank invariants, scheduler/merge adversarial cases, account migration, request boundaries, stale revisions, queued writes, and mocked Supabase reset/save integration.
- `pnpm build`: PASS, Sites/Cloudflare artifact produced.
- `pnpm run build:vercel`: PASS.
- `node scripts/verify-vercel-output.mjs`: PASS, Node 24, SSR/API routing, Supabase adapter and 60 public assets.
- `git diff --check`: PASS. Final source diff and accidental-file review performed; no credentials added. This is a targeted review, not a certified secret scan.
- `pnpm test:e2e`: PASS, 16 passed / 2 platform-specific skips, desktop and phone against the Vercel production build (46.9s).
- `pnpm test:e2e:sites`: PASS, all 18 passed against the local Sites production Worker (53.9s).
- The old `browser-smoke.mjs` dependency blocker is resolved by the new runner; that file was replaced. A first attempt during Chromium installation failed before launch; subsequent product/test failures were fixed and the full suites rerun.
- Browser automation through available browser tools: full 12-answer baseline scored 100%; local save/reload retained exactly 17 total test attempts before/after reload (12 new plus 5 existing QA attempts), no pending duplicate import. Profile keyboard focus stayed in dialog; preference save/reload exercised. Recall keyboard grading, early results, details disclosure and post-reset practice passed. Two tabs sharing the isolated `grok-test` store received new attempts; resetting one stopped the other's active session and cleared old history. New post-reset answers saved successfully. Operations accepted equivalent numeric input, ended/backed out correctly, and the 60-second empty sprint expired with “No accuracy or pace measured”.
- Explicit 390px phone emulation: recall results, practice hub, operations sprint/results, pricing, FAQ, privacy, terms, contact, install and sign-in had no horizontal overflow. Hub had zero nested buttons in links. Browser console check during recall/reset showed no application errors.
- Production browser: landing/baseline correct and incorrect feedback/empty expiry inspected earlier; sign-in inspected again and explicitly reports cloud accounts unavailable. No live user data submitted.

## External production findings

Authenticated Vercel dashboard inspected on 2026-09-08; connector team listing was empty. Project `mental-math/paceprep`, id `prj_g0D0fCT58IQaRG4QKc4E5KIA4ci2`, connected to `parrrm/PacePrep`. Production deployment `AkE4ix5Lxr2fUag7vXZMYm7Q5NN3` was READY and CLI-created from older source. **Domain question resolved:** both `paceprep.vercel.app` and `paceprep-mental-math.vercel.app` are assigned to that deployment; the latter is under additional Assigned Domains, despite absence from the project Domains list.

No project environment variables or connected storage were shown. Node 24.x, Other framework override, `pnpm run build:vercel`, `.vercel/output/static`, frozen installation. A small six-hour dashboard snapshot showed 44 edge requests, 18 function invocations and 0% errors; it is not evidence of account correctness. Main pushes trigger production; other branches create previews. No deployment, alias, dashboard setting or database migration was changed during this task.

## Genuine remaining boundaries

1. Live Supabase project/migration/RLS, two-user and anonymous direct database isolation, email confirmation/recovery and OAuth have not been verified: no suitable service/account access was available. Keep cloud auth disabled until the checklist in `docs/VERCEL.md` passes. Mocks and source review are not live RLS proof.
2. Real operator, support and grievance details remain unavailable; contact/legal pages explicitly remain preview placeholders. Do not invent these or call this a general production launch.
3. The standalone browser gap is closed. Remote CI execution, fresh Lighthouse/field performance, and real-device/assistive-technology testing remain unverified; old lab scores are historical only.
4. Legacy bounded snapshots cannot exactly reconstruct disjoint-device completed-session totals or distinguish all ancient compacted events. Merge deliberately uses conservative counters and avoids duplicate replay. A lossless multi-device event ledger would require a separate data migration, not invented counts.
5. Source improvements are local until explicitly released. Preserve the current public origin; there is no export/import UI for moving guest storage between origins.

## Exact next step / runtime

Checkpoint 3 is complete. The next local checkpoint is database integration coverage: exercise the real D1 schema and adapter against a disposable local database for insert/update revision conflicts, reset markers and subsequent saves. Current database tests mock Supabase HTTP and do not exercise real D1 SQL or live Supabase RLS. Preserve production data and keep local fixtures under ignored test state. Then verify the new CI jobs on a review branch and perform live Supabase anonymous/two-account isolation and email/recovery checks when staging access is available. Do not claim those external checks passed. No remote push, production release or dashboard change was performed. Use `docs/DEPLOY-NOW.md` for a later requested release.

Repository: `/Users/apple/Documents/Codex/2026-09-08/build-x20/work/PacePrep`. Node: `/Users/apple/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`; prepend that directory to PATH for pnpm. Playwright stopped its owned test servers after the runs. No development server was left running; check liveness before starting `pnpm dev:vercel`. Vinext binds localhost/IPv6 in this environment even when passed `--host 127.0.0.1`. Do not build while using dev: both share generated state. Logs/intermediate scripts are outside the repo in parent `work`; deliverables belong in parent `outputs`. Never print secrets. Read this file, AGENTS.md, status and log on resume.

# PacePrep production hardening

Updated: 2026-09-11. Base `8fa2bd9`; checkpoints 1–5 are `cdbcfbe`, `96c9700`, `0c15b87`, `bb91ef7`, and `282c1f3`. The student-outcomes UI/UX pass is checkpoint 6 below on `codex/paceprep-hardening`. External release gates remain separate. Pre-existing untracked `supabase/.temp/` belongs to the user and must not be committed or removed.

## Completed checkpoint 6 — student outcomes, analysis and motivation

Implementation and local validation are complete. The experience now answers where a student stands, what is holding them back and what to do next without inventing an exam score.

- Rewrote the landing page around exam outcomes: fewer avoidable arithmetic errors, more time for reasoning, visible progress and a five-stage Attempt → Analyse → Identify → Act → Improve loop. The baseline now promises a mark-saving priority rather than a generic speed score.
- Added one tested performance-insight engine shared by the baseline, dashboard, recall results and operations results. It prioritizes accuracy below 70%, identifies accuracy-building work below 90%, recommends pace only after accuracy is secure, and treats skipped-only sessions as unmeasured.
- Rebuilt the dashboard around one readiness signal, recent trend, the leading weak topic and one recommended next action. Its explanation consistently follows What happened → Why it matters → What to do next, and the action opens the relevant focused practice.
- Made answer feedback personal and applicable: students see whether an answer was correct, the time taken, why that pattern matters under exam pressure and the next response to practise. Recall and operation summaries surface the same three-part action plan and an immediate retry containing only missed questions.
- Added a keyboard skip link, visible focus handling, responsive outcome/action layouts and stable button colors during theme changes. Automated WCAG A/AA checks caught a transient dark-theme contrast issue; removing the color transition fixed it without disabling rules.
- Added four performance-insight tests and expanded browser coverage for the outcome-led landing page, actionable feedback and result plans.

Verified: TypeScript and full lint pass; all **73 unit/integration tests** pass with zero failures/skips. Vercel build/output verification passes with **55 public assets**; Vercel E2E passes **32 tests / 2 intentional Sites-only skips** on desktop and phone. Sites build and E2E pass **37 tests / zero skips**, including three local D1 scenarios. Final `git diff --check` passes. No dependency, database, authentication, deployment or production setting changed.

Fresh local Lighthouse 13.4.1 mobile simulation on the final Vercel build: homepage **74 performance / 100 accessibility / 100 best practices / 100 SEO / 100 agentic browsing**, LCP **4.96s**, CLS **0.000075**, TBT **4.5ms**; practice **75 / 100 / 100 / 100 / 100**, LCP **4.82s**, CLS **0**, TBT **0ms**. These local preview measurements do not establish deployed performance or field Core Web Vitals. Reports remain under ignored `outputs/lighthouse/`.

Exact next step: review the final local landing, baseline, dashboard and result loops at `http://localhost:3000/`. If accepted for release preparation, restore GitHub write authentication, push `codex/paceprep-hardening` and inspect all three remote CI jobs before the separate staging-auth and deployment gates. No checkpoint 6 implementation remains.

## Completed checkpoint 5 — training interface and question selection

Implementation and validation complete. Resumed from `bb91ef7` and preserved both database adapters, authentication boundaries, account storage and production aliases.

- Replaced the score-heavy dashboard with a next-session action, exact due-review set, recent accuracy, correct-answer pace, explored-fact count and completed sessions. Empty measurements display a dash. Removed decorative math, XP and focus-token counters from the training header/profile.
- Added a responsive practice studio, shared navigation on practice/operations pages, clearer topic cards, navy/teal theme, visible focus styles and native session progress. The static practice catalog now renders on the server. Phone inputs no longer automatically open the keyboard.
- Extracted a shared, testable selection engine. Actual due reviews precede recent mistakes, new facts and retention practice; topics interleave within each priority. Decks deduplicate IDs and do not mutate the bank or saved statistics.
- Fixed category benchmarks selecting from the entire bank. Benchmarks stay inside the chosen pool, balance available topics/directions, and bypass subsequent adaptive reordering. Focused and missed-question retries no longer add unrelated questions.
- Ordinary untimed recall sessions finish after ten attempts (or the smaller target pool). Skips count toward completion. Untimed feedback remains until Continue/Enter, and the final answer offers View results. Sprint timing remains deadline-based. Operations now select from saved learning state and offer a real retry containing only missed questions.
- Added six engine regression tests and four browser scenarios per viewport covering persistent feedback, exact one-fact recall/operations retries, benchmark boundaries/skip completion, and light/dark dashboard accessibility.

Verified: TypeScript, full lint, all **69 unit/integration tests**, Vercel build/output checks (**55 public assets**) and Vercel E2E (**30 passed / 2 Sites-only skips**, desktop and phone). Sites build and E2E passed (**35 passed / no skips**, including three real local D1 scenarios). The first Sites runner timed out before readiness; a diagnostic start returned HTTP 200 and was stopped before the full suite passed on retry. No validation timeout was treated as a pass. Final `git diff --check` passed.

Fresh local Lighthouse mobile simulation: homepage **75 performance / 100 accessibility / 100 best practices / 100 SEO**, LCP **4.85s**, CLS **0.000075**, TBT **9.5ms**; practice **77 / 100 / 100 / 100**, LCP **4.66s**, CLS **0**, TBT **11ms**. These local Nitro results do not establish a speed improvement or deployed performance. Reports are in ignored `outputs/lighthouse/`.

Manual browser review verified the practice studio and dashboard on desktop and the dashboard at 390px. No production release, external account change or database migration was performed.

The local production preview is available at `http://localhost:3000/practice` (HTTP 200 verified). This checkpoint is the commit containing this update. Exact next step: review the new practice flow locally, then complete the external review-branch CI and staging-auth gates below before a requested production release. No local checkpoint 5 implementation work remains.

## Completed checkpoint 4 — database integration, accessibility and audit tooling

Resumed from clean `0c15b87`; user expanded scope to all unfinished checkpoints. Real D1 insert/update races, owner isolation, hostile identity parameterization, invalid payload preservation, reset tombstones and fresh saves pass through the built local Sites Worker. The test server owns a temporary D1 directory, refuses remote bindings and receives graceful shutdown. An initial SIGKILL shutdown left temporary state; the final SIGTERM run cleaned it successfully. No temporary D1 directory or test server remained after validation.

Added PostgreSQL WASM tests that execute committed Supabase migrations with a simulated Auth session bridge. They reproduced inherited authenticated TRUNCATE privilege under older default grants. New `202609090001_limit_progress_privileges.sql` revokes inherited table powers before granting only SELECT/INSERT/UPDATE/DELETE. All six new PostgreSQL tests now pass, including anonymous/cross-owner denial, constraints, deletion and cascade. This is local SQL verification, not evidence of deployed Supabase policies or Auth correctness.

Added pinned axe/Playwright scans on desktop and phone across ten public routes, settings, recall input/feedback/results and operations. Fixed inaccessible numeric/fraction labels and visible-name mismatches on landing/hub/operation categories. Replaced button `transition-all` with explicit properties: enabled buttons no longer briefly retain disabled opacity and insufficient contrast. Final suites: Vercel **22 passed / 2 Sites-only skips**, Sites **27 passed / 0 skips**, including all three real D1 scenarios. No accessibility rules were disabled to obtain passing results.

Prepared `pnpm test:staging` for direct two-account/anonymous PostgREST checks with explicit staging credentials, empty-account preflight and fixture-specific cleanup. Missing credentials correctly exit 2. Three guard tests verify refusal before networking without staging confirmation, preservation of pre-existing progress, and cleanup of an accidentally accepted cross-owner fixture when the test server simulates broken RLS. Those guards are mocked transport tests; live staging checks have not run.

Fresh Lighthouse 13.4.1 mobile simulation on the final local Vercel preview: homepage performance **75**, LCP **4.83s**, CLS **0.000075**, TBT **11.5ms**; practice performance **77**, LCP **4.67s**, CLS **0**, TBT **11.5ms**. Both scored **100 accessibility / 100 best practices / 100 SEO**, with no run warnings. The preview lacks CDN compression/cache headers; generated Vercel output already sets immutable caching on hashed assets. Reports identify JS/CSS transfer cost, but these are local-server results, not measured production performance or evidence of a speed gain. HTML/JSON reports are generated by `pnpm audit:performance` under ignored `outputs/lighthouse/` and copied to the task's deliverables directory.

Review-branch CI is configured for `codex/**`. GitHub read access works, but `GIT_TERMINAL_PROMPT=0 git push --dry-run origin HEAD:refs/heads/codex/paceprep-hardening` failed with “could not read Username”: no GitHub write credentials are configured. No remote branch, CI run, deployment, migration or dashboard change was created. Vercel connector still returned no teams. External access is a real blocker, not an unattempted local checkpoint.

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

Historical checkpoint 4 verification on 2026-09-09 (checkpoint 5 results are above):

- `pnpm install --frozen-lockfile`: PASS during this task.
- `pnpm exec tsc --noEmit`: PASS.
- `pnpm lint:all`: PASS; scoped `pnpm lint` also passed earlier.
- `pnpm test`: PASS, **63 tests**, zero failures/skips. Includes the prior 54 math/scheduling/merge/account/API tests, six PostgreSQL migration/RLS tests and three staging-harness guards.
- `pnpm build`: PASS, Sites/Cloudflare artifact produced.
- `pnpm run build:vercel`: PASS.
- `node scripts/verify-vercel-output.mjs`: PASS, Node 24, SSR/API routing, Supabase adapter and 60 public assets.
- `git diff --check`: PASS. Final source diff and accidental-file review performed; no credentials added. This is a targeted review, not a certified secret scan.
- `pnpm test:e2e`: PASS, **22 passed / 2 platform-specific skips**, desktop and phone against the Vercel production build (1.0m).
- `pnpm test:e2e:sites`: PASS, **27 passed / 0 skips** against the local Sites production Worker (1.2m).
- `pnpm audit:performance`: completed both mobile simulations; measured scores and limits above. Script syntax checks passed. `pnpm test:staging` correctly refused missing credentials; actual staging verification remains blocked.
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
3. Browser, local SQL, automated accessibility and fresh local Lighthouse gaps are closed. Remote CI needs GitHub write authentication. Deployed/field performance and real-device/assistive-technology testing remain unverified. Local scores are not deployment measurements.
4. Legacy bounded snapshots cannot exactly reconstruct disjoint-device completed-session totals or distinguish all ancient compacted events. Merge deliberately uses conservative counters and avoids duplicate replay. A lossless multi-device event ledger would require a separate data migration, not invented counts.
5. Source improvements are local until explicitly released. Preserve the current public origin; there is no export/import UI for moving guest storage between origins.

## Exact next step / runtime

Checkpoint 6 closes the requested student-outcomes UI/UX pass. **Exact next step:** review `http://localhost:3000/`, including the baseline, dashboard and both result journeys, then verify GitHub write authentication and push `codex/paceprep-hardening` for remote CI when release preparation resumes. The checkpoint 4 dry run found missing credentials; access has not been retested during these UI passes. Inspect all three CI jobs for the pushed commit. A review-branch push may create a Vercel preview; preserve main and both production aliases.

Next external gate: provision/access the intended staging Supabase project, apply both migrations in order, supply two empty disposable accounts through the secure test-only environment in `docs/VERCEL.md`, run `pnpm test:staging`, and verify confirmation/recovery/OAuth plus the deployed app flow. Keep cloud auth disabled until these pass. Obtain real operator/support/grievance details and perform real-device/assistive-technology checks before general launch. No production release was performed. Use `docs/DEPLOY-NOW.md` for a later requested release.

Repository: `/Users/apple/Documents/Codex/2026-09-08/build-x20/work/PacePrep`. Node: `/Users/apple/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`; prepend that directory to PATH for pnpm. Playwright stopped its owned test servers. A Vercel production preview is intended to remain available on localhost:3000 using `PACEPREP_PLATFORM=vercel NITRO_PRESET=vercel pnpm exec vite preview --host localhost --port 3000 --strictPort`; check liveness before starting another server. Vinext binds localhost/IPv6 here. Do not build while using dev: both share generated state. A stale generated Vite cache was moved outside the repo to `../paceprep-vite-cache-before-ui-refresh` after an initial dev-only invalid-hook failure; fresh dev and both production builds/tests succeeded. Final checkpoint 6 logs are `/tmp/paceprep-outcomes-*.log`; ignored Lighthouse reports are `outputs/lighthouse/`. Never print secrets or include the user's `supabase/.temp/` in commits. Read this file, AGENTS.md, status and log on resume.

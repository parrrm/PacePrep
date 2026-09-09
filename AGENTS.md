# Working on PacePrep

Before editing, read TASK_PROGRESS.md, inspect git status and recent commits, and resume the first incomplete checkpoint. Preserve unrelated edits. Update the checkpoint after each verified logical change; never mark unfinished work complete.

- React/Vinext runs on Vercel (Nitro + Supabase) or Sites (Cloudflare D1). Preserve both adapters unless the user changes that scope.
- Account identity comes from verified server authentication. Local storage keys or client headers are expectations, never authority. Never fall back to guest storage after an account lookup error.
- Question grading, distractors, scheduling, history merging and timers are core logic. Add meaningful regression tests for changes.
- Run `pnpm exec tsc --noEmit`, `pnpm lint:all`, `pnpm test`, `pnpm build:vercel` and `pnpm test:e2e`. Then run `pnpm build` and `pnpm test:e2e:sites` sequentially. See docs/E2E.md for Chromium setup and test-server ownership. Record actual results, including blockers; mocked identity tests are not live RLS verification.
- Keep secrets out of logs, source, artifacts and git. Document environment variable names only.
- `pnpm test` includes local PostgreSQL migration/RLS tests; Sites E2E uses disposable real D1. Neither proves deployed authentication. `pnpm test:staging` requires two empty disposable staging accounts and explicit test-only variables; never use learner accounts. Run `pnpm audit:performance` after a Vercel build with port 4173 free; retain its local-server measurement limits.
- Preserve both verified Vercel aliases documented in TASK_PROGRESS.md. A push to main triggers production deployment; use a review branch for unfinished changes.

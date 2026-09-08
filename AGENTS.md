# Working on PacePrep

Before editing, read TASK_PROGRESS.md, inspect git status and recent commits, and resume the first incomplete checkpoint. Preserve unrelated edits. Update the checkpoint after each verified logical change; never mark unfinished work complete.

- React/Vinext runs on Vercel (Nitro + Supabase) or Sites (Cloudflare D1). Preserve both adapters unless the user changes that scope.
- Account identity comes from verified server authentication. Local storage keys or client headers are expectations, never authority. Never fall back to guest storage after an account lookup error.
- Question grading, distractors, scheduling, history merging and timers are core logic. Add meaningful regression tests for changes.
- Run `pnpm exec tsc --noEmit`, `pnpm lint:all`, `pnpm test`, `pnpm build:vercel` and appropriate browser checks; also attempt the Sites build. Record actual results, including blockers.
- Keep secrets out of logs, source, artifacts and git. Document environment variable names only.
- Resolve the Vercel production-domain mismatch documented in TASK_PROGRESS.md before changing aliases or asserting production was updated.

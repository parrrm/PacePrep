# Phase 1 — Operations information architecture

Completed against GitHub `main` at `8fa2bd9` on 7 September 2026.
The earlier branch and main already contained `/practice`, `/ops`, four closed
operation banks, and guest operation-attempt storage. Their family links and
shared-review wiring were incomplete. This phase repairs that integration;
it does not claim the four complete trainer phases are finished.

## Delivered

- One Practice home, both at `/practice` and in the trainer's Practice tab.
- Recall facts: fraction ↔ percentage pairs, tables, squares, cubes, consecutive
  products. Each card selects that exact family, including on refresh.
- Mental operations: Addition, Subtraction, Multiplication, Division. Each card
  opens its existing family setup. Existing drills are preserved; sprint entry
  is hidden until accuracy-based readiness is implemented.
- Mixed / due review setup uses the existing scheduler and the same operation
  IDs written by `/ops`. Recall and operation items can both be selected.
- Operations in mixed review use typed input and a large numeric keypad; saved
  strategy lines appear in session review. Recall answer equivalence is intact.
- Fixed a pre-existing benchmark bug that ignored the selected family's pool.
- Active sessions warn before reload/leave. Already recorded answers persist;
  resuming an unfinished deck is not implemented in this phase.
- Family cards are single accessible links, with no nested buttons. Themes and
  mobile tap targets carry across the hub and operation family setup.
- Removed unavailable sign-in calls to action, cloud-sync promises and pricing
  references from the affected entry/profile screens. No new marketing pages.
- Preserved the temporary Grok route and its isolated storage through the new
  family links and operations writer.

## Changed files

- `app/practice/practice-client.tsx`, `lib/practice-families.ts`: hub and destinations.
- `app/practice-navigation.tsx`: shared Practice navigation and theme controls.
- `app/trainer-client.tsx`: family entry, shared card registry, selected-family
  benchmark, typed operation review, profile honesty and leave warning.
- `app/ops/ops-client.tsx`, `lib/ops-progress.ts`: family entry, timer cleanup,
  completion after render, leave warning and isolated progress routing.
- `app/landing-gateway.tsx`: direct practice entry and honest availability copy.
- `app/globals.css`, `app/practice-family.css`: link cards and mobile controls.
- `tests/practice-families.test.mjs`, `tests/phase-1-browser-smoke.mjs`: navigation
  contracts and browser regressions. Existing browser selectors match the hub.
- `tests/mental-ops.test.mjs`: accepts nonempty short strategy lines such as
  `7×13=91.`; all stored arithmetic answers are still checked.

## QA

1. Open `/practice` as a fresh guest. Open each of the five recall cards and four
   operation cards; refresh its setup screen and verify the family is retained.
2. Complete a Squares 10-question benchmark. All ten prompts must be squares or
   roots. Enter one wrong answer: the correct value appears without shaming.
3. Complete an Addition 10-question drill with the numeric keypad or keyboard.
   Check input focus, Enter submission, 48px-high keypad buttons and results.
4. During an active drill, reload: dismiss the warning to keep the drill. Saved
   answers remain in guest progress when returning to the Practice home.
5. Open Mixed / due reviews and start a review. It can draw from all nine families;
   operation items retain their IDs and use typed answers. End a skipped session
   through the existing confirmation, then reload to check saved history.
6. At 390px width, verify no horizontal overflow and toggle/reload both themes.
7. With cloud auth disabled, verify no Sign in CTA on the entry/profile screens.
   No Velocity 10, fake testimonials, or pricing language on Practice home.

Automated checks: `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint`,
`pnpm build:vercel`; browser scripts are `tests/phase-1-browser-smoke.mjs` and
`tests/browser-smoke.mjs`. The browser scripts accept `PACEPREP_TEST_URL`,
`PACEPREP_PLAYWRIGHT_PATH`, and `PACEPREP_BROWSER` for the local runtime.

## Deferred — start only when the owner says “next phase”

Phase 2 is next: a complete Addition trainer with the specified difficulty bands,
seeded reproducible session selection, accuracy-gated speed, correct skip/latency
handling, and targeted “practice these next” results. Existing operation drills
are preliminary; their presence does not complete Phases 2–5.

Later phases retain their requested order: complete Subtraction, Multiplication,
Division; real diagnostic; full unified due-review UX (counts, estimated minutes,
weakest family, item latency scheduling); strategy refinements; transfer; trust.
No new bank generation, schema migration, monetization work, account activation,
notification, or offline-training promise is part of Phase 1. Existing legacy
storage keys and the old Sites hostname remain compatibility identifiers.

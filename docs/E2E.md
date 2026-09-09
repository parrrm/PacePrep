# Browser regression tests

Install the locked dependencies and Chromium once:

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
```

Run against the Vercel production build:

```sh
pnpm build:vercel
pnpm test:e2e
```

Run against the Sites production Worker:

```sh
pnpm build
pnpm test:e2e:sites
```

Run platforms sequentially in one checkout because their builds share generated
state. Playwright owns the test server and shuts it down when finished. Vercel
uses localhost:4173; Sites uses localhost:8787. Tests fail if the port is already
occupied, rather than silently testing an unrelated or stale server. Do not run
these against production accounts or a shared personal browser profile.

The suite uses a fresh browser context for each test at desktop (1440px) and
phone (390px) sizes. It exercises baseline consent/save/reload, settings focus,
recall category selection and timer cleanup, operation grading and duplicate
submission, sprint expiry, cross-tab resets, public pages and production service
worker offline fallback. The Sites-only identity test mocks the progress API;
it is deliberately skipped on Vercel and does not establish live Supabase/RLS
correctness. No real account credentials are used. The old monolithic
`tests/browser-smoke.mjs` has been replaced by `tests/e2e/browser.spec.ts`.

A failure saves a screenshot and trace in ignored `test-results/<platform>/`;
the HTML report is in ignored `playwright-report/<platform>/`. Inspect with
`pnpm exec playwright show-report playwright-report/vercel` (or `sites`). To narrow a local run, append
`--project=desktop` or `--grep 'baseline'` to the test command.

CI builds and runs both adapters independently, installs Chromium and its Linux
libraries, and retains failure artifacts for seven days. The runner uses one
worker, no retries and rejects committed `test.only`. This setup follows the
[Playwright CI guide](https://playwright.dev/docs/ci) and
[managed web-server configuration](https://playwright.dev/docs/test-webserver).
The GitHub workflow itself is not considered verified until it runs remotely.

## Database and accessibility coverage

The Sites suite also runs three API integration scenarios against real local D1
SQL. `scripts/e2e-sites-server.mjs` creates and cleans a fresh temporary database
for every run and rejects remote D1 bindings. These tests inject synthetic
dispatcher identities only into the owned localhost Worker. They verify atomic
insert/update conflicts, owner isolation, parameterized identity handling,
invalid-payload preservation, reset tombstones and fresh saves. They do not
verify authentication at the external Sites dispatcher.

Both viewport projects scan public routes, profile, recall input/feedback/results
and operations with pinned axe-core WCAG A/AA rules, including visible-label
matching. Automated scans complement the keyboard and viewport journeys; they
do not replace real assistive-technology or device testing.

`pnpm test` additionally executes all committed Supabase migrations in an
ephemeral PostgreSQL WASM engine (PGlite). Only the Auth schema/session bridge is
simulated. Actual SQL verifies grants, owner policies, anonymous/cross-owner
denials, constraints, deletion and cascade. Each subtest rolls back its own
transaction. The fixture includes older Supabase default grants so the regression
suite catches excessive authenticated table powers such as TRUNCATE.

## Local performance audit

After `pnpm build:vercel`, run `pnpm audit:performance`. It owns localhost:4173,
launches the installed Playwright Chromium with pinned Lighthouse, audits `/`
and `/practice` using default mobile simulation, writes HTML/JSON under ignored
`outputs/lighthouse/`, and stops its server/browser when finished. Run it after
browser tests, not concurrently with another build or server on that port.

This measures the local Nitro preview, whose responses lack production CDN
compression/cache headers. Record that limitation with the actual scores;
do not present them as deployed or field Core Web Vitals. The generated Vercel
configuration already sets immutable caching for hashed static assets.

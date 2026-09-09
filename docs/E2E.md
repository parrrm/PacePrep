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

# PacePrep on Vercel

PacePrep uses React/Vinext with two build targets. `pnpm build` retains the existing
Sites/Cloudflare deployment. `pnpm build:vercel` selects the Nitro Vercel adapter
and Supabase progress store at build time, excluding the Sites identity headers
and D1 adapter from the Vercel server.

## Verified deployment state — 8 September 2026

The authenticated Vercel dashboard was inspected without changing services:

| Setting | Observed state |
| --- | --- |
| Project | `mental-math/paceprep` |
| Project ID | `prj_g0D0fCT58IQaRG4QKc4E5KIA4ci2` |
| Git repository | `parrrm/PacePrep`, connected |
| Production deployment | `AkE4ix5Lxr2fUag7vXZMYm7Q5NN3`, Ready, created through the CLI |
| Production URL shown in Domains | `https://paceprep.vercel.app` |
| Additional assigned production domain | `https://paceprep-mental-math.vercel.app` |
| Production deployment URL | `https://paceprep-d3xrszjuu-mental-math.vercel.app` |
| Runtime | Node.js 24.x |
| Function | `/__server`, Mumbai (`BOM1`), 319 kB, maximum duration 300 seconds |
| Production build overrides | Other; `pnpm run build:vercel`; `.vercel/output/static`; frozen pnpm install |
| Project environment variables | None configured |
| Connected project storage | None shown |
| Deployment Checks | None configured |

The team API connector returned no teams, but browser dashboard access worked.
The overview's six-hour snapshot showed 44 edge requests, 18 function invocations
and 0% error rate; this small snapshot does not validate authenticated journeys.
Production build logs show prebuilt `.vercel/output` artifacts uploaded and
deployment completed on 6 September at 11:38 IST. These seven-second deployment
logs do not contain the compilation that generated those artifacts. A live
Supabase database was not independently verified.

The requested `https://paceprep-mental-math.vercel.app` is assigned to that same
production deployment. It is shown under the deployment's additional Assigned
Domains, although the project Domains page lists only `paceprep.vercel.app`.
Preserve the requested public alias and verify it after release; see
[DEPLOY-NOW.md](DEPLOY-NOW.md). An origin change must not silently strand guest
progress. There is no export/import UI today; implement and verify a migration
path before any deliberate origin change.

The existing preview `99qFT4c1eZYxTn9PjhEruqFWm6Mq` is Ready at
`https://paceprep-gj94lui4c-mental-math.vercel.app`, from branch
`phase-1-practice-navigation`, commit
`7e21f1b7d47eda5aa148a58ef1d3f29e6fd58350`. Its logs also show a prebuilt upload,
completed on 7 September at 19:23 IST. Neither existing deployment contains the
current local hardening work until that work is released.

## Build and release contract

The committed `vercel.json` is authoritative for this custom Nitro build. The
project's UI defaults currently say Vite while the production deployment's
overrides match the repository. Do not replace these with a static Vite `dist`
deploy: the output must include both `.vercel/output/static` and the Node server
function with its catch-all route. `scripts/verify-vercel-output.mjs` checks the
upload artifact, runtime, SSR/API routing, Supabase adapter and required assets.

Use the pinned pnpm version in `package.json`, a frozen lockfile and Node.js 24,
matching the production setting. Run all checks in [DEPLOY-NOW.md](DEPLOY-NOW.md).
The GitHub CI workflow runs type checking, full lint, tests, the Vercel build and
artifact verification without production credentials. Public auth stays off in
CI. A passing build does not prove external credentials, RLS or email delivery.

## Enable Supabase accounts

1. The owner provisions/connects the intended Supabase project. The previous
   provisioning attempt required acceptance of Supabase Marketplace terms at
   `https://vercel.com/mental-math/~/integrations/accept-terms/supabase?source=cli`.
   No database was visible in this audit. Check existing resources before creating
   one; do not create a duplicate or change billing plans as part of validation.
2. Apply every committed file in `supabase/migrations` in filename order. Never
   enable accounts against an older schema. The migrations enable owner RLS and
   database constraints for learner progress.
3. Configure Production and any approved Preview environment using the variable
   names in `.env.example`: `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and matching server values
   `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY`. Marketplace `*_SUPABASE_ANON_KEY`
   names are supported. This application does not need a service-role key.
4. Set `PACEPREP_SITE_URL` to the chosen HTTPS public origin without a trailing
   slash. Set Supabase Auth's Site URL to the same origin and allow its exact
   `/signin` and `/signin?reset=1` redirect URLs. Add exact approved preview URLs
   only; do not allow a wildcard spanning unrelated Vercel projects.
5. Configure a transactional SMTP provider and verify confirmation and recovery
   delivery to external addresses. Confirmation/reset links use PKCE and must be
   opened in the browser/device that requested them.
6. With two controlled test accounts, verify registration, confirmation, login,
   reset, logout, guest import, progress persistence, concurrent updates and data
   deletion. At the PostgREST/database boundary, verify account A cannot read,
   insert, update or delete account B's row. Test anonymous access separately.
   Unit mocks are not evidence that the deployed database's policies are active.
7. After those checks pass, set `NEXT_PUBLIC_CLOUD_AUTH_READY=true` and redeploy:
   public variables are compiled into the browser assets. Verify the deployed
   flow again. Google OAuth remains unavailable until its application/provider is
   separately configured and validated.

Add the operator's real support/privacy contact before presenting the service as
a completed account launch. Do not invent contact details.

## Security boundaries

- Vercel verifies bearer tokens with Supabase Auth; identity never comes from a
  caller's account ID or the Sites `oai-authenticated-*` headers.
- The same user token reaches PostgREST, so row-level security provides a second
  ownership check. Progress API responses are private/no-store and cross-origin
  writes are rejected.
- Service-role keys, database passwords and local `.env*` files must not reach
  browser assets or source control. `.vercelignore` excludes local credentials
  and generated output from source uploads.
- Client snapshots belong to a specific resolved account. Guest data is imported
  deliberately; switching accounts must not upload the previous user's history.
- Preview deployment access and application account authorization are separate.
  The dashboard showed Vercel Authentication off and protected sourcemaps on.
  No protection setting was weakened during this audit.
- Keep the existing Sites deployment and data until any separate migration is
  explicitly validated. This Vercel hardening does not publish to Sites or copy
  learner records between backends.

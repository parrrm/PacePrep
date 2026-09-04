# PacePrep: Vercel deployment

The existing Vinext/React app is retained. `pnpm build` still targets Sites;
`pnpm build:vercel` uses the documented Nitro Vercel adapter. Sites identity
headers and D1 are excluded from the Vercel server through a build-time adapter.

## Current preview

Deployed at https://paceprep-mental-math.vercel.app (Vercel reports READY).
Vercel assigned the first deployment to its production target automatically,
despite the CLI invocation omitting `--prod`. This is still a guest-only product
preview, not a completed Supabase launch. Use an explicit preview target for
subsequent validation deployments.

Guest training needs no credentials. Cloud sign-in remains explicitly disabled
until `NEXT_PUBLIC_CLOUD_AUTH_READY=true`, the database migration is applied,
and email delivery is verified. Do not present a guest-only preview as a fully
launched account service. Existing browser progress is origin-specific: the old
Sites URL cannot silently transfer local browser storage to a new Vercel URL.
Use the existing progress export/import controls for that transfer.

## Deploy

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm exec tsc --noEmit
pnpm build:vercel
vercel deploy --scope mental-math --yes --no-wait
vercel inspect <returned-deployment-url> --scope mental-math
```

Use preview deployments for review. Production deployment is a separate step:
`vercel deploy --prod --scope mental-math`. No automatic Git deployment is set up
until the owner connects a GitHub/GitLab/Bitbucket repository.

## Enable Supabase accounts

1. The owner accepts Supabase marketplace terms in Vercel. Provision only the
   free plan unless a paid plan is separately approved. Region: Mumbai (`bom1`).
2. Apply `supabase/migrations/202609040001_learner_progress.sql` in Supabase's SQL
   editor or migration CLI. It enables RLS and restricts records to `auth.uid()`.
3. Connect the resource to the Vercel project. Set the public URL and publishable
   key from `.env.example`. The Marketplace's `SUPABASE_ANON_KEY` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` names are also supported. The app does not need
   a service-role key at runtime.
4. Configure Supabase Auth's Site URL and exact `/signin` and `/signin?reset=1`
   redirect URLs for the approved deployment domains. Do not use a wildcard that
   permits other users' Vercel projects.
5. Configure a transactional SMTP provider and verify delivery to external email
   addresses. Supabase's default sender is not a production email service.
6. Test registration, confirmation, login, reset, logout, guest import, deletion,
   and two-account isolation. Set `NEXT_PUBLIC_CLOUD_AUTH_READY=true` only after
   these checks pass, then redeploy (public variables are compiled into assets).
7. Google sign-in is not enabled by this preview. It requires a separately
   configured Google OAuth application and provider validation.

## Security boundaries

- API verifies bearer tokens with Supabase Auth; user identity is never accepted
  from caller-provided account IDs or `oai-authenticated-*` headers on Vercel.
- The user's token also reaches PostgREST, so RLS provides a second ownership
  check. API responses are private/no-store. Cross-origin writes are rejected.
- Service-role keys, database passwords, and local `.env*` files are never
  shipped to the browser. `.vercelignore` excludes local credentials and output.
- Keep the existing Sites deployment until the new flow is validated. No learner
  records are migrated or deleted automatically.
- The trainer resolves its session before opening an account's local snapshot.
  Each sync request is tied to that account; switching accounts in another tab
  reloads the trainer and cannot upload the previous account's history.
- Confirmation and password-reset links use PKCE and must be opened in the same
  browser/device that requested them.
- Add the operator's real support/privacy contact before production launch.

## Resumed migration validation — 4 September 2026

The recovered checkout already contained the Vercel adapter and initial Supabase
migration but had no deployment, backend resource, or cloud environment values.
The resumed work fixes account switching, stale-session local history, unfinished
sign-in lint errors, password-reset fallback, and Marketplace key compatibility.
The pnpm version is pinned for repeatable builds.

Sixteen unit tests cover arithmetic, PWA privacy, verified Supabase identity,
local account isolation, and rejection of sync after an account change. Lint and
TypeScript checks pass. The Nitro Vercel build also passes. Local HTTP checks on
that built output verified the home, sign-in, sign-out, privacy, manifest, service
worker, and fifteen referenced assets; unauthenticated/forged identity requests
return 401 and cross-origin writes/deletes return 403 with no-store responses.

Live Supabase registration, email delivery, password recovery, persistence,
deletion, and two-account RLS tests remain unverified until provisioning is
completed. The public cloud-auth switch remains false.

## Current provisioning checkpoint

`vercel integration add supabase --name paceprep-db --plan free --metadata
region=bom1 --scope mental-math --no-env-pull --format=json` returned
`integration_terms_acceptance_required`. No Supabase resource was created.
The owner must accept the terms here:
https://vercel.com/mental-math/~/integrations/accept-terms/supabase?source=cli
Then rerun the same provisioning command, apply the migration, and complete the
activation checks above. Do not use a different paid plan or duplicate project.

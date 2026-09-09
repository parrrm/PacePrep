# Release PacePrep on Vercel

The Vercel project is [mental-math/paceprep](https://vercel.com/mental-math/paceprep).
Its GitHub connection to `parrrm/PacePrep` was verified on 8 September 2026.
Commits to the configured production branch (`main`) trigger production builds;
other branches provide previews. Merging or pushing to `main` is a release action.

Before release:

```sh
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit
pnpm lint:all
pnpm test
pnpm run build:vercel
node scripts/verify-vercel-output.mjs
```

The CI workflow runs these checks on pull requests and pushes to `main`. A green
GitHub workflow does not by itself gate Vercel promotion: configure the validation
job as a required GitHub branch check and, if available for the project, a Vercel
Deployment Check. Review the preview's guest baseline, recall, operations,
progress, mobile input and authentication boundary before merging.

## Preserve the public production URL

The current production deployment has both **https://paceprep.vercel.app** and
the user-facing **https://paceprep-mental-math.vercel.app** assigned. The latter
appears under the deployment's additional Assigned Domains even though it is
absent from the project's Domains settings list. After promotion, verify that
this existing public alias points to the approved deployment. Preserve this
origin so guest progress remains available. An origin change requires a migration
plan first: local storage is origin-specific, and the app has no export/import UI. No aliases or
external settings were changed during the audit.

## Cloud accounts are a separate launch dependency

No project environment variables or connected database were shown in the Vercel
dashboard during the audit. Keep `NEXT_PUBLIC_CLOUD_AUTH_READY=false` until the
Supabase migration, email delivery, recovery and account isolation checks in
[VERCEL.md](VERCEL.md) pass. Guest practice can be released independently.

For a manually authorized CLI release, link this exact project first, inspect the
link, then deploy. Do not run an unlinked production deploy that could create or
target another project. Use the installed Vercel CLI's existing authentication;
never put a token in a command or commit it to the repository.

```sh
vercel link --project paceprep --scope mental-math --yes
vercel deploy --prod --scope mental-math --yes --no-wait
vercel inspect <returned-deployment-url> --scope mental-math
```

Verify the returned deployment, assigned public domain and browser flows after
promotion. The existing Sites deployment is separate and is not part of this
Vercel release.

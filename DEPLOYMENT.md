# RecallLab production deployment

RecallLab is a Vinext/React application packaged for OpenAI Sites and the
Cloudflare Workers runtime. The production binding is stored in
`.openai/hosting.json`; no API routes, secrets, D1 databases, R2 buckets, or
application environment variables are required for this local-first MVP.

## Production checks

Use Node.js 22.13 or newer and pnpm, then run:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm build
```

The optimized production output is generated in `dist/`. Test that artifact
locally with:

```bash
pnpm start
```

Learner progress remains in browser `localStorage`; publishing a new version
does not erase a student's history on the same browser and origin.

## Hosted release

The Sites release flow packages the working tree, saves an immutable site
version, and deploys that version to the project identified in
`.openai/hosting.json`. Access is set to `public` for the production release so
students can open the site without an owner account.

If server-side features are added later, keep secrets out of source control,
declare their production bindings in the hosting platform, and add a documented
`.env.example` containing names only.

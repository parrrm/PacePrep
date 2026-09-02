# PacePrep testing-preview deployment

PacePrep is a Vinext/React application packaged for OpenAI Sites and the
Cloudflare Workers runtime. The production binding is stored in
`.openai/hosting.json`. Signed-in learner progress uses the `DB` D1 binding;
guest progress remains browser-local.

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

Guest progress remains in browser `localStorage`; publishing a new version does
not erase history on the same browser and origin. Signed-in progress is stored
in D1. Guest history is merged and de-duplicated when a learner later signs in.

## Hosted release

The Sites release flow packages the working tree, saves an immutable version,
and deploys it to the project identified in `.openai/hosting.json`. The current
`*.chatgpt.site` address is a public testing preview, not the production domain.

Do not label a release production-ready until all of the following are supplied
and verified:

- an owned PacePrep hostname attached to the Sites project with HTTPS;
- a working domain-based support/grievance email;
- the operator's legal name and address/state for Terms and Privacy;
- approved permanent pricing and free-tier commitments;
- production performance validation for LCP, CLS, and INP.

The existing Sites deployment is retained instead of a parallel Vercel setup
because authentication, the D1 binding, and the deployment project are already
integrated with the Cloudflare Workers runtime. A Vercel migration would require
replacing those persistence and authentication integrations rather than merely
adding a configuration file.

If server-side features are added later, keep secrets out of source control,
declare their production bindings in the hosting platform, and add a documented
`.env.example` containing names only.

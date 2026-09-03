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
pnpm test
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

## Installable app (PWA)

PacePrep is a browser-installed web app, not an APK or App Store binary. The
manifest, Android/maskable icons, Apple touch icon, install entry points, and
Safari installation instructions are included. It reuses this deployment and
requires no separate native-app hosting service. Existing hosting and domain
costs still apply; this does not assert that production hosting is free.

The service worker caches **only** the public reconnect screen and icon. It
never caches account/API/auth responses. A currently loaded drill can continue
through a network interruption, but reopening the full trainer offline is not
yet supported. Cloud sync retries on reconnection. Updates are applied only
after an explicit reload confirmation, so an update cannot interrupt a drill.

Installable apps are bound to their origin. Move to the owned domain before a
wide installation campaign; students would need to reinstall after an origin
change. Guest history does not automatically transfer between origins or
between all browser/installed-app storage contexts. Signed-in sync is the
recommended migration route.

## Phased scope from the September brief

This iteration targets V1 usability plus the requested PWA foundation. It does
not claim V2/V3 completion or a guaranteed exam outcome. Recall Age, Hindi,
Fact → Paper/DI transfer, exam-pressure mode, exam-specific blueprints, cohort
percentiles, and advanced shortcut adoption analytics remain later-phase work.
The previously misleading “Velocity 10” category tile has been corrected to an
actual 10-question benchmark; a persistent 10-day commitment program and
server-verifiable certificates need their own implementation and validation.

For browser smoke checks, install Playwright and Chromium in a development
environment, run the production server, then run:

```bash
PACEPREP_TEST_URL=http://localhost:8787 node --experimental-strip-types tests/browser-smoke.mjs
```

The homepage diagnostic does not persist answers until the learner chooses to
save and affirms 18+ eligibility. Saved diagnostic attempts merge into the
same fact-level history, with de-duplication on subsequent loads.

The existing Sites deployment is retained instead of a parallel Vercel setup
because authentication, the D1 binding, and the deployment project are already
integrated with the Cloudflare Workers runtime. A Vercel migration would require
replacing those persistence and authentication integrations rather than merely
adding a configuration file.

If server-side features are added later, keep secrets out of source control,
declare their production bindings in the hosting platform, and add a documented
`.env.example` containing names only.

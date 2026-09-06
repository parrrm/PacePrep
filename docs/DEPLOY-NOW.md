# Deploy PacePrep to the Vercel domain

GitHub `main` already contains the operations trainer (`/ops`), practice hub
(`/practice`), cleaned landing, and guest progress persistence.

This Vercel project is **not** auto-deployed from GitHub. Merging does not update
https://paceprep-mental-math.vercel.app until one of these happens:

1. In Vercel: Project Settings -> Git -> connect `parrrm/PacePrep` and set
   Production Branch to `main`.
2. From a machine logged into the `mental-math` Vercel scope:

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build:vercel
vercel deploy --prod --scope mental-math --yes
```

Stay on the Vercel domain for now. Do not attach a custom domain until that is
requested separately.

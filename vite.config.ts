import { sites } from '@openai/sites-vite-plugin';
import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig, loadEnv, type UserConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import hostingConfig from './.openai/hosting.json';

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  '00000000-0000-4000-8000-000000000000';

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === 'seatbelt';

const localBindingConfig = {
  main: 'vinext/server/fetch-handler',
  compatibility_flags: ['nodejs_compat'],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: 'site-creator-d1',
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: 'site-creator-r2',
        },
      ]
    : [],
};

export default defineConfig(async ({ mode }): Promise<UserConfig> => {
  const publicEnv = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  const isVercel = process.env.PACEPREP_PLATFORM === 'vercel';
  const shared = {
    css: { postcss: { plugins: [tailwindcss()] } },
    define: {
      __PACEPREP_PLATFORM__: JSON.stringify(isVercel ? 'vercel' : 'sites'),
      __PACEPREP_SUPABASE_URL__: JSON.stringify(
        publicEnv.NEXT_PUBLIC_SUPABASE_URL || '',
      ),
      __PACEPREP_SUPABASE_KEY__: JSON.stringify(
        publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
          publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
          '',
      ),
      __PACEPREP_CLOUD_READY__: JSON.stringify(
        publicEnv.NEXT_PUBLIC_CLOUD_AUTH_READY === 'true',
      ),
    },
  };
  if (isVercel) {
    const { nitro } = await import('nitro/vite');
    const resolve = createRequire(import.meta.url).resolve;
    return {
      ...shared,
      resolve: {
        alias: {
          'paceprep:progress-store': fileURLToPath(
            new URL('./server/progress-supabase.ts', import.meta.url),
          ),
          tailwindcss: resolve('tailwindcss/index.css'),
          'tw-animate-css': fileURLToPath(
            new URL(
              './node_modules/tw-animate-css/dist/tw-animate.css',
              import.meta.url,
            ),
          ),
          'shadcn/tailwind.css': resolve('shadcn/tailwind.css'),
        },
      },
      plugins: [
        vinext(),
        nitro({ preset: process.env.NITRO_PRESET || 'vercel' }),
      ],
    };
  }
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= 'false';
  process.env.WRANGLER_LOG_PATH ??= '.wrangler/logs';
  process.env.MINIFLARE_REGISTRY_PATH ??= '.wrangler/registry';

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import('@cloudflare/vite-plugin');

  return {
    ...shared,
    resolve: {
      alias: {
        'paceprep:progress-store': fileURLToPath(
          new URL('./server/progress-store.ts', import.meta.url),
        ),
      },
    },
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
        config: localBindingConfig,
      }),
    ],
  };
});

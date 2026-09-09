import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const output = resolve(process.argv[2] || '.vercel/output');
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const isFile = async (path) => (await stat(path).catch(() => null))?.isFile();

// A successful Vite build alone is insufficient: a static-only deployment drops
// SSR and the authenticated progress API. Inspect the actual upload artifact.
const config = await readJson(join(output, 'config.json'));
assert.equal(config.version, 3, 'Expected Vercel Build Output API version 3');
const routes = config.routes || [];
const filesystemIndex = routes.findIndex(
  (route) => route.handle === 'filesystem',
);
const serverIndex = routes.findIndex(
  (route) => route.src === '/(.*)' && route.dest === '/__server',
);
assert.ok(filesystemIndex >= 0, 'Static asset routing is missing');
assert.ok(
  serverIndex > filesystemIndex,
  'SSR/API fallback must follow static assets',
);

const server = join(output, 'functions', '__server.func');
const functionConfig = await readJson(join(server, '.vc-config.json'));
assert.match(
  functionConfig.runtime,
  /^nodejs(?:22|24)\.x$/,
  'Unsupported Node runtime',
);
assert.equal(
  functionConfig.supportsResponseStreaming,
  true,
  'RSC streaming is required',
);
assert.ok(
  await isFile(join(server, functionConfig.handler)),
  'Server handler is missing',
);

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? filesIn(path) : [path];
    }),
  );
  return nested.flat();
}

const serverFiles = (await filesIn(server)).filter((path) =>
  /\.[cm]?js$/.test(path),
);
let hasSupabaseIdentityVerification = false;
for (const path of serverFiles) {
  const source = await readFile(path, 'utf8');
  assert.ok(
    !source.includes('cloudflare:workers'),
    'Cloudflare adapter leaked into Vercel output',
  );
  hasSupabaseIdentityVerification ||= source.includes('/auth/v1/user');
}
assert.ok(
  hasSupabaseIdentityVerification,
  'Vercel output is missing Supabase identity verification',
);

const publicDirectory = join(output, 'static');
const publicFiles = await filesIn(publicDirectory);
assert.ok(
  publicFiles.some((path) => path.endsWith('.css')),
  'Stylesheets are missing',
);
assert.ok(
  publicFiles.some(
    (path) => path.includes('/_next/static/') && path.endsWith('.js'),
  ),
  'Client chunks are missing',
);
assert.ok(
  !publicFiles.some((path) => /(?:^|\/)\.env(?:\.|$)/.test(path)),
  'An environment file is public',
);
assert.ok(
  !publicFiles.some((path) => dirname(path).includes('/api/')),
  'API responses must not be emitted as static assets',
);

for (const asset of [
  'sw.js',
  'offline.html',
  'manifest.webmanifest',
  'paceprep-social.png',
]) {
  assert.ok(
    await isFile(join(publicDirectory, asset)),
    `Required public asset is missing: ${asset}`,
  );
}
const manifest = await readJson(join(publicDirectory, 'manifest.webmanifest'));
for (const icon of manifest.icons || []) {
  assert.ok(
    typeof icon.src === 'string' && icon.src.startsWith('/'),
    'Manifest icons must be local',
  );
  assert.ok(
    await isFile(join(publicDirectory, icon.src)),
    `Manifest icon is missing: ${icon.src}`,
  );
}

console.log(
  `Vercel output verified: ${functionConfig.runtime}, SSR/API routing, Supabase adapter, ${publicFiles.length} public assets.`,
);

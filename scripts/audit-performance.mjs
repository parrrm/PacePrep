import { spawn } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { chromium } from '@playwright/test';

// Local lab measurement only. Build Vercel first; never audit a shared session.
const origin = 'http://localhost:4173';
const directory = resolve('outputs/lighthouse');
await mkdir(directory, { recursive: true });
await new Promise((accept, reject) => {
  const probe = createServer();
  probe.once('error', reject);
  probe.listen(4173, 'localhost', () => probe.close(accept));
});
const children = new Set();
function run(args, env = {}) {
  const child = spawn('pnpm', args, {
    detached: true,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
  children.add(child);
  const finished = new Promise((accept, reject) => {
    child.once('error', reject);
    child.once('exit', (code) => {
      children.delete(child);
      if (code === 0) accept();
      else reject(new Error(`Audit subprocess failed (${code})`));
    });
  });
  // Server failure is reported by the readiness loop or cleanup below.
  void finished.catch(() => {});
  return { child, finished };
}
function stop() {
  for (const child of children) {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      /* Already exited. */
    }
  }
}
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.once(signal, () => {
    stop();
    process.exitCode = 1;
  });
}
const server = run(
  [
    'exec',
    'vite',
    'preview',
    '--host',
    'localhost',
    '--port',
    '4173',
    '--strictPort',
  ],
  {
    PACEPREP_PLATFORM: 'vercel',
    NITRO_PRESET: 'vercel',
    NEXT_PUBLIC_CLOUD_AUTH_READY: 'false',
  },
);
try {
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    if (server.child.exitCode !== null)
      throw new Error('Audit server exited before readiness');
    ready = await fetch(origin, { signal: AbortSignal.timeout(1000) })
      .then((response) => response.ok)
      .catch(() => false);
    if (ready) break;
    await setTimeout(500);
  }
  if (!ready) throw new Error('Audit server did not become ready');
  for (const [name, path] of [
    ['home', '/'],
    ['practice', '/practice'],
  ]) {
    const output = resolve(directory, name);
    await run(
      [
        'exec',
        'lighthouse',
        `${origin}${path}`,
        '--chrome-flags=--headless',
        '--output=json',
        '--output=html',
        `--output-path=${output}`,
        '--quiet',
      ],
      {
        CHROME_PATH: chromium.executablePath(),
      },
    ).finished;
    const report = JSON.parse(await readFile(`${output}.report.json`, 'utf8'));
    if (report.runtimeError)
      throw new Error(`Lighthouse ${name} did not complete`);
    console.log(
      name,
      JSON.stringify({
        scores: Object.fromEntries(
          Object.entries(report.categories).map(([key, value]) => [
            key,
            Math.round(value.score * 100),
          ]),
        ),
        lcpMs: report.audits['largest-contentful-paint'].numericValue,
        cls: report.audits['cumulative-layout-shift'].numericValue,
        tbtMs: report.audits['total-blocking-time'].numericValue,
      }),
    );
  }
} finally {
  stop();
  await server.finished.catch(() => {});
}

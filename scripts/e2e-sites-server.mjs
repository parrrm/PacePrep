import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

// Never let integration fixtures reach a remote D1 binding.
const config = JSON.parse(await readFile('dist/server/wrangler.json', 'utf8'));
if (
  !config.d1_databases?.some((db) => db.binding === 'DB') ||
  config.d1_databases.some((db) => db.remote === true)
) {
  throw new Error('Integration tests require a local DB binding');
}
const directory = await mkdtemp(join(tmpdir(), 'paceprep-e2e-d1-'));
const child = spawn(
  'pnpm',
  [
    'exec',
    'wrangler',
    'dev',
    '--config',
    'dist/server/wrangler.json',
    '--port',
    '8787',
    '--ip',
    'localhost',
    '--local',
    '--persist-to',
    directory,
  ],
  { stdio: 'inherit' },
);
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
child.on('error', async () => {
  await rm(directory, { recursive: true, force: true });
  process.exitCode = 1;
});
child.on('exit', async (code, signal) => {
  await rm(directory, { recursive: true, force: true });
  process.exitCode = signal ? 0 : (code ?? 1);
});

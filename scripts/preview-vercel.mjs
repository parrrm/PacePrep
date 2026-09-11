// Exercise the actual Vercel artifact, never a stale dist/server build.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { Readable } from 'node:stream';
import app from '../.vercel/output/functions/__server.func/index.mjs';

const root = resolve('.vercel/output/static');
const types = {
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
};
const port = Number(process.env.PORT || 4173);
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${port}`);
    const path = resolve(root, '.' + decodeURIComponent(url.pathname));
    if (path.startsWith(root + sep) && ['GET', 'HEAD'].includes(req.method)) {
      const file = await stat(path).catch(() => null);
      if (file?.isFile()) {
        res.setHeader(
          'Content-Type',
          types[extname(path)] || 'application/octet-stream',
        );
        if (url.pathname.startsWith('/_next/static/'))
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.end(req.method === 'HEAD' ? undefined : await readFile(path));
        return;
      }
    }
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      ...(!['GET', 'HEAD'].includes(req.method)
        ? { body: Readable.toWeb(req), duplex: 'half' }
        : {}),
    });
    const response = await app.fetch(request, {
      waitUntil: (promise) => promise.catch(() => {}),
    });
    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (response.body && req.method !== 'HEAD')
      Readable.fromWeb(response.body).pipe(res);
    else res.end();
  } catch (error) {
    console.error('Local Vercel artifact request failed:', error.message);
    res.writeHead(500).end('Local preview failed');
  }
});
server.listen(port, 'localhost', () =>
  console.log(`Vercel artifact preview: http://localhost:${port}`),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.once(signal, () => server.close(() => process.exit(0)));

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('manifest icons exist with declared dimensions and an app scope', () => {
  const manifest = JSON.parse(
    fs.readFileSync(
      new URL('../public/manifest.webmanifest', import.meta.url),
      'utf8',
    ),
  );
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.scope, '/');
  for (const icon of manifest.icons) {
    const png = fs.readFileSync(
      new URL('../public' + icon.src, import.meta.url),
    );
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
  }
});
test('service worker never intercepts APIs, auth, writes, or other origins', () => {
  const listeners = {};
  vm.runInNewContext(
    fs.readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8'),
    {
      self: {
        location: { origin: 'https://paceprep.test' },
        addEventListener: (type, fn) => {
          listeners[type] = fn;
        },
      },
      URL,
    },
  );
  for (const [url, method, mode] of [
    ['https://paceprep.test/api/progress', 'GET', 'navigate'],
    ['https://paceprep.test/signin-with-chatgpt', 'GET', 'navigate'],
    ['https://paceprep.test/', 'POST', 'navigate'],
    ['https://other.test/', 'GET', 'navigate'],
  ]) {
    let intercepted = false;
    listeners.fetch({
      request: { url, method, mode },
      respondWith() {
        intercepted = true;
      },
    });
    assert.equal(intercepted, false, url);
  }
});
test('offline navigation serves only the public reconnect shell', async () => {
  const listeners = {};
  let response;
  vm.runInNewContext(
    fs.readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8'),
    {
      self: {
        location: { origin: 'https://paceprep.test' },
        addEventListener: (type, fn) => {
          listeners[type] = fn;
        },
      },
      URL,
      fetch: () => Promise.reject(new Error('offline')),
      caches: { match: async () => new Response('<h1>Reconnect</h1>') },
      Response,
    },
  );
  listeners.fetch({
    request: { url: 'https://paceprep.test/', method: 'GET', mode: 'navigate' },
    respondWith(value) {
      response = value;
    },
  });
  assert.equal((await response).status, 200);
  assert.equal(await (await response).text(), '<h1>Reconnect</h1>');
});

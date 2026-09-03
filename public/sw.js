/* Network-only app/data. Cache only the public reconnect shell, never account responses. */
const SHELL_CACHE = 'paceprep-shell-v1';
const SHELL = ['/offline.html', '/icons/icon-192.png'];
async function offlinePage() {
  const cached = await caches.match('/offline.html');
  // Reconstruct the public HTML response: edge asset responses can carry
  // transfer/content-encoding headers that are invalid for offline navigation.
  return new Response(cached ? await cached.text() : 'Reconnect to open PacePrep. Your saved progress has not been deleted.', {
    status: cached ? 200 : 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL)));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('paceprep-shell-') && key !== SHELL_CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('message', (event) => {
  if (event.data?.type === 'ACTIVATE_UPDATE') self.skipWaiting();
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    // Authentication and API requests must never receive a cached page.
    if (/^\/(api|signin-with-chatgpt|signout-with-chatgpt|__)/.test(url.pathname)) return;
    event.respondWith(fetch(request).catch(offlinePage));
  } else if (SHELL.includes(url.pathname)) {
    event.respondWith(caches.match(url.pathname).then((cached) => cached || fetch(request)));
  }
});

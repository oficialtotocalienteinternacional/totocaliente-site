const CACHE_NAME = 'toto-static-v2';
const STATIC_ASSETS = ['/no_bg_image.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('toto-static-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept API, login, registration, or session traffic.
  if (url.pathname.startsWith('/api/')) return;

  // HTML stays network-only so security fixes are not hidden by stale cached pages.
  if (request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) return;

  if (url.pathname === '/no_bg_image.png') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request).then((response) => {
          if (response.ok && response.type === 'basic') cache.put(request, response.clone());
          return response;
        });
        return cached || network;
      })
    );
  }
});

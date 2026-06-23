const CACHE = 'watsap-v1';
const STATIC = [
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin === location.origin && url.pathname.startsWith('/api/')) {
    e.respondWith(networkFirst(e.request));
  } else if (url.origin === location.origin) {
    e.respondWith(cacheFirst(e.request));
  }
});

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    const cache = await caches.open(CACHE);
    cache.put(req, res.clone());
    return res;
  } catch {
    return caches.match(req);
  }
}

async function cacheFirst(req) {
  const hit = await caches.match(req);
  return hit || fetch(req).catch(() => new Response('Offline', { status: 503 }));
}

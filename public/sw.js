// Service Worker — Lammtna (لمّتنا) Offline First Strategy
// Cache version: bump this to force cache invalidation
const CACHE_VERSION = 'v1.1.0';
const CACHE_NAME = `lammtna-${CACHE_VERSION}`;

// Files to pre-cache at install time (static assets only)
const PRE_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install: pre-cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRE_CACHE_URLS).catch(() => {});
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: Network First for JS/CSS (to always get fresh code), Cache First for images/fonts
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  const url = new URL(event.request.url);
  const pathname = url.pathname;

  // Never cache Vite dev server URLs (HMR websocket, @vite, @fs, node_modules, etc.)
  if (
    pathname.startsWith('/@') ||
    pathname.startsWith('/node_modules') ||
    pathname.includes('?') ||
    url.search.includes('t=') ||
    url.search.includes('v=')
  ) {
    // Always go to network for dev tooling
    return;
  }

  // For JS and CSS: Network First (ensures updated code always loads)
  if (pathname.endsWith('.js') || pathname.endsWith('.css')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails (offline)
          return caches.match(event.request);
        })
    );
    return;
  }

  // For everything else (HTML, images, manifest): Cache First with network fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

/* Simple service worker: cache shell assets and serve from cache first for offline support.
   This is intentionally minimal — for production consider workbox or a more robust strategy. */

const CACHE_NAME = 'sport-results-shell-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './public/manifest.json',
  './public/icons/icon-192.svg',
  './public/icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Network falling back to cache for navigation and app shell resources
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
      .then((resp) => resp || caches.match('./index.html'))
  );
});

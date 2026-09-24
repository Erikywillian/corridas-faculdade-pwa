const CACHE_NAME = 'corridas-faculdade-v5';
const APP_SHELL = [
  './', './index.html', './css/app.css', './js/app.js',
  './src/domain/dates.js', './src/domain/model.js', './src/domain/calculations.js',
  './src/services/app-service.js', './src/services/backup.js', './src/storage/indexed-db.js',
  './manifest.webmanifest', './assets/icons/icon-192.png', './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('corridas-faculdade-') && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
    return response;
  }).catch(() => caches.match('./index.html'))));
});

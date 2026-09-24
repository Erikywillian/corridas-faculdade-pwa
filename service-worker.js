"use strict";

// Incrementar a versão quando os arquivos do shell forem alterados.
const CACHE_PREFIX = `corridas-faculdade-pwa:${self.registration.scope}:`;
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const SHELL = [
  "./", "./index.html", "./css/app.css", "./js/app.js",
  "./manifest.webmanifest", "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png", "./assets/icons/apple-touch-icon.png"
];
const SHELL_URLS = new Set(SHELL.map((path) => new URL(path, self.registration.scope).href));

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || !SHELL_URLS.has(event.request.url)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    return (await cache.match(event.request)) || fetch(event.request);
  })());
});

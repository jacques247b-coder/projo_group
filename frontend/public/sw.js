// PROJO GROUP — Service Worker v2
const CACHE_NAME = "projo-v2";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  // Delete old caches
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (
    e.request.url.includes("/api/") ||
    e.request.url.includes("onrender.com") ||
    e.request.url.includes("payfast") ||
    e.request.url.includes("resend") ||
    !e.request.url.startsWith(self.location.origin)
  ) {
    return;
  }
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

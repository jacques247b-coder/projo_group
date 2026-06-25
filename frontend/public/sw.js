// PROJO GROUP — Service Worker
const CACHE_NAME = "projo-v1";

// Install — cache nothing for now, just activate
self.addEventListener("install", (e) => {
  self.skipWaiting();
});

// Activate
self.addEventListener("activate", (e) => {
  e.waitUntil(clients.claim());
});

// Fetch — network first, no caching of API calls
self.addEventListener("fetch", (e) => {
  // Don't intercept API calls or cross-origin requests
  if (
    e.request.url.includes("/api/") ||
    e.request.url.includes("onrender.com") ||
    e.request.url.includes("payfast") ||
    e.request.url.includes("resend") ||
    !e.request.url.startsWith(self.location.origin)
  ) {
    return;
  }
  // Network first for everything else
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

// PROJO GROUP — Service Worker (Cache Disabled)
// Unregisters itself and clears all caches
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => clients.matchAll({ type: "window" }))
      .then(clients => clients.forEach(c => c.navigate(c.url)))
      .then(() => self.registration.unregister())
  );
});

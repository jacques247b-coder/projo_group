// PROJO GROUP — Service Worker (Disabled - forces fresh load)
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => clients.matchAll({ type: "window" }))
      .then(cls => cls.forEach(c => c.navigate(c.url)))
  );
});
self.addEventListener("fetch", () => {});

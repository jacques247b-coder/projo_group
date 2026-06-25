// ============================================================
// PROJO GROUP — Service Worker
// Enables offline support and PWA install
// ============================================================

const CACHE_NAME = "projo-group-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/assets/logo/PROJO_LOGO.png",
  "https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap"
];

// Install — cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — serve from cache first, then network
self.addEventListener("fetch", (event) => {
  // Skip API calls — always fetch live
  if (event.request.url.includes("/api/") ||
      event.request.url.includes("railway.app") ||
      event.request.url.includes("socket.io")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        // Cache successful GET requests
        if (event.request.method === "GET" && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback
        if (event.request.destination === "document") {
          return caches.match("/index.html");
        }
      });
    })
  );
});

// Push notifications (for ride updates)
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || "PROJO GROUP", {
      body: data.body || "You have a new update",
      icon: "/assets/logo/PROJO_LOGO.png",
      badge: "/assets/logo/PROJO_LOGO.png",
      vibrate: [200, 100, 200],
      data: data.url || "/",
    })
  );
});

// Notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data || "/"));
});

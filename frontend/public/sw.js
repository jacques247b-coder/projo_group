// PROJO GROUP — Service Worker v4 (Auto-Update)
// ⚠️ INCREMENT THIS VERSION NUMBER WITH EVERY DEPLOY to force client updates
const SW_VERSION = "v4.0.3";
console.log("[PROJO SW] Version:", SW_VERSION);

self.addEventListener("install", () => {
  console.log("[PROJO SW] Installing:", SW_VERSION);
  self.skipWaiting(); // Take control immediately
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => clients.claim())
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

// ── Push Notifications ──────────────────────────────────────
self.addEventListener("push", (e) => {
  let data = { title: "PROJO GROUP", body: "You have a new notification" };
  try { data = e.data.json(); } catch {}

  const options = {
    image: data.image || undefined,
    body: data.body,
    icon: "/assets/logo/PROJO_LOGO.png",
    badge: "/assets/logo/PROJO_LOGO.png",
    vibrate: [200, 100, 200],
    data: data.data || {},
    tag: data.tag || "projo-notification",
  };

  e.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification click — open the relevant page
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url || "/";
  e.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

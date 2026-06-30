// PROJO GROUP — Push Notification Service
// Web Push API — works on Android Chrome, desktop Chrome/Edge
// iOS Safari has limited support (iOS 16.4+ only)

const VAPID_PUBLIC_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
}

export async function requestNotificationPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export async function subscribeToPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  if (!VAPID_PUBLIC_KEY) return null;

  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    // Send subscription to backend
    const token = localStorage.getItem("projo_token");
    await fetch(`${process.env.REACT_APP_API_URL}/notifications/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ subscription: sub }),
    });

    return sub;
  } catch (err) {
    console.log("[PROJO Push] Subscribe error:", err.message);
    return null;
  }
}

export function showLocalNotification(title, body, icon = "/assets/logo/PROJO_LOGO.png") {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  new Notification(title, {
    body,
    icon,
    badge: icon,
    vibrate: [200, 100, 200],
    tag: "projo-notification",
  });
}

// Show notification for ride status changes
export function notifyRideStatus(status, driverName) {
  const messages = {
    DRIVER_ASSIGNED:    { title: "🚗 Driver Assigned!", body: `${driverName || "Your driver"} is on the way` },
    DRIVER_EN_ROUTE:    { title: "🚗 Driver Coming!", body: `${driverName || "Your driver"} is heading to you` },
    ARRIVED_AT_PICKUP:  { title: "📍 Driver Arrived!", body: "Your driver is waiting at the pickup point" },
    IN_PROGRESS:        { title: "🚀 Ride Started!", body: "You are on your way. Enjoy the ride!" },
    COMPLETED:          { title: "✅ Ride Completed!", body: "Thank you for riding with PROJO GROUP" },
    CANCELLED:          { title: "❌ Ride Cancelled", body: "Your ride was cancelled" },
  };
  const msg = messages[status];
  if (msg) showLocalNotification(msg.title, msg.body);
}

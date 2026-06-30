// PROJO GROUP — Push Notification Subscription Helper
import api from "./api";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export async function requestNotificationPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export async function subscribeToPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.log("[PROJO Push] Push not supported on this browser");
    return false;
  }

  const granted = await requestNotificationPermission();
  if (!granted) return false;

  try {
    const { publicKey } = await api.get("/push/vapid-key");
    if (!publicKey) {
      console.log("[PROJO Push] No VAPID key configured on server");
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    await api.post("/push/subscribe", { subscription });
    console.log("[PROJO Push] ✅ Subscribed to push notifications");
    return true;
  } catch (err) {
    console.error("[PROJO Push] Subscribe error:", err);
    return false;
  }
}

export async function unsubscribeFromPush() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await api.post("/push/unsubscribe");
    }
  } catch (err) {
    console.error("[PROJO Push] Unsubscribe error:", err);
  }
}

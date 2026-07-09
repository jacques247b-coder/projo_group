// PROJO GROUP — Push Notification Subscription Helper
import api from "./api";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.log("[PROJO Push] Notification API not available in this browser at all");
    return false;
  }
  console.log("[PROJO Push] Current browser permission state:", Notification.permission);
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") {
    console.log("[PROJO Push] Browser has this site PERMANENTLY blocked already — requestPermission() won't even show a prompt");
    return false;
  }
  const result = await Notification.requestPermission();
  console.log("[PROJO Push] User's response to the native prompt:", result);
  return result === "granted";
}

export async function subscribeToPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.log("[PROJO Push] Push not supported on this browser");
    return { success: false, reason: "UNSUPPORTED" };
  }

  const granted = await requestNotificationPermission();
  if (!granted) {
    console.log("[PROJO Push] Not proceeding — permission was not granted");
    return { success: false, reason: "BROWSER_DENIED" };
  }

  try {
    const { publicKey } = await api.get("/push/vapid-key");
    console.log("[PROJO Push] VAPID public key from server:", publicKey ? publicKey.slice(0, 20) + "..." : "MISSING");
    if (!publicKey) {
      console.log("[PROJO Push] No VAPID key configured on server");
      return { success: false, reason: "SERVER_NOT_CONFIGURED" };
    }

    const registration = await navigator.serviceWorker.ready;
    console.log("[PROJO Push] Service worker ready, scope:", registration.scope);
    // Always start fresh rather than trusting a cached subscription — if
    // VAPID keys were ever regenerated after the original subscribe, the
    // browser would otherwise keep silently reusing the old (now invalid)
    // subscription instead of creating one that matches the current key.
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      console.log("[PROJO Push] Unsubscribing existing (possibly stale) subscription first");
      await existing.unsubscribe().catch((e) => console.log("[PROJO Push] Unsubscribe of old one failed (continuing anyway):", e.message));
    }
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    console.log("[PROJO Push] New subscription created, endpoint:", subscription.endpoint.slice(0, 60) + "...");

    await api.post("/push/subscribe", { subscription });
    console.log("[PROJO Push] ✅ Subscribed to push notifications — saved to server");
    return { success: true };
  } catch (err) {
    console.error("[PROJO Push] ❌ Subscribe error — full details:", err.name, err.message, err);
    return { success: false, reason: "SUBSCRIBE_FAILED", error: err.message };
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

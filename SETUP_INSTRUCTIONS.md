# PROJO GROUP — 4 New Features Setup Guide

## Feature 1 — Driver Live Tracking Improvements ✅
**File:** `frontend/src/components/map/LiveTrackingMap.jsx`
**What's new:**
- ETA banner showing minutes until arrival + distance + driver speed
- Car icon rotates to match direction of travel (heading)
- Smooth speed calculation between GPS pings

**No backend changes needed** — drop the file in and it works.

---

## Feature 2 — Push Notifications

### Step 1 — Install web-push package
```bash
cd backend
npm install web-push
```

### Step 2 — Generate VAPID keys (one-time)
```bash
npx web-push generate-vapid-keys
```
This prints a Public Key and Private Key.

### Step 3 — Add to Render backend Environment Variables
```
VAPID_PUBLIC_KEY = <paste public key>
VAPID_PRIVATE_KEY = <paste private key>
```

### Step 4 — Add to Prisma schema
Open `backend/prisma/schema.prisma`, find your `User` model, add this field:
```prisma
pushSubscription String?
```
Then run:
```bash
npx prisma migrate dev --name add_push_subscription
```

### Files to copy:
| File | Goes to |
|------|---------|
| `push.service.js` | `backend/src/services/` |
| `push.controller.js` | `backend/src/controllers/` |
| `push.routes.js` | `backend/src/routes/` |
| `pushNotifications.js` | `frontend/src/services/` |
| `sw.js` | `frontend/public/` (replaces existing) |

### How users enable it:
On the Wallet page, there's a "🔔 Enable Notifications" banner — tapping it requests browser permission and subscribes them.

### To send a notification (from any backend controller):
```js
const { notifyUser } = require("../controllers/push.controller");
await notifyUser(userId, {
  title: "Your ride is here!",
  body: "Your driver has arrived at the pickup point",
  data: { url: "/ride/" + rideId }
});
```

---

## Feature 3 — Promo Codes

### Step 1 — Add Prisma models
Open `backend/prisma/schema.prisma`, add the models from `SCHEMA_ADDITIONS.prisma` (included in this zip).
Then run:
```bash
npx prisma migrate dev --name add_promo_codes
```

### Files to copy:
| File | Goes to |
|------|---------|
| `promo.controller.js` | `backend/src/controllers/` |
| `promo.routes.js` | `backend/src/routes/` |
| `admin.routes.js` | `backend/src/routes/` (replaces existing — adds promo endpoints) |
| `PromoCodesPage.jsx` | `frontend/src/pages/admin/` |

### Add route in App.jsx:
```jsx
import PromoCodesPage from "./pages/admin/PromoCodesPage";
// Add this route:
<Route path="/admin/promo-codes" element={
  <Protected roles={["ADMIN"]}><PromoCodesPage /></Protected>
} />
```

### Admin creates codes at `/admin/promo-codes`:
- Code (e.g. PROJO10)
- Percentage or Fixed discount
- Min order amount, max discount cap, usage limits, expiry date

### Customers redeem codes on the Wallet page top-up section.

---

## Feature 4 — Loyalty Points Tracking ✅
**File:** `frontend/src/pages/passenger/WalletPage.jsx`
**What's new:**
- 3 loyalty tiers: Starter (0-500pts), Growth (500-1000pts), Elite (1000+pts)
- Visual progress bar showing points needed for next tier
- Tier discount percentage displayed
- Push notification opt-in banner
- Promo code redemption built into top-up flow

**No backend changes needed beyond promo codes above** — loyalty points already calculated from wallet balance (1pt per R10 spent).

---

## Final Steps

1. Copy all files to their destinations (see tables above)
2. Run the two Prisma migrations (push subscription field + promo models)
3. Install `web-push`: `npm install web-push` in backend folder
4. Generate and add VAPID keys to Render environment variables
5. Add the PromoCodesPage route to App.jsx
6. Commit and push:

```bash
cd "C:\Users\Neels\Documents\jacques & zanica folders\PROJO\PROJO\projo_group"
git add .
git commit -m "Add: Push notifications, promo codes, loyalty tiers, improved tracking"
git push
```

7. Redeploy backend on Render (auto-deploys on push)

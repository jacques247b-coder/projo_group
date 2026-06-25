# Step 5 — Driver App

## Files to copy

| File | Goes to |
|------|---------|
| `driver.controller.js` | `backend/src/controllers/` |
| `driver.routes.js` | `backend/src/routes/` |
| `ProjoMap.jsx` | `frontend/src/components/map/` |
| `index.js` (map) | `frontend/src/components/map/` |

---

## IMPORTANT — Add driver route to backend/src/index.js

Open `backend/src/index.js` and check if this line exists:

```js
app.use("/api/drivers", require("./routes/driver.routes"));
```

If it's missing, add it alongside the other routes:

```js
app.use("/api/auth",       require("./routes/auth.routes"));
app.use("/api/rides",      require("./routes/ride.routes"));
app.use("/api/wallet",     require("./routes/wallet.routes"));
app.use("/api/deliveries", require("./routes/delivery.routes"));
app.use("/api/shop",       require("./routes/shop.routes"));
app.use("/api/admin",      require("./routes/admin.routes"));
app.use("/api/drivers",    require("./routes/driver.routes")); // ← ADD THIS
```

---

## What was built

**driver.controller.js** (new)
- `getProfile` — returns driver's user record + wallet
- `updateStatus` — ONLINE/OFFLINE toggle (socket handles live tracking)
- `getEarnings` — queries completed rides by driverId, returns totalEarned, totalRides, avgPerRide. Also returns `totalEarnings` and `ridesCompleted` aliases so the dashboard stats card works
- `getPendingRides` — unassigned REQUESTED rides
- `register` — promotes user to DRIVER role

**driver.routes.js** (cleaned up)
- Now imports from controller instead of inline logic

**ProjoMap.jsx** (new)
- Driver-side map: shows 🚗 driver pin (live GPS), 📍 pickup, 🏁 dropoff
- Gold dashed route line: driver→pickup when en route, pickup→dropoff during ride
- Auto-fits bounds to show all pins

**map/index.js** (updated)
- Now exports both `LiveTrackingMap` and `ProjoMap`

---

## Step 5 ✅ Complete

Next: Step 6 — Courier & Logistics

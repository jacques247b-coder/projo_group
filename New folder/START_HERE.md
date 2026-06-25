# 🚀 PROJO GROUP — Quick Start Guide

## What's built ✅

| Module | Status | Files |
|--------|--------|-------|
| Project structure | ✅ Complete | All folders |
| Database schema | ✅ Complete | `backend/prisma/schema.prisma` |
| Auth (OTP + JWT) | ✅ Complete | `auth.controller.js`, `LoginPage.jsx` |
| Ride booking | ✅ Complete | `ride.controller.js`, `BookRidePage.jsx` |
| Live tracking | ✅ Complete | `socket.handlers.js`, `LiveTrackingMap.jsx` |
| Driver dashboard | ✅ Complete | `DriverDashboard.jsx`, `DriverEarnings.jsx` |
| Wallet + PayFast | ✅ Complete | `wallet.controller.js`, `WalletPage.jsx` |
| Courier/delivery | ✅ Complete | `delivery.routes.js`, `CourierPage.jsx` |
| Admin dashboard | ✅ Complete | `AdminDashboard.jsx`, `admin.routes.js` |
| Landing page | ✅ Complete | `LandingPage.jsx` |
| Maps | ✅ Leaflet + OpenStreetMap (FREE, no key) |
| Distance calc | ✅ OSRM (FREE, no key) |
| Fare engine | ✅ R60 flat / R7.50 per km |

---

## Step 1 — Install Node.js

Download from: **https://nodejs.org** (choose LTS version)

---

## Step 2 — Install PostgreSQL

Download from: **https://postgresql.org/download**

After install, create your database:
```
createdb projogroup
```

---

## Step 3 — Set up your environment

```bash
cd projo-group
cp .env.example backend/.env
```

Open `backend/.env` and fill in:
- `DATABASE_URL` — your PostgreSQL connection string
- `JWT_SECRET` — any long random string (e.g. `projo2024secretkey123`)
- `TWILIO_*` — from twilio.com (for SMS OTP)
- `PAYFAST_*` — from payfast.co.za (for payments)
- `CLOUDINARY_*` — from cloudinary.com (for file uploads)

**You do NOT need a Google Maps key — maps are free via OpenStreetMap.**

---

## Step 4 — Install all dependencies

```bash
npm run install:all
```

---

## Step 5 — Set up the database

```bash
npm run db:migrate
npm run db:seed
```

This creates all tables and seeds:
- Admin user (info@projogroup.co.za / ProjoAdmin2024!)
- All 8 Rustenburg surge zones
- Sample promo codes (PROJO10, RUSTENBURG, WELCOME50)
- Sample products

---

## Step 6 — Add your logo

Place your logo file at:
```
frontend/public/assets/logo/LogoPlacementGoldShineEdit.png
```

---

## Step 7 — Start the app

```bash
npm run dev
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **API Health:** http://localhost:5000/health
- **DB Studio:** `npm run db:studio`

---

## 🌐 Deploy online (free options)

| Part | Platform | Cost |
|------|----------|------|
| Backend + Database | [Railway.app](https://railway.app) | Free tier |
| Frontend | [Vercel.com](https://vercel.com) | Free |

---

## 📞 PROJO GROUP Contact

- WhatsApp: https://wa.me/27766147986
- Email: info@projogroup.co.za  
- Website: www.projogroup.co.za
- Shop: take.app/projogroup

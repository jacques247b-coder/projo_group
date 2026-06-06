# PROJO GROUP
## *Rustenburg's Own. Ride. Shop. Deliver.*

> Full-stack ride-hailing, e-commerce, and logistics platform  
> Serving Rustenburg, North West Province, South Africa

---

## 🗂️ Project Structure

```
projo-group/
├── frontend/                    # React.js + Tailwind CSS
│   ├── public/
│   │   └── assets/logo/
│   │       └── LogoPlacementGoldShineEdit.png  ← PUT YOUR LOGO HERE
│   └── src/
│       ├── components/
│       │   ├── ui/              # Shared UI components
│       │   ├── nav/             # Navigation bar
│       │   ├── ride/            # Ride booking components
│       │   ├── shop/            # E-commerce components
│       │   ├── courier/         # Courier/delivery components
│       │   ├── wallet/          # Wallet components
│       │   ├── driver/          # Driver app components
│       │   └── admin/           # Admin dashboard components
│       ├── pages/
│       │   ├── auth/            # Login, OTP, register
│       │   ├── passenger/       # Booking, history, tracking
│       │   ├── driver/          # Driver dashboard, earnings
│       │   ├── admin/           # Admin control panel
│       │   └── shop/            # Product catalog, cart
│       ├── hooks/               # Custom React hooks
│       ├── context/             # Auth, cart, socket contexts
│       ├── services/            # API calls (api.js)
│       └── utils/               # constants.js, helpers
│
├── backend/                     # Node.js + Express
│   ├── prisma/
│   │   ├── schema.prisma        # Full DB schema (11 models)
│   │   └── seed.js              # Initial data seeder
│   └── src/
│       ├── index.js             # Server entry point
│       ├── routes/              # Express route handlers
│       ├── controllers/         # Business logic
│       ├── middleware/          # Auth, validation
│       ├── services/            # External APIs (Twilio, PayFast)
│       ├── sockets/             # Socket.io live tracking
│       └── utils/
│           └── fare.calculator.js  # Core pricing engine
│
├── .env.example                 # All required env vars
├── package.json                 # Root monorepo scripts
└── README.md
```

---

## 🚀 Setup Guide

### 1. Clone and install dependencies

```bash
# Install all dependencies
npm run install:all
```

### 2. Configure environment variables

```bash
cp .env.example backend/.env
# Edit backend/.env with your real API keys
```

**Required API keys:**
| Service | Where to get it | Used for |
|---------|----------------|---------|
| `DATABASE_URL` | Your PostgreSQL instance | All data storage |
| `GOOGLE_MAPS_API_KEY` | [console.cloud.google.com](https://console.cloud.google.com) | Maps + distance calc |
| `TWILIO_*` | [twilio.com](https://twilio.com) | SMS OTP (+27 SA numbers) |
| `PAYFAST_*` | [payfast.co.za](https://payfast.co.za) | ZAR payments |
| `CLOUDINARY_*` | [cloudinary.com](https://cloudinary.com) | Driver doc uploads |
| `JWT_SECRET` | Any long random string | Auth tokens |

### 3. Set up PostgreSQL database

```bash
# Create the database
createdb projogroup

# Run migrations
npm run db:migrate

# Seed initial data (admin user, surge zones, promo codes)
npm run db:seed
```

### 4. Add your logo

Place your logo file at:
```
frontend/public/assets/logo/LogoPlacementGoldShineEdit.png
```

### 5. Start development

```bash
npm run dev
# Frontend: http://localhost:3000
# Backend:  http://localhost:5000
# Health:   http://localhost:5000/health
```

---

## 💰 Pricing Structure

| Zone | Condition | Rate |
|------|-----------|------|
| Zone 1 — Rustenburg | Both pickup & dropoff inside Rustenburg | **R60 flat** |
| Zone 2 — Outside | Any point outside Rustenburg boundary | **R7.50/km** (min R60) |

**Peak hours:** 06:00–09:00 and 16:00–19:00 → 15% surge  
- Zone 1 surge: R60 → **R70 flat**
- Zone 2 surge: distance fare × 1.15

**Vehicle multipliers:** Economy ×1.0 | Comfort ×1.3 | XL ×1.5 | Luxury ×2.5

**Driver payout:** 80% of every fare (R48 per Rustenburg flat ride)

---

## 🗺️ Service Areas

**Active (Zone 1 — R60 flat):**
- Rustenburg CBD, Waterfall East, Boitekong, Tlhabane
- Cashan, Protea Park, Rustenburg Industrial, Phokeng

**Future expansion (Zone 2 — per km):**
- Swartruggens, Brits, Sun City/Pilanesberg, Magaliesburg, Johannesburg

---

## 📱 Build Steps Checklist

- [x] **STEP 1** — Project structure + environment setup ✅
- [x] **STEP 2** — Database schema (11 Prisma models) ✅
- [ ] **STEP 3** — Authentication (OTP + JWT)
- [ ] **STEP 4** — Ride hailing core
- [ ] **STEP 5** — Driver app
- [ ] **STEP 6** — Online shop
- [ ] **STEP 7** — Courier & logistics
- [ ] **STEP 8** — PROJO GROUP Wallet
- [ ] **STEP 9** — Admin dashboard
- [ ] **STEP 10** — Landing page (preview built ✅)

---

## 📞 Contact

- **WhatsApp:** [+27 76 614 7986](https://wa.me/27766147986)
- **Email:** [info@projogroup.co.za](mailto:info@projogroup.co.za)
- **Website:** [www.projogroup.co.za](https://www.projogroup.co.za)
- **Shop:** [take.app/projogroup](https://take.app/projogroup)
- **Facebook:** [facebook.com/projogroup247](https://www.facebook.com/projogroup247)
- **Instagram:** [instagram.com/projogroup](https://www.instagram.com/projogroup?igsh=dGNsdTk3NmlvMjh2)

---

*PROJO GROUP — Rustenburg's Own. Est. 2023.*

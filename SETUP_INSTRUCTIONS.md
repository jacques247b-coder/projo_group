# PROJO GROUP — Configurable E-commerce Checkout Setup

## Step 1 — Add Prisma schema additions

Open `backend/prisma/schema.prisma` and add the two new models from `SCHEMA_ADDITION.prisma`:
- `ProductOptionGroup`
- `ProductOptionChoice`

Also add this ONE field to your existing `ServiceOrder` model:
```prisma
selectedOptions String?
```

## Step 2 — Run schema sync
```
cd backend
node node_modules\prisma\build\index.js db push
```

## Step 3 — Copy files

| File | Goes to |
|------|---------|
| `productOptions.controller.js` | `backend/src/controllers/` (new) |
| `service.controller.js` | `backend/src/controllers/` (overwrite) |
| `service.routes.js` | `backend/src/routes/` (overwrite) |
| `admin.routes.js` | `backend/src/routes/` (overwrite) |
| `ProductOptionsPage.jsx` | `frontend/src/pages/admin/` (new) |
| `ShopPage.jsx` | `frontend/src/pages/shop/` (overwrite) |

## Step 4 — Add route to App.jsx
```jsx
import ProductOptionsPage from "./pages/admin/ProductOptionsPage";

<Route path="/admin/product-options" element={
  <Protected roles={["ADMIN"]}><ProductOptionsPage /></Protected>
} />
```

## How it works

**Admin side (`/admin/product-options`):**
1. Select a service (e.g. Painting)
2. Add an option GROUP — e.g. "Property Size", type "Single choice", mark Required if mandatory
3. Add CHOICES to that group — e.g. "1 Bedroom" +R0, "2 Bedroom" +R150, "3 Bedroom" +R300
4. Add more groups as needed — e.g. "Urgency" with "Standard" +R0, "Same Day" +R200
5. Multi-select groups work too — e.g. "Add-ons" where customer can pick multiple extras

**Customer side (Shop page):**
1. Taps "Book Now" on a service
2. Sees all option groups as buttons — selects their choices
3. Price updates live as they pick (base + all selected modifiers)
4. Loyalty discount auto-applies on top of the calculated total
5. Pays via wallet or books via WhatsApp if it's a quote-only service

## Example setup for Painting

Base price: R28 (this becomes a "per unit" starting point — you can set base to R0 and make everything option-driven, or keep base R28 and use options for size multipliers)

**Recommended for Painting specifically:**
- Set base price to R0
- Group: "Property Size" (required, single choice)
  - "1 Bedroom (~50sqm)" → R1400
  - "2 Bedroom (~80sqm)" → R2240
  - "3 Bedroom (~120sqm)" → R3360
- Group: "Add-ons" (multi-select)
  - "Ceiling included" → +R300
  - "Exterior walls" → +R500

This gives full flexibility without needing custom per-sqm calculation logic.

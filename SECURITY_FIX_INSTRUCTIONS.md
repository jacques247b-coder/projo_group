# PROJO GROUP — Security Fix Instructions

## What was fixed (4 issues)

---

### 🔴 CRITICAL — Fix 1: Hardcoded database credentials in `makeadmin.js`

**Problem:** The production database password was hardcoded directly in the file.
If this file is on GitHub (even in a private repo), anyone with access can connect to your live database.

**Action required — do this NOW:**

1. **Rotate your Railway database password immediately:**
   - Go to railway.app → your project → PostgreSQL service → Variables
   - Regenerate the password
   - Update `DATABASE_URL` in your Render backend environment variables

2. **Replace `makeadmin.js`** with the fixed version (provided in this zip).
   It now reads `DATABASE_URL` from your `.env` file — no credentials in code.

3. **Run it like this going forward:**
   ```bash
   # From the project root (reads backend/.env automatically)
   node makeadmin.js +27620901372
   ```

---

### 🔴 CRITICAL — Fix 2: Admin panel has no role guard

**Problem:** Any logged-in user could hit `/api/admin/*` routes if they knew the URL.

**Fix:** Add `requireAdmin` middleware to your admin routes file.

**In `backend/src/routes/admin.routes.js`, change:**
```js
// BEFORE (insecure — any authenticated user can access admin)
router.use(authenticate);

// AFTER (secure — only ADMIN role gets through)
const { requireAdmin } = require("../middleware/requireAdmin");
router.use(authenticate, requireAdmin);
```

The new `requireAdmin.js` middleware file is included in this fix package.
Place it at: `backend/src/middleware/requireAdmin.js`

---

### 🟠 HIGH — Fix 3: OTP brute-force vulnerability

**Problem:** An attacker could try all 6-digit codes (000000–999999) with no rate limit.
That's only 1,000,000 combinations — easily automated.

**Fix:** The updated `auth.controller.js` now:
- Tracks failed OTP attempts per phone number
- Locks out the phone for **15 minutes** after **5 wrong attempts**
- Returns how many attempts remain before lockout
- Clears the counter on a successful login

The updated file is included — replace your existing `auth.controller.js`.

---

### 🟡 MEDIUM — Fix 4: `.gitignore` improvements

Add these to your root `.gitignore` to prevent future credential leaks:

```
# Already present (good):
.env
backend/.env
frontend/.env

# Add these:
*.env.local
*.env.production
.env.*
!.env.example
makeadmin.js.bak
```

---

## Files included in this fix

| File | Replaces | Description |
|------|----------|-------------|
| `makeadmin.js` | Root `makeadmin.js` | Reads DB URL from env, not hardcoded |
| `backend/src/controllers/auth.controller.js` | Existing auth controller | Adds OTP lockout after 5 failed attempts |
| `backend/src/middleware/requireAdmin.js` | New file | Blocks non-admin users from admin routes |

---

## How to apply

1. Copy the 3 files into your project at the paths shown above
2. In `admin.routes.js`, add `requireAdmin` (see Fix 2 above)
3. Rotate your Railway database password (see Fix 1 above)
4. Redeploy backend on Render

---

## Verify it's working

After deploy, test these scenarios:

**Admin lockout test:**
```bash
# Try wrong OTP 5 times — should get 429 on the 5th attempt
curl -X POST https://your-api.onrender.com/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+27620901372","otp":"000000"}'
```

**Admin route protection test:**
```bash
# Login as a normal PASSENGER user, get their token, then try:
curl -X GET https://your-api.onrender.com/api/admin/users \
  -H "Authorization: Bearer PASSENGER_TOKEN"
# Should return: 403 Access denied. Admin only.
```

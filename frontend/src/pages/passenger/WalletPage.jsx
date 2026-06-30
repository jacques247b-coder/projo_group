// PROJO GROUP — Wallet Page (with Promo Code redemption + Loyalty tracking)
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/ui/Navbar";
import { walletAPI } from "../../services/api";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { CONTACT } from "../../utils/constants";
import { subscribeToPush } from "../../services/pushNotifications";
import toast from "react-hot-toast";

const G = "#e8b84b";
const BG  = "#0a0a0a";
const BG2 = "#111111";
const BG3 = "#1a1a1a";
const BORDER = "rgba(232,184,75,0.2)";

const TX_ICONS = {
  TOPUP: "💳", RIDE_PAYMENT: "🚗", DELIVERY_PAYMENT: "📦",
  SHOP_PAYMENT: "🛍️", REFERRAL_BONUS: "🎁", LOYALTY_POINTS: "⭐",
  DRIVER_PAYOUT: "💰", REFUND: "↩️", PROMO_CREDIT: "🏷️",
};
const CREDIT_TYPES = ["TOPUP", "REFERRAL_BONUS", "PROMO_CREDIT", "REFUND"];

// Loyalty tiers
const TIERS = [
  { name: "Starter", min: 0,    max: 500,  color: "#a8a49e", discount: "5%" },
  { name: "Growth",  min: 500,  max: 1000, color: G,          discount: "10%" },
  { name: "Elite",   min: 1000, max: Infinity, color: "#a82020", discount: "15%" },
];

function getTier(points) {
  return TIERS.find(t => points >= t.min && points < t.max) || TIERS[TIERS.length - 1];
}

export default function WalletPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [wallet, setWallet]     = useState(null);
  const [txs, setTxs]           = useState([]);
  const [topupAmt, setTopupAmt] = useState("");
  const [loading, setLoading]   = useState(true);
  const [topping, setTopping]   = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoResult, setPromoResult] = useState(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(
    typeof Notification !== "undefined" && Notification.permission === "granted"
  );

  useEffect(() => {
    loadWallet();
    const params = new URLSearchParams(window.location.search);
    if (params.get("topup") === "success") {
      toast.success("Top-up successful! Balance updated.");
      window.history.replaceState({}, "", "/wallet");
    }
    if (params.get("topup") === "cancelled") {
      toast("Top-up cancelled.", { icon: "ℹ️" });
      window.history.replaceState({}, "", "/wallet");
    }
  }, []);

  async function loadWallet() {
    setLoading(true);
    try {
      const res = await walletAPI.getBalance();
      setWallet(res.wallet || res);
      setTxs(res.wallet?.transactions || []);
    } catch {
      toast.error("Could not load wallet");
    } finally { setLoading(false); }
  }

  async function handleTopup() {
    const amt = parseFloat(topupAmt);
    if (!amt || amt < 10) return toast.error("Minimum top-up is R10");
    setTopping(true);
    try {
      const res = await walletAPI.initiateTopUp(amt);
      if (res.paymentUrl) window.location.href = res.paymentUrl;
      else toast.error("Payment service unavailable. Please try again.");
    } catch (err) {
      toast.error(err?.error || "Top-up failed. Please try again.");
    } finally { setTopping(false); }
  }

  async function validatePromo() {
    if (!promoCode.trim()) return toast.error("Enter a promo code");
    setValidatingPromo(true);
    try {
      const res = await api.post("/promo/validate", {
        code: promoCode, orderAmount: parseFloat(topupAmt) || 0,
      });
      setPromoResult(res);
      toast.success(`Code applied! R${res.discount} off`);
    } catch (err) {
      toast.error(err?.error || "Invalid promo code");
      setPromoResult(null);
    } finally { setValidatingPromo(false); }
  }

  async function enableNotifications() {
    const success = await subscribeToPush();
    if (success) {
      setNotifEnabled(true);
      toast.success("Notifications enabled! You'll get ride and order updates.");
    } else {
      toast.error("Could not enable notifications. Check browser permissions.");
    }
  }

  const balance = wallet?.balanceZar || 0;
  const points  = wallet?.loyaltyPoints || Math.floor(balance / 10);
  const tier = getTier(points);
  const nextTier = TIERS[TIERS.indexOf(tier) + 1];
  const progressPct = nextTier
    ? Math.min(100, ((points - tier.min) / (nextTier.min - tier.min)) * 100)
    : 100;
  const QUICK_AMOUNTS = [50, 100, 200, 500];

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'DM Sans',sans-serif", paddingTop: "64px" }}>
      <Navbar />
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "2rem 1.5rem" }}>

        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: G, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>PROJO GROUP</div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.6rem", fontWeight: "800", color: "#f0ede8", margin: 0 }}>PROJO Wallet</h1>
        </div>

        {/* Balance card */}
        <div style={{ background: "linear-gradient(135deg,rgba(232,184,75,0.12),rgba(232,184,75,0.04))",
          border: "1px solid rgba(232,184,75,0.3)", borderRadius: "20px", padding: "2rem", marginBottom: "1rem" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#6b6760", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>Available Balance</div>
          {loading ? (
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "3rem", fontWeight: "800", color: "#3d3d3d" }}>R—</div>
          ) : (
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "3.5rem", fontWeight: "800", color: G, lineHeight: 1 }}>R{balance.toFixed(2)}</div>
          )}
          <div style={{ display: "flex", gap: "1.5rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "11px", color: "#6b6760", fontWeight: "600" }}>Loyalty Points</div>
              <div style={{ fontSize: "18px", fontWeight: "700", color: G }}>⭐ {points}</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "#6b6760", fontWeight: "600" }}>Refer & Earn</div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: G }}>R50 per referral</div>
            </div>
          </div>
        </div>

        {/* Loyalty Tier Progress */}
        <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "1.25rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <div>
              <div style={{ fontSize: "11px", color: "#6b6760", fontWeight: "700", textTransform: "uppercase" }}>Current Tier</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.3rem", fontWeight: "800", color: tier.color }}>{tier.name}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "11px", color: "#6b6760", fontWeight: "700", textTransform: "uppercase" }}>Discount</div>
              <div style={{ fontSize: "1.1rem", fontWeight: "800", color: tier.color }}>{tier.discount}</div>
            </div>
          </div>
          {nextTier && (
            <>
              <div style={{ height: "8px", background: BG3, borderRadius: "4px", overflow: "hidden", marginBottom: "6px" }}>
                <div style={{ height: "100%", width: `${progressPct}%`, background: `linear-gradient(90deg, ${tier.color}, ${nextTier.color})`, borderRadius: "4px", transition: "width .4s" }} />
              </div>
              <div style={{ fontSize: "11px", color: "#6b6760" }}>
                {nextTier.min - points} points to <strong style={{ color: nextTier.color }}>{nextTier.name}</strong>
              </div>
            </>
          )}
          <div style={{ fontSize: "11px", color: "#6b6760", marginTop: "10px" }}>Earn 1 point per R10 spent on rides, deliveries & services</div>
        </div>

        {/* Push Notifications */}
        {!notifEnabled && (
          <div onClick={enableNotifications} style={{
            background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.25)",
            borderRadius: "14px", padding: "1rem 1.25rem", marginBottom: "1rem",
            display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#60a5fa" }}>🔔 Enable Notifications</div>
              <div style={{ fontSize: "11px", color: "#6b6760", marginTop: "2px" }}>Get instant updates on rides, deliveries and offers</div>
            </div>
            <span style={{ color: "#60a5fa", fontSize: "20px" }}>→</span>
          </div>
        )}

        {/* Top up */}
        <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "1.5rem", marginBottom: "1rem" }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1rem", fontWeight: "700", color: "#f0ede8", marginBottom: "1rem" }}>Top Up Wallet</div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
            {QUICK_AMOUNTS.map(amt => (
              <button key={amt} onClick={() => setTopupAmt(String(amt))} style={{
                padding: "8px 16px", borderRadius: "50px", fontSize: "13px", fontWeight: "700", cursor: "pointer",
                background: topupAmt === String(amt) ? G : BG3, color: topupAmt === String(amt) ? "#0a0a0a" : "#a8a49e",
                border: topupAmt === String(amt) ? "none" : `1px solid ${BORDER}` }}>R{amt}</button>
            ))}
          </div>

          {/* Promo code input */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Promo code (optional)"
              style={{ flex: 1, background: BG3, border: `1px solid ${BORDER}`, borderRadius: "10px",
                color: "#f0ede8", padding: "10px 14px", fontSize: "13px", outline: "none",
                fontFamily: "'DM Sans',sans-serif", textTransform: "uppercase" }} />
            <button onClick={validatePromo} disabled={validatingPromo} style={{
              background: BG3, color: G, border: `1px solid ${BORDER}`, borderRadius: "10px",
              padding: "0 16px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
              {validatingPromo ? "..." : "Apply"}
            </button>
          </div>
          {promoResult && (
            <div style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.3)",
              borderRadius: "10px", padding: "8px 12px", marginBottom: "12px", fontSize: "12px", color: "#4ade80" }}>
              ✅ {promoResult.code} applied — R{promoResult.discount} discount
            </div>
          )}

          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ display: "flex", flex: 1, background: BG3, border: `1px solid ${BORDER}`, borderRadius: "10px", alignItems: "center", padding: "0 14px" }}>
              <span style={{ color: G, fontWeight: "700", fontSize: "18px", marginRight: "6px" }}>R</span>
              <input value={topupAmt} onChange={e => setTopupAmt(e.target.value)} placeholder="Enter amount" type="number" min="10"
                style={{ background: "transparent", border: "none", color: "#f0ede8", fontSize: "16px", outline: "none", flex: 1, fontFamily: "'DM Sans',sans-serif" }} />
            </div>
            <button onClick={handleTopup} disabled={topping} style={{
              background: topping ? "#9a7520" : G, color: "#0a0a0a", border: "none", borderRadius: "10px",
              padding: "0 24px", fontWeight: "700", fontSize: "14px", cursor: topping ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
              {topping ? "Redirecting..." : "Pay via PayFast"}
            </button>
          </div>
          <div style={{ fontSize: "11px", color: "#3d3d3d", marginTop: "8px" }}>Secure payment via PayFast · ZAR</div>
        </div>

        {/* Referral */}
        <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "1.25rem", marginBottom: "1.5rem",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <div>
            <div style={{ fontWeight: "700", color: "#f0ede8", marginBottom: "4px" }}>🎁 Invite Friends — Earn R50 Each</div>
            <div style={{ fontSize: "12px", color: "#6b6760" }}>Share PROJO GROUP. Both you and your friend get R50 wallet credit.</div>
          </div>
          <button onClick={() => {
            const msg = encodeURIComponent(`Join PROJO GROUP — Rustenburg's ride, delivery & services app! Get R50 wallet credit when you sign up. ${CONTACT.website}`);
            window.open(`https://wa.me/?text=${msg}`, "_blank");
          }} style={{ background: "#25D366", color: "#fff", border: "none", borderRadius: "10px", padding: "10px 18px",
            fontWeight: "700", fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap" }}>💬 Share</button>
        </div>

        {/* Transaction history */}
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1rem", fontWeight: "700", color: "#f0ede8", marginBottom: "1rem" }}>Transaction History</div>
        {loading ? (
          <div style={{ color: "#6b6760", textAlign: "center", padding: "2rem" }}>Loading...</div>
        ) : txs.length === 0 ? (
          <div style={{ color: "#6b6760", textAlign: "center", padding: "2rem", fontSize: "14px" }}>
            <div style={{ fontSize: "40px", marginBottom: "1rem" }}>💳</div>No transactions yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {txs.map(tx => (
              <div key={tx.id} style={{ background: BG2, border: "1px solid rgba(232,184,75,0.1)", borderRadius: "12px",
                padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <span style={{ fontSize: "20px" }}>{TX_ICONS[tx.type] || "💳"}</span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#f0ede8" }}>{tx.description}</div>
                    <div style={{ fontSize: "11px", color: "#6b6760", marginTop: "2px" }}>
                      {new Date(tx.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      {" · "}<span style={{ color: tx.status === "COMPLETED" ? "#4ade80" : "#f59e0b" }}>{tx.status}</span>
                    </div>
                  </div>
                </div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1rem", fontWeight: "800", color: CREDIT_TYPES.includes(tx.type) ? "#4ade80" : G }}>
                  {CREDIT_TYPES.includes(tx.type) ? "+" : "-"}R{tx.amountZar.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

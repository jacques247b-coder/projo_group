// ============================================================
// PROJO GROUP — Wallet Page
// Balance · Top up via PayFast · Transaction history · Loyalty points
// ============================================================
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/ui/Navbar";
import { walletAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { CONTACT } from "../../utils/constants";
import toast from "react-hot-toast";

const G = "#e8b84b";

const TX_ICONS = {
  TOPUP: "💳", RIDE_PAYMENT: "🚗", DELIVERY_PAYMENT: "📦",
  SHOP_PAYMENT: "🛍️", REFERRAL_BONUS: "🎁", LOYALTY_POINTS: "⭐",
  DRIVER_PAYOUT: "💰", REFUND: "↩️", PROMO_CREDIT: "🏷️",
};

export default function WalletPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [txs, setTxs] = useState([]);
  const [topupAmt, setTopupAmt] = useState("");
  const [loading, setLoading] = useState(true);
  const [topping, setTopping] = useState(false);

  useEffect(() => {
    Promise.all([
      walletAPI.getBalance().then(w => setWallet(w)).catch(() => {}),
      walletAPI.getTransactions().then(t => setTxs(t.transactions || [])).catch(() => {}),
    ]).finally(() => setLoading(false));

    // Handle PayFast return
    const params = new URLSearchParams(window.location.search);
    if (params.get("topup") === "success") toast.success("Top-up successful! Balance updated.");
    if (params.get("topup") === "cancelled") toast("Top-up cancelled.", { icon: "ℹ️" });
  }, []);

  async function handleTopup() {
    const amt = parseFloat(topupAmt);
    if (!amt || amt < 10) return toast.error("Minimum top-up is R10");
    setTopping(true);
    try {
      const res = await walletAPI.initiateTopUp(amt);
      if (res.paymentUrl) window.location.href = res.paymentUrl;
      else toast.error("Payment service unavailable. Try again later.");
    } catch { toast.error("Top-up failed"); }
    finally { setTopping(false); }
  }

  const balance = wallet?.balanceZar || 0;
  const points = wallet?.loyaltyPoints || 0;
  const QUICK_AMOUNTS = [50, 100, 200, 500];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a",
      fontFamily: "'DM Sans',sans-serif", paddingTop: "64px" }}>
      <Navbar />
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "2rem 1.5rem" }}>

        <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.6rem",
          fontWeight: "800", color: "#f0ede8", marginBottom: "1.5rem" }}>PROJO Wallet</h1>

        {/* Balance card */}
        <div style={{ background: "linear-gradient(135deg,rgba(232,184,75,0.12),rgba(232,184,75,0.04))",
          border: "1px solid rgba(232,184,75,0.3)", borderRadius: "20px",
          padding: "2rem", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#6b6760",
            letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>
            Available Balance
          </div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "3.5rem",
            fontWeight: "800", color: G, lineHeight: 1 }}>
            R{balance.toFixed(2)}
          </div>
          <div style={{ display: "flex", gap: "1.5rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "11px", color: "#6b6760", fontWeight: "600" }}>Loyalty Points</div>
              <div style={{ fontSize: "18px", fontWeight: "700", color: G }}>⭐ {points}</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "#6b6760", fontWeight: "600" }}>Referral Code</div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#f0ede8",
                fontFamily: "monospace", letterSpacing: "2px" }}>
                {user?.referralCode?.slice(0,8).toUpperCase()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "#6b6760", fontWeight: "600" }}>Refer & Earn</div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: G }}>R50 per referral</div>
            </div>
          </div>
        </div>

        {/* Top up */}
        <div style={{ background: "#111", border: "1px solid rgba(232,184,75,0.15)",
          borderRadius: "16px", padding: "1.5rem", marginBottom: "1.5rem" }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1rem",
            fontWeight: "700", color: "#f0ede8", marginBottom: "1rem" }}>
            Top Up Wallet
          </div>

          {/* Quick amounts */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
            {QUICK_AMOUNTS.map(amt => (
              <button key={amt} onClick={() => setTopupAmt(String(amt))}
                style={{
                  padding: "8px 16px", borderRadius: "50px", fontSize: "13px",
                  fontWeight: "700", cursor: "pointer", transition: "all .15s",
                  background: topupAmt === String(amt) ? G : "#1a1a1a",
                  color: topupAmt === String(amt) ? "#0a0a0a" : "#a8a49e",
                  border: topupAmt === String(amt) ? "none" : "1px solid rgba(232,184,75,0.2)",
                }}>
                R{amt}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ display: "flex", flex: 1, background: "#1a1a1a",
              border: "1px solid rgba(232,184,75,0.2)", borderRadius: "10px",
              alignItems: "center", padding: "0 14px" }}>
              <span style={{ color: G, fontWeight: "700", fontSize: "18px", marginRight: "6px" }}>R</span>
              <input value={topupAmt} onChange={e => setTopupAmt(e.target.value)}
                placeholder="Enter amount"
                style={{ background: "transparent", border: "none", color: "#f0ede8",
                  fontSize: "16px", outline: "none", flex: 1, fontFamily: "'DM Sans',sans-serif" }}
                type="number" min="10" />
            </div>
            <button onClick={handleTopup} disabled={topping}
              style={{ background: G, color: "#0a0a0a", border: "none",
                borderRadius: "10px", padding: "0 24px", fontWeight: "700",
                fontSize: "14px", cursor: topping ? "not-allowed" : "pointer",
                opacity: topping ? 0.7 : 1, whiteSpace: "nowrap" }}>
              {topping ? "Redirecting..." : "Pay via PayFast"}
            </button>
          </div>
          <div style={{ fontSize: "11px", color: "#3d3d3d", marginTop: "8px" }}>
            Secure payment via PayFast · ZAR · Credit card, EFT, or Instant EFT
          </div>
        </div>

        {/* Referral */}
        <div style={{ background: "#111", border: "1px solid rgba(232,184,75,0.15)",
          borderRadius: "16px", padding: "1.25rem", marginBottom: "1.5rem",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <div>
            <div style={{ fontWeight: "700", color: "#f0ede8", marginBottom: "4px" }}>
              🎁 Invite Friends — Earn R50 Each
            </div>
            <div style={{ fontSize: "12px", color: "#6b6760" }}>
              Share your referral code. Both you and your friend get R50 wallet credit.
            </div>
          </div>
          <button onClick={() => {
            const link = `https://wa.me/?text=${encodeURIComponent(`Join PROJO GROUP — Rustenburg's ride app! Use my code ${user?.referralCode?.slice(0,8).toUpperCase()} to get R50 wallet credit. ${CONTACT.website}`)}`;
            window.open(link, "_blank");
          }} style={{ background: G, color: "#0a0a0a", border: "none", borderRadius: "10px",
            padding: "10px 18px", fontWeight: "700", fontSize: "13px", cursor: "pointer",
            whiteSpace: "nowrap" }}>
            Share on WhatsApp
          </button>
        </div>

        {/* Transaction history */}
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1rem",
          fontWeight: "700", color: "#f0ede8", marginBottom: "1rem" }}>
          Transaction History
        </div>
        {loading ? (
          <div style={{ color: "#6b6760", textAlign: "center", padding: "2rem" }}>Loading...</div>
        ) : txs.length === 0 ? (
          <div style={{ color: "#6b6760", textAlign: "center", padding: "2rem", fontSize: "14px" }}>
            No transactions yet. Top up your wallet to get started!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {txs.map(tx => (
              <div key={tx.id} style={{ background: "#111",
                border: "1px solid rgba(232,184,75,0.1)", borderRadius: "12px",
                padding: "1rem 1.25rem", display: "flex",
                justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <span style={{ fontSize: "20px" }}>{TX_ICONS[tx.type] || "💳"}</span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#f0ede8" }}>
                      {tx.description}
                    </div>
                    <div style={{ fontSize: "11px", color: "#6b6760", marginTop: "2px" }}>
                      {new Date(tx.createdAt).toLocaleDateString("en-ZA", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                      })}
                      {" · "}
                      <span style={{ color: tx.status === "COMPLETED" ? "#4ade80" : "#f59e0b" }}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1rem",
                  fontWeight: "800",
                  color: ["TOPUP", "REFERRAL_BONUS", "PROMO_CREDIT", "REFUND"].includes(tx.type)
                    ? "#4ade80" : G }}>
                  {["TOPUP", "REFERRAL_BONUS", "PROMO_CREDIT", "REFUND"].includes(tx.type) ? "+" : "-"}
                  R{tx.amountZar.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// PROJO GROUP — Shop Page (Configurable In-App Checkout)
// Customers select options (size, add-ons) and price calculates live
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { CONTACT } from "../../utils/constants";
import api from "../../services/api";
import toast from "react-hot-toast";
import Navbar from "../../components/ui/Navbar";

const G = "#e8b84b";
const BG = "#0d0505";
const BG2 = "#120808";
const BG3 = "#1c0f0f";
const BORDER = "rgba(232,184,75,0.18)";

const CATEGORY_ICONS = {
  "Cleaning": "🧹", "Maintenance": "🔧", "Painting": "🎨", "Pest Control": "🐛",
  "Web & App Development": "💻", "Runners & Deliveries": "🏃",
  "Locksmith": "🔑", "PC & Console Repair": "🖥️", "CCTV": "📷", "Marketing": "📣",
};

const CATEGORY_IMAGES = {
  "Cleaning": "/assets/categories/cleaning.png",
  "Maintenance": "/assets/categories/maintenance.png",
  "Painting": "/assets/categories/painting.png",
  "Pest Control": "/assets/categories/pest-control.png",
  "Web & App Development": "/assets/categories/web-app-development.png",
  "Runners & Deliveries": "/assets/categories/runners-deliveries.png",
  "Locksmith": "/assets/categories/locksmith.png",
  "PC & Console Repair": "/assets/categories/pc-console-repair.png",
  "CCTV": "/assets/categories/cctv.png",
  "Digital Marketing": "/assets/categories/digital-marketing.png",
  "Laundry Services": "/assets/categories/laundry.png",
  "Products": "/assets/categories/products-shop.png",
};
const CATEGORY_COLORS = {
  "Cleaning": "#4ade80", "Maintenance": "#60a5fa", "Painting": "#f472b6",
  "Pest Control": "#a78bfa", "Web & App Development": "#34d399",
  "Runners & Deliveries": G, "Locksmith": "#f59e0b", "PC & Console Repair": "#60a5fa",
  "CCTV": "#a78bfa", "Marketing": "#f472b6",
};

// ── In-App Checkout Modal with Options ─────────────────────────
function CheckoutModal({ product, onClose }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [selectedChoices, setSelectedChoices] = useState({}); // { groupId: [choiceId, ...] }
  const [textValues, setTextValues] = useState({}); // { groupId: "text input value" }
  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [date, setDate] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [notes, setNotes] = useState("");
  const [payWithWallet, setPayWithWallet] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    loadOptions();
    loadWallet();
  }, []);

  useEffect(() => {
    loadQuote();
  }, [selectedChoices]);

  async function loadOptions() {
    try {
      const res = await api.get(`/services/products/${product.id}/options`);
      setGroups(res.groups || []);
    } catch {}
  }

  async function loadWallet() {
    try {
      const res = await api.get("/wallet");
      setWalletBalance(res.wallet?.balanceZar || 0);
    } catch {}
  }

  function getAllSelectedIds() {
    return Object.values(selectedChoices).flat();
  }

  async function loadQuote() {
    setLoadingQuote(true);
    try {
      const res = await api.post("/services/quote", {
        productId: product.id,
        selectedChoiceIds: getAllSelectedIds(),
      });
      setQuote(res);
    } catch (err) {
      toast.error("Could not load pricing");
    } finally { setLoadingQuote(false); }
  }

  function toggleChoice(groupId, choiceId, isMulti) {
    setSelectedChoices(prev => {
      const current = prev[groupId] || [];
      if (isMulti) {
        // Multi: toggle on/off
        const next = current.includes(choiceId)
          ? current.filter(id => id !== choiceId)
          : [...current, choiceId];
        return { ...prev, [groupId]: next };
      } else {
        // Single: click same = deselect, click different = select
        const next = current.includes(choiceId) ? [] : [choiceId];
        return { ...prev, [groupId]: next };
      }
    });
  }

  function isSelected(groupId, choiceId) {
    return (selectedChoices[groupId] || []).includes(choiceId);
  }

  async function handleBookViaWhatsApp() {
    const optionsText = groups.map(g => {
      const selected = (selectedChoices[g.id] || [])
        .map(cid => g.choices.find(c => c.id === cid)?.label)
        .filter(Boolean).join(", ");
      return selected ? `${g.name}: ${selected}` : null;
    }).filter(Boolean).join("\n");

    const msg = encodeURIComponent(
      `*PROJO GROUP Booking Request*\n\n` +
      `*Service:* ${product.name}\n` +
      `*Category:* ${product.category}\n` +
      (optionsText ? `${optionsText}\n` : "") +
      `*Date/Time:* ${date || "To be confirmed"}\n` +
      `*Address:* ${address}\n` +
      `*Phone:* ${phone}\n` +
      `*Notes:* ${notes || "None"}\n\n` +
      `Please confirm my booking. Thank you!`
    );
    window.open(`https://wa.me/${CONTACT.whatsapp}?text=${msg}`, "_blank");
    toast.success("Opening WhatsApp to confirm your booking!");
    onClose();
  }

  async function handleBookInApp() {
    if (!address) return toast.error("Please enter your address");
    if (!phone) return toast.error("Please enter your phone");

    // Check required groups
    for (const group of groups) {
      if (group.required) {
        if (group.type === "TEXT" && !(textValues[group.id] || "").trim()) {
          return toast.error(`Please fill in "${group.name}"`);
        }
        if (group.type !== "TEXT" && !(selectedChoices[group.id] || []).length) {
          return toast.error(`Please select an option for "${group.name}"`);
        }
      }
    }

    if (payWithWallet && quote.finalPrice > walletBalance) {
      return toast.error(`Insufficient wallet balance. Need R${quote.finalPrice.toFixed(2)}, you have R${walletBalance.toFixed(2)}`);
    }

    setSubmitting(true);
    try {
      // Combine text-option answers into notes
      const textAnswers = Object.entries(textValues)
        .filter(([_, v]) => v && v.trim())
        .map(([groupId, v]) => {
          const group = groups.find(g => g.id === groupId);
          return group ? `${group.name}: ${v}` : null;
        })
        .filter(Boolean)
        .join("\n");
      const combinedNotes = [textAnswers, notes].filter(Boolean).join("\n\n");

      const res = await api.post("/services/book", {
        productId: product.id,
        scheduledFor: date || null,
        address, phone, notes: combinedNotes,
        paidWithWallet: payWithWallet,
        selectedChoiceIds: getAllSelectedIds(),
      });
      toast.success(res.message || "Booked!");
      onClose();
    } catch (err) {
      toast.error(err?.error || "Booking failed");
    } finally { setSubmitting(false); }
  }

  const inp = {
    width: "100%", background: BG3, border: `1px solid ${BORDER}`,
    color: "#f5ede8", borderRadius: "10px", padding: "11px 14px",
    fontSize: "14px", fontFamily: "'DM Sans',sans-serif", outline: "none",
    boxSizing: "border-box",
  };
  const lbl = {
    fontSize: "11px", fontWeight: "700", color: "#7a5a55",
    letterSpacing: "0.8px", textTransform: "uppercase",
    display: "block", marginBottom: "6px",
  };

  const requiresQuote = quote?.requiresQuote;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.8)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      fontFamily: "'DM Sans',sans-serif",
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: BG2, borderRadius: "20px 20px 0 0",
        border: `1px solid ${BORDER}`, padding: "1.5rem",
        width: "100%", maxWidth: "600px", maxHeight: "85vh",
        overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", marginBottom: "1.25rem" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: G,
              letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>
              {CATEGORY_ICONS[product.category]} {product.category}
            </div>
            <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.2rem",
              fontWeight: "800", color: "#f5ede8", margin: 0 }}>{product.name}</h3>
          </div>
          <button onClick={onClose} style={{
            background: BG3, border: `1px solid ${BORDER}`, borderRadius: "50%",
            width: "32px", height: "32px", cursor: "pointer", color: "#7a5a55",
            fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        {/* Description */}
        <div style={{ fontSize: "13px", color: "#b8a09a", marginBottom: "1.25rem", lineHeight: 1.6 }}>
          {product.description}
        </div>

        {/* Option groups */}
        {groups.map(group => (
          <div key={group.id} style={{ marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#f5ede8",
              marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              {group.name}
              {group.required && <span style={{ color: "#f87171", fontSize: "11px" }}>*</span>}
              {group.type !== "TEXT" && (
                <span style={{ fontSize: "10px", color: "#7a5a55", fontWeight: "400" }}>
                  {group.type === "MULTI" ? "(select any)" : "(choose one)"}
                </span>
              )}
            </div>

            {group.type === "TEXT" ? (
              <textarea
                value={textValues[group.id] || ""}
                onChange={e => setTextValues(prev => ({ ...prev, [group.id]: e.target.value }))}
                placeholder={`Enter ${group.name.toLowerCase()}...`}
                rows={2}
                style={{
                  width: "100%", background: BG3, border: `1px solid ${BORDER}`,
                  color: "#f5ede8", borderRadius: "10px", padding: "11px 14px",
                  fontSize: "13px", fontFamily: "'DM Sans',sans-serif", outline: "none",
                  resize: "vertical", boxSizing: "border-box",
                }}
              />
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {group.choices.map(choice => (
                  <button key={choice.id} onClick={() => toggleChoice(group.id, choice.id, group.type === "MULTI")}
                    style={{
                      background: isSelected(group.id, choice.id) ? "rgba(232,184,75,0.15)" : BG3,
                      border: `1px solid ${isSelected(group.id, choice.id) ? G : BORDER}`,
                      borderRadius: "10px", padding: "8px 14px", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: "6px",
                    }}>
                    <span style={{ fontSize: "13px",
                      color: isSelected(group.id, choice.id) ? G : "#b8a09a",
                      fontWeight: isSelected(group.id, choice.id) ? "700" : "500" }}>
                      {choice.label}
                    </span>
                    {choice.priceModifier !== 0 && (
                      <span style={{ fontSize: "11px",
                        color: isSelected(group.id, choice.id) ? G : "#7a5a55" }}>
                        ({choice.priceModifier > 0 ? "+" : ""}R{choice.priceModifier})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Pricing breakdown */}
        {loadingQuote ? (
          <div style={{ textAlign: "center", padding: "1.5rem", color: "#7a5a55" }}>Calculating price...</div>
        ) : requiresQuote ? (
          <div style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: "12px",
            padding: "1rem", marginBottom: "1.25rem", fontSize: "13px", color: "#b8a09a" }}>
            This service requires a custom quote. Book via WhatsApp and we'll get back to you with pricing.
          </div>
        ) : (
          <div style={{ background: "rgba(232,184,75,0.06)", border: `1px solid ${BORDER}`,
            borderRadius: "12px", padding: "1rem", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "13px", color: "#b8a09a" }}>Base price</span>
              <span style={{ fontSize: "13px", color: "#b8a09a" }}>R{quote.baseProductPrice}</span>
            </div>
            {quote.selections?.map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "12px", color: "#7a5a55" }}>{s.groupName}: {s.choiceLabel}</span>
                <span style={{ fontSize: "12px", color: "#7a5a55" }}>
                  {s.priceModifier >= 0 ? "+" : ""}R{s.priceModifier}
                </span>
              </div>
            ))}
            {quote.loyaltyDiscount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
                <span style={{ fontSize: "13px", color: "#4ade80" }}>
                  {quote.loyaltyTier} tier discount ({quote.loyaltyDiscountPct}%)
                </span>
                <span style={{ fontSize: "13px", color: "#4ade80" }}>-R{quote.loyaltyDiscount}</span>
              </div>
            )}
            <div style={{ height: "1px", background: BORDER, margin: "8px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#f5ede8" }}>Total</span>
              <span style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.5rem",
                fontWeight: "800", color: G }}>R{quote.finalPrice}</span>
            </div>
          </div>
        )}

        {/* Booking form */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={lbl}>📅 Preferred Date & Time</label>
            <input type="datetime-local" value={date}
              onChange={e => setDate(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>📍 Your Address *</label>
            <input value={address} onChange={e => setAddress(e.target.value)}
              placeholder="Enter your full address in Rustenburg" style={inp} />
          </div>
          <div>
            <label style={lbl}>📞 Phone Number *</label>
            <input value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+27 83 123 4567" type="tel" style={inp} />
          </div>
          <div>
            <label style={lbl}>📝 Special Instructions (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Any specific requirements or notes..."
              rows={3} style={{ ...inp, resize: "vertical" }} />
          </div>

          {!requiresQuote && (
            <div onClick={() => setPayWithWallet(p => !p)} style={{
              background: BG3, border: `1px solid ${BORDER}`, borderRadius: "12px",
              padding: "12px 16px", display: "flex",
              alignItems: "center", justifyContent: "space-between", cursor: "pointer",
            }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#f5ede8" }}>
                  💳 Pay with PROJO Wallet
                </div>
                <div style={{ fontSize: "12px", color: "#7a5a55", marginTop: "2px" }}>
                  Balance: <strong style={{ color: G }}>R{walletBalance.toFixed(2)}</strong>
                </div>
              </div>
              <div style={{ width: "44px", height: "24px", borderRadius: "12px",
                background: payWithWallet ? G : BG3, position: "relative",
                transition: "background .2s", border: `1px solid ${BORDER}` }}>
                <div style={{ width: "18px", height: "18px", borderRadius: "50%",
                  background: "#0d0505", position: "absolute", top: "3px",
                  transition: "left .2s", left: payWithWallet ? "22px" : "3px" }} />
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "1.25rem" }}>
          {requiresQuote ? (
            <button onClick={handleBookViaWhatsApp} style={{
              flex: 1, background: "#25D366", color: "#fff", border: "none",
              borderRadius: "12px", padding: "14px", fontSize: "14px",
              fontWeight: "800", cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
            }}>
              💬 Request Quote via WhatsApp
            </button>
          ) : (
            <button onClick={handleBookInApp} disabled={submitting || loadingQuote} style={{
              flex: 1, background: G, color: "#1a0808", border: "none",
              borderRadius: "12px", padding: "14px", fontSize: "14px",
              fontWeight: "800", cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1, fontFamily: "'DM Sans',sans-serif",
            }}>
              {submitting ? "Booking..." : `Book & Pay R${quote?.finalPrice || product.priceZar}`}
            </button>
          )}
          <button onClick={onClose} style={{
            background: BG3, color: "#7a5a55", border: `1px solid ${BORDER}`,
            borderRadius: "12px", padding: "14px 20px", fontSize: "14px",
            cursor: "pointer",
          }}>Cancel</button>
        </div>

        {!requiresQuote && (
          <div style={{ textAlign: "center", marginTop: "10px",
            fontSize: "11px", color: "#7a5a55" }}>
            Or <button onClick={handleBookViaWhatsApp} style={{
              background: "none", border: "none", color: G, cursor: "pointer",
              textDecoration: "underline", fontSize: "11px" }}>book via WhatsApp instead</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShopPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/shop/products`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("projo_token")}` } }
      );
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      toast.error("Could not load services");
    } finally {
      setLoading(false);
    }
  }

  const categories = ["All", ...new Set(products.map(p => p.category))];

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    return matchSearch && p.isActive;
  });

  // Always grouped by category in correct order
  const CATEGORY_ORDER = [
    "Cleaning", "Maintenance", "Painting", "CCTV", "Locksmith",
    "Pest Control", "Runners & Deliveries", "PC & Console Repair",
    "Laundry Services", "Web & App Development", "Digital Marketing", "Products"
  ];
  const grouped = CATEGORY_ORDER
    .map(cat => ({ category: cat, items: filtered.filter(p => p.category === cat) }))
    .filter(g => g.items.length > 0);

  function renderProductCard(product) {
    return (
      <div key={product.id} style={{
        background: BG2, border: `1px solid ${BORDER}`,
        borderRadius: "16px", padding: "1.25rem",
        transition: "all .2s", cursor: "pointer",
      }}
      onMouseOver={e => e.currentTarget.style.borderColor = G}
      onMouseOut={e => e.currentTarget.style.borderColor = BORDER}>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", gap: "12px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1rem",
              fontWeight: "700", color: "#f5ede8", marginBottom: "6px" }}>
              {product.name}
            </div>
            <div style={{ fontSize: "12px", color: "#b8a09a", lineHeight: 1.6,
              display: "-webkit-box", WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {product.description}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            {product.priceZar > 0 ? (
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.2rem",
                fontWeight: "800", color: G, marginBottom: "8px" }}>
                R{product.priceZar}
              </div>
            ) : (
              <div style={{ fontSize: "11px", color: "#7a5a55",
                marginBottom: "8px", fontWeight: "700" }}>
                Get Quote
              </div>
            )}
            <button onClick={() => setSelectedProduct(product)} style={{
              background: G, color: "#1a0808", border: "none",
              borderRadius: "8px", padding: "8px 16px", fontSize: "12px",
              fontWeight: "800", cursor: "pointer", whiteSpace: "nowrap",
            }}>
              Book Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'DM Sans',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "84px 1rem 2rem" }}>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: G,
              letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>
              PROJO GROUP Services
            </div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.8rem",
              fontWeight: "800", color: "#f5ede8", marginBottom: "4px" }}>
              Book a Service
            </h1>
            <p style={{ fontSize: "13px", color: "#7a5a55" }}>
              Book & pay in-app · Earn loyalty points · Discounts auto-applied
            </p>
          </div>
          <button onClick={() => navigate("/products")} style={{
            background: "rgba(232,184,75,0.1)", border: `1px solid ${G}`,
            borderRadius: "8px", padding: "6px 12px", cursor: "pointer",
            color: G, fontSize: "12px", fontWeight: "700",
            fontFamily: "'DM Sans',sans-serif", flexShrink: 0, marginTop: "4px",
          }}>🛍️ Products Shop</button>
        </div>

        <div style={{ position: "relative", marginBottom: "1rem" }}>
          <span style={{ position: "absolute", left: "12px", top: "50%",
            transform: "translateY(-50%)", fontSize: "16px" }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search services..."
            style={{ width: "100%", background: BG2, border: `1px solid ${BORDER}`,
              color: "#f5ede8", borderRadius: "10px", padding: "11px 14px 11px 40px",
              fontSize: "14px", fontFamily: "'DM Sans',sans-serif", outline: "none",
              boxSizing: "border-box" }} />
        </div>

        {/* Category quick-jump pills — scroll to section, in correct order */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap",
          marginBottom: "1.25rem" }}>
          {CATEGORY_ORDER.filter(cat => grouped.some(g => g.category === cat)).map(cat => (
            <button key={cat} onClick={() => {
              const el = document.getElementById(`cat-${cat}`);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }} style={{
              background: BG2, color: "#b8a09a",
              border: `1px solid ${BORDER}`,
              borderRadius: "50px", padding: "6px 14px 6px 6px", fontSize: "12px",
              fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap",
              flexShrink: 0, fontFamily: "'DM Sans',sans-serif",
              display: "flex", alignItems: "center", gap: "6px",
            }}>
              {CATEGORY_IMAGES[cat] ? (
                <img src={CATEGORY_IMAGES[cat]} alt={cat}
                  style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }}
                  onError={e => { e.target.style.display = "none"; }} />
              ) : (
                <span>{CATEGORY_ICONS[cat] || "🛠️"}</span>
              )}
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#7a5a55" }}>
            Loading services...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#7a5a55" }}>
            No services found
          </div>
        ) : (
          // Always grouped by category — fully visible, no filter clicks needed
          <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
            {grouped.map(g => (
              <div key={g.category} id={`cat-${g.category}`} style={{ scrollMarginTop: "80px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px",
                  marginBottom: "12px" }}>
                  {CATEGORY_IMAGES[g.category] ? (
                    <img src={CATEGORY_IMAGES[g.category]} alt={g.category}
                      style={{ width: "44px", height: "44px", borderRadius: "50%",
                        objectFit: "cover", flexShrink: 0,
                        boxShadow: "0 0 10px rgba(232,184,75,0.4)" }}
                      onError={e => { e.target.style.display = "none"; }} />
                  ) : (
                    <span style={{ fontSize: "18px" }}>{CATEGORY_ICONS[g.category] || "🛠️"}</span>
                  )}
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1rem",
                    fontWeight: "700", color: CATEGORY_COLORS[g.category] || G }}>
                    {g.category}
                  </div>
                  <div style={{ flex: 1, height: "1px", background: BORDER }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {g.items.map(renderProductCard)}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: "2rem", background: BG2,
          border: "1px solid rgba(37,211,102,0.2)", borderRadius: "16px",
          padding: "1.25rem", textAlign: "center" }}>
          <div style={{ fontSize: "13px", color: "#b8a09a", marginBottom: "10px" }}>
            Not sure which service you need?
          </div>
          <button onClick={() => window.open(CONTACT.whatsappLink, "_blank")} style={{
            background: "#25D366", color: "#fff", border: "none",
            borderRadius: "10px", padding: "12px 24px", fontSize: "14px",
            fontWeight: "700", cursor: "pointer",
          }}>
            💬 Chat With Us on WhatsApp
          </button>
        </div>
      </div>

      {selectedProduct && (
        <CheckoutModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}

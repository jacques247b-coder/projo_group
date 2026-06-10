// ============================================================
// PROJO GROUP — Shop Page (Built-in)
// All services bookable directly in the app
// Gold on Amber Red theme
// ============================================================
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { CONTACT } from "../../utils/constants";
import toast from "react-hot-toast";
import Navbar from "../../components/ui/Navbar";

const G = "#e8b84b";
const BG = "#0d0505";
const BG2 = "#120808";
const BG3 = "#1c0f0f";
const BORDER = "rgba(232,184,75,0.18)";

const CATEGORY_ICONS = {
  "Cleaning": "🧹",
  "Maintenance": "🔧",
  "Painting": "🎨",
  "Pest Control": "🐛",
  "Web & App Development": "💻",
  "Runners & Deliveries": "📦",
};

const CATEGORY_COLORS = {
  "Cleaning": "#4ade80",
  "Maintenance": "#60a5fa",
  "Painting": "#f472b6",
  "Pest Control": "#a78bfa",
  "Web & App Development": "#34d399",
  "Runners & Deliveries": "#e8b84b",
};

// Booking modal
function BookingModal({ product, onClose }) {
  const { user } = useAuth();
  const [date, setDate] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!address) return toast.error("Please enter your address");
    setSubmitting(true);
    try {
      // Send booking via WhatsApp
      const msg = encodeURIComponent(
        `*PROJO GROUP Booking Request*\n\n` +
        `*Service:* ${product.name}\n` +
        `*Category:* ${product.category}\n` +
        `*Price:* ${product.priceZar > 0 ? `R${product.priceZar}` : "Quote required"}\n` +
        `*Date/Time:* ${date || "To be confirmed"}\n` +
        `*Address:* ${address}\n` +
        `*Phone:* ${phone}\n` +
        `*Notes:* ${notes || "None"}\n\n` +
        `Please confirm my booking. Thank you!`
      );
      window.open(`https://wa.me/${CONTACT.whatsapp}?text=${msg}`, "_blank");
      toast.success("Opening WhatsApp to confirm your booking!");
      onClose();
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false); }
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
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", marginBottom: "1.25rem" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: G,
              letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>
              {CATEGORY_ICONS[product.category]} {product.category}
            </div>
            <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.2rem",
              fontWeight: "800", color: "#f5ede8", margin: 0 }}>{product.name}</h3>
            {product.priceZar > 0 && (
              <div style={{ fontSize: "1.4rem", fontWeight: "800", color: G,
                fontFamily: "'Syne',sans-serif", marginTop: "4px" }}>
                R{product.priceZar}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{
            background: BG3, border: `1px solid ${BORDER}`, borderRadius: "50%",
            width: "32px", height: "32px", cursor: "pointer", color: "#7a5a55",
            fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        {/* Description */}
        <div style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: "12px",
          padding: "1rem", marginBottom: "1.25rem", fontSize: "13px",
          color: "#b8a09a", lineHeight: 1.7 }}>
          {product.description}
        </div>

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
            <label style={lbl}>📞 Phone Number</label>
            <input value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+27 83 123 4567" type="tel" style={inp} />
          </div>
          <div>
            <label style={lbl}>📝 Special Instructions (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Any specific requirements or notes..."
              rows={3} style={{ ...inp, resize: "vertical" }} />
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "10px", marginTop: "1.25rem" }}>
          <button onClick={handleSubmit} disabled={submitting} style={{
            flex: 1, background: "#25D366", color: "#fff", border: "none",
            borderRadius: "12px", padding: "14px", fontSize: "14px",
            fontWeight: "800", cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
          }}>
            💬 {submitting ? "Opening WhatsApp..." : "Book via WhatsApp"}
          </button>
          <button onClick={onClose} style={{
            background: BG3, color: "#7a5a55", border: `1px solid ${BORDER}`,
            borderRadius: "12px", padding: "14px 20px", fontSize: "14px",
            cursor: "pointer",
          }}>Cancel</button>
        </div>

        <div style={{ textAlign: "center", marginTop: "10px",
          fontSize: "11px", color: "#7a5a55" }}>
          Booking confirmation sent via WhatsApp · Payment on arrival or via EFT
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

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

  const categories = ["All", ...Object.keys(CATEGORY_ICONS)];

  const filtered = products.filter(p => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch && p.isActive;
  });

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'DM Sans',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "84px 1rem 2rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: G,
            letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>
            PROJO GROUP Services
          </div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.8rem",
            fontWeight: "800", color: "#f5ede8", marginBottom: "4px" }}>
            Book a Service
          </h1>
          <p style={{ fontSize: "13px", color: "#7a5a55" }}>
            Rustenburg's own · All services confirmed via WhatsApp
          </p>
        </div>

        {/* Search */}
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

        {/* Category tabs */}
        <div style={{ display: "flex", gap: "6px", overflowX: "auto",
          paddingBottom: "4px", marginBottom: "1.25rem",
          scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              background: activeCategory === cat ? G : BG2,
              color: activeCategory === cat ? "#1a0808" : "#b8a09a",
              border: `1px solid ${activeCategory === cat ? G : BORDER}`,
              borderRadius: "50px", padding: "7px 14px", fontSize: "12px",
              fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap",
              flexShrink: 0, fontFamily: "'DM Sans',sans-serif",
            }}>
              {cat === "All" ? "All Services" : `${CATEGORY_ICONS[cat]} ${cat}`}
            </button>
          ))}
        </div>

        {/* Products */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#7a5a55" }}>
            Loading services...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#7a5a55" }}>
            No services found
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filtered.map(product => (
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
                    {/* Category badge */}
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "4px",
                      background: `${CATEGORY_COLORS[product.category]}15`,
                      border: `1px solid ${CATEGORY_COLORS[product.category]}30`,
                      borderRadius: "50px", padding: "3px 10px",
                      marginBottom: "8px" }}>
                      <span style={{ fontSize: "12px" }}>{CATEGORY_ICONS[product.category]}</span>
                      <span style={{ fontSize: "10px", fontWeight: "700",
                        color: CATEGORY_COLORS[product.category],
                        letterSpacing: "0.5px" }}>{product.category}</span>
                    </div>

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
            ))}
          </div>
        )}

        {/* WhatsApp CTA */}
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

      {/* Booking Modal */}
      {selectedProduct && (
        <BookingModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}

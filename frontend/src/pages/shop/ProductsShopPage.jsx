// PROJO GROUP — Products Shop Page
// Separate from Services (/shop) — shows only "Products" category
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";
import Navbar from "../../components/ui/Navbar";

const G = "#e8b84b";
const BG = "#0d0505";
const BG2 = "#120808";
const BG3 = "#1c0f0f";
const BORDER = "rgba(232,184,75,0.18)";

export default function ProductsShopPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/shop/products`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("projo_token")}` } }
      );
      const data = await res.json();
      // Only show "Products" category
      const products = (data.products || []).filter(p => p.category === "Products" && p.isActive);
      setProducts(products);
    } catch {
      toast.error("Could not load products");
    } finally {
      setLoading(false);
    }
  }

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'DM Sans',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "84px 1rem 2rem" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: G,
              letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>
              PROJO GROUP
            </div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.8rem",
              fontWeight: "800", color: "#f5ede8", marginBottom: "4px" }}>
              Products Shop
            </h1>
            <p style={{ fontSize: "13px", color: "#7a5a55" }}>
              Browse & order products
            </p>
          </div>
          <button onClick={() => navigate("/shop")} style={{
            background: "rgba(232,184,75,0.1)", border: `1px solid ${G}`,
            borderRadius: "10px", padding: "8px 14px", cursor: "pointer",
            color: G, fontSize: "12px", fontWeight: "700",
            fontFamily: "'DM Sans',sans-serif",
          }}>🛠️ Services</button>
        </div>

        <div style={{ position: "relative", marginBottom: "1.25rem" }}>
          <span style={{ position: "absolute", left: "12px", top: "50%",
            transform: "translateY(-50%)", fontSize: "16px" }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            style={{ width: "100%", background: BG2, border: `1px solid ${BORDER}`,
              color: "#f5ede8", borderRadius: "10px", padding: "11px 14px 11px 40px",
              fontSize: "14px", fontFamily: "'DM Sans',sans-serif", outline: "none",
              boxSizing: "border-box" }} />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#7a5a55" }}>Loading products...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#7a5a55" }}>
            <div style={{ fontSize: "48px", marginBottom: "1rem" }}>🛍️</div>
            <div style={{ fontSize: "16px", fontWeight: "700", color: "#f5ede8", marginBottom: "8px" }}>
              Coming Soon
            </div>
            <div style={{ fontSize: "13px" }}>Products will be added here soon.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filtered.map(product => (
              <div key={product.id} style={{
                background: BG2, border: `1px solid ${BORDER}`,
                borderRadius: "16px", padding: "1.25rem",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between",
                  alignItems: "flex-start", gap: "12px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1rem",
                      fontWeight: "700", color: "#f5ede8", marginBottom: "6px" }}>
                      {product.name}
                    </div>
                    <div style={{ fontSize: "12px", color: "#b8a09a", lineHeight: 1.6 }}>
                      {product.description}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.2rem",
                      fontWeight: "800", color: G, marginBottom: "8px" }}>
                      {product.priceZar > 0 ? `R${product.priceZar}` : "Get Quote"}
                    </div>
                    <button style={{
                      background: G, color: "#1a0808", border: "none",
                      borderRadius: "8px", padding: "8px 16px", fontSize: "12px",
                      fontWeight: "800", cursor: "pointer",
                    }}>Order Now</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: "2rem", background: BG2,
          border: "1px solid rgba(37,211,102,0.2)", borderRadius: "16px",
          padding: "1.25rem", textAlign: "center" }}>
          <div style={{ fontSize: "13px", color: "#b8a09a", marginBottom: "10px" }}>
            Looking for a service instead?
          </div>
          <button onClick={() => navigate("/shop")} style={{
            background: G, color: "#1a0808", border: "none",
            borderRadius: "10px", padding: "12px 24px", fontSize: "14px",
            fontWeight: "700", cursor: "pointer",
          }}>
            🛠️ Book a Service
          </button>
        </div>
      </div>
    </div>
  );
}

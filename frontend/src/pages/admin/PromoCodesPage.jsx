// PROJO GROUP — Admin Promo Codes Management
import React, { useState, useEffect } from "react";
import Navbar from "../../components/ui/Navbar";
import api from "../../services/api";
import toast from "react-hot-toast";

const G = "#e8b84b";
const BG = "#0a0a0a";
const BG2 = "#111111";
const BG3 = "#1a1a1a";
const BORDER = "rgba(232,184,75,0.15)";

function CodeModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    code: "", description: "", discountType: "PERCENTAGE", discountValue: "",
    minOrderAmount: "", maxDiscount: "", maxUses: "", expiresAt: "", oneTimePerUser: true,
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.code || !form.discountValue) return toast.error("Code and discount value required");
    setSaving(true);
    try {
      await api.post("/admin/promo-codes", form);
      toast.success("Promo code created");
      onSaved(); onClose();
    } catch (err) {
      toast.error(err?.error || "Failed to create code");
    } finally { setSaving(false); }
  }

  const inp = { width: "100%", background: BG3, border: `1px solid ${BORDER}`, borderRadius: "10px",
    color: "#f0ede8", padding: "11px 14px", fontSize: "14px", outline: "none",
    fontFamily: "'DM Sans',sans-serif", boxSizing: "border-box", marginTop: "6px" };
  const lbl = { fontSize: "11px", fontWeight: "700", color: "#6b6760", letterSpacing: "0.8px",
    textTransform: "uppercase", display: "block", marginTop: "12px" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.8)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "16px",
        padding: "1.5rem", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ fontFamily: "'Syne',sans-serif", color: "#f0ede8", fontSize: "1.1rem" }}>New Promo Code</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6b6760", cursor: "pointer", fontSize: "20px" }}>✕</button>
        </div>

        <label style={lbl}>Code *</label>
        <input style={{ ...inp, textTransform: "uppercase" }} placeholder="e.g. PROJO10"
          value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />

        <label style={lbl}>Description</label>
        <input style={inp} placeholder="e.g. 10% off your first ride"
          value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />

        <label style={lbl}>Discount Type *</label>
        <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
          {["PERCENTAGE", "FIXED"].map(t => (
            <button key={t} onClick={() => setForm(f => ({ ...f, discountType: t }))} style={{
              flex: 1, padding: "10px", borderRadius: "8px", cursor: "pointer",
              border: `1px solid ${form.discountType === t ? G : BORDER}`,
              background: form.discountType === t ? "rgba(232,184,75,0.1)" : BG3,
              color: form.discountType === t ? G : "#a8a49e", fontWeight: "700", fontSize: "13px" }}>
              {t === "PERCENTAGE" ? "% Percentage" : "R Fixed Amount"}
            </button>
          ))}
        </div>

        <label style={lbl}>Discount Value * {form.discountType === "PERCENTAGE" ? "(%)" : "(R)"}</label>
        <input style={inp} type="number" placeholder={form.discountType === "PERCENTAGE" ? "10" : "50"}
          value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))} />

        {form.discountType === "PERCENTAGE" && (
          <>
            <label style={lbl}>Max Discount Cap (R) — optional</label>
            <input style={inp} type="number" placeholder="e.g. 100"
              value={form.maxDiscount} onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value }))} />
          </>
        )}

        <label style={lbl}>Minimum Order Amount (R) — optional</label>
        <input style={inp} type="number" placeholder="e.g. 100"
          value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))} />

        <label style={lbl}>Max Total Uses — optional</label>
        <input style={inp} type="number" placeholder="Leave blank for unlimited"
          value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} />

        <label style={lbl}>Expiry Date — optional</label>
        <input style={inp} type="date"
          value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "14px", cursor: "pointer" }}
          onClick={() => setForm(f => ({ ...f, oneTimePerUser: !f.oneTimePerUser }))}>
          <div style={{ width: "44px", height: "24px", borderRadius: "12px",
            background: form.oneTimePerUser ? G : BG3, border: `1px solid ${BORDER}`, position: "relative" }}>
            <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#0a0a0a",
              position: "absolute", top: "3px", left: form.oneTimePerUser ? "23px" : "3px", transition: "left .2s" }} />
          </div>
          <span style={{ fontSize: "13px", color: form.oneTimePerUser ? G : "#6b6760" }}>One use per customer</span>
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "1.25rem" }}>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, background: G, color: "#0a0a0a",
            border: "none", borderRadius: "10px", padding: "13px", fontSize: "14px", fontWeight: "700",
            cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Creating..." : "Create Code"}
          </button>
          <button onClick={onClose} style={{ background: BG3, color: "#6b6760", border: `1px solid ${BORDER}`,
            borderRadius: "10px", padding: "13px 20px", cursor: "pointer" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function PromoCodesPage() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/admin/promo-codes");
      setCodes(res.codes || []);
    } catch { toast.error("Could not load promo codes"); }
    finally { setLoading(false); }
  }

  async function toggleActive(id, isActive) {
    try {
      await api.put(`/admin/promo-codes/${id}`, { isActive: !isActive });
      toast.success(isActive ? "Code deactivated" : "Code activated");
      load();
    } catch { toast.error("Could not update code"); }
  }

  async function deleteCode(id) {
    if (!window.confirm("Delete this promo code?")) return;
    try {
      await api.delete(`/admin/promo-codes/${id}`);
      toast.success("Code deleted");
      load();
    } catch { toast.error("Could not delete code"); }
  }

  const card = { background: BG2, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "1.25rem" };

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'DM Sans',sans-serif", paddingTop: "64px" }}>
      <Navbar />
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "1.5rem 1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: G, letterSpacing: "2px",
              textTransform: "uppercase", marginBottom: "4px" }}>PROJO GROUP</div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.5rem", fontWeight: "800",
              color: "#f0ede8", margin: 0 }}>Promo Codes</h1>
          </div>
          <button onClick={() => setShowModal(true)} style={{ background: G, color: "#0a0a0a",
            border: "none", borderRadius: "10px", padding: "10px 20px", fontWeight: "700", cursor: "pointer" }}>
            + New Code
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "#6b6760", padding: "3rem" }}>Loading...</div>
        ) : codes.length === 0 ? (
          <div style={{ textAlign: "center", color: "#6b6760", padding: "3rem" }}>
            <div style={{ fontSize: "40px", marginBottom: "1rem" }}>🏷️</div>No promo codes yet
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {codes.map(c => (
              <div key={c.id} style={{ ...card, opacity: c.isActive ? 1 : 0.5,
                display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontFamily: "monospace", fontSize: "16px", fontWeight: "800", color: G }}>{c.code}</span>
                    {!c.isActive && <span style={{ fontSize: "10px", color: "#f59e0b", background: "rgba(245,158,11,0.1)",
                      border: "1px solid rgba(245,158,11,0.3)", borderRadius: "4px", padding: "2px 6px" }}>INACTIVE</span>}
                  </div>
                  <div style={{ fontSize: "12px", color: "#a8a49e", marginBottom: "4px" }}>{c.description}</div>
                  <div style={{ fontSize: "11px", color: "#6b6760" }}>
                    {c.discountType === "PERCENTAGE" ? `${c.discountValue}% off` : `R${c.discountValue} off`}
                    {c.minOrderAmount && ` · Min R${c.minOrderAmount}`}
                    {" · "}Used {c.usedCount}{c.maxUses ? `/${c.maxUses}` : ""} times
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => toggleActive(c.id, c.isActive)} style={{
                    background: c.isActive ? "rgba(245,158,11,0.1)" : "rgba(74,222,128,0.1)",
                    color: c.isActive ? "#f59e0b" : "#4ade80",
                    border: `1px solid ${c.isActive ? "rgba(245,158,11,0.3)" : "rgba(74,222,128,0.3)"}`,
                    borderRadius: "8px", padding: "6px 12px", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>
                    {c.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={() => deleteCode(c.id)} style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444",
                    border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showModal && <CodeModal onClose={() => setShowModal(false)} onSaved={load} />}
    </div>
  );
}

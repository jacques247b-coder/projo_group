// PROJO GROUP — Admin: Manage Configurable Options Per Product
// e.g. Painting -> "Property Size" group -> "1 Bed +R0", "2 Bed +R150", "3 Bed +R300"
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/ui/Navbar";
import api from "../../services/api";
import toast from "react-hot-toast";

const G = "#e8b84b";
const BG = "#0a0a0a";
const BG2 = "#111111";
const BG3 = "#1a1a1a";
const BORDER = "rgba(232,184,75,0.15)";

export default function ProductOptionsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupType, setNewGroupType] = useState("SINGLE");
  const [newGroupRequired, setNewGroupRequired] = useState(false);

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await api.get("/admin/products");
      setProducts(res.products || []);
    } catch { toast.error("Could not load products"); }
    finally { setLoading(false); }
  }

  async function selectProduct(product) {
    setSelectedProduct(product);
    try {
      const res = await api.get(`/admin/products/${product.id}/options`);
      setGroups(res.groups || []);
    } catch { toast.error("Could not load options"); }
  }

  async function addGroup() {
    if (!newGroupName.trim()) return toast.error("Group name required");
    try {
      await api.post(`/admin/products/${selectedProduct.id}/option-groups`, {
        name: newGroupName, type: newGroupType, required: newGroupRequired,
        sortOrder: groups.length,
      });
      setNewGroupName("");
      setNewGroupRequired(false);
      toast.success("Option group added");
      selectProduct(selectedProduct);
    } catch { toast.error("Could not add group"); }
  }

  async function deleteGroup(id) {
    if (!window.confirm("Delete this option group and all its choices?")) return;
    try {
      await api.delete(`/admin/option-groups/${id}`);
      toast.success("Group deleted");
      selectProduct(selectedProduct);
    } catch { toast.error("Could not delete group"); }
  }

  async function addChoice(groupId, label, priceModifier) {
    if (!label.trim()) return toast.error("Choice label required");
    try {
      await api.post(`/admin/option-groups/${groupId}/choices`, {
        label, priceModifier: parseFloat(priceModifier) || 0,
      });
      toast.success("Choice added");
      selectProduct(selectedProduct);
    } catch { toast.error("Could not add choice"); }
  }

  async function deleteChoice(id) {
    try {
      await api.delete(`/admin/choices/${id}`);
      toast.success("Choice deleted");
      selectProduct(selectedProduct);
    } catch { toast.error("Could not delete choice"); }
  }

  const inp = { width: "100%", background: BG3, border: `1px solid ${BORDER}`, borderRadius: "8px",
    color: "#f0ede8", padding: "8px 12px", fontSize: "13px", outline: "none",
    fontFamily: "'DM Sans',sans-serif", boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'DM Sans',sans-serif", paddingTop: "64px" }}>
      <Navbar />
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "1.5rem 1rem" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: G, letterSpacing: "2px",
            textTransform: "uppercase", marginBottom: "4px" }}>PROJO GROUP</div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.5rem", fontWeight: "800",
            color: "#f0ede8", margin: 0 }}>Service Options & Pricing</h1>
          <p style={{ fontSize: "12px", color: "#6b6760", marginTop: "4px" }}>
            Add configurable choices (size, urgency, add-ons) that change the price at checkout
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "1.5rem" }}>

          {/* Product list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {loading ? (
              <div style={{ color: "#6b6760", fontSize: "13px" }}>Loading...</div>
            ) : products.map(p => (
              <div key={p.id} onClick={() => selectProduct(p)} style={{
                background: selectedProduct?.id === p.id ? "rgba(232,184,75,0.1)" : BG2,
                border: `1px solid ${selectedProduct?.id === p.id ? G : BORDER}`,
                borderRadius: "10px", padding: "10px 12px", cursor: "pointer",
              }}>
                <div style={{ fontSize: "13px", fontWeight: "600",
                  color: selectedProduct?.id === p.id ? G : "#f0ede8" }}>{p.name}</div>
                <div style={{ fontSize: "11px", color: "#6b6760", marginTop: "2px" }}>
                  {p.category} · R{p.priceZar}
                </div>
              </div>
            ))}
          </div>

          {/* Options editor */}
          <div>
            {!selectedProduct ? (
              <div style={{ textAlign: "center", color: "#6b6760", padding: "3rem" }}>
                ← Select a service to manage its options
              </div>
            ) : (
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.1rem",
                  fontWeight: "700", color: "#f0ede8", marginBottom: "1rem" }}>
                  {selectedProduct.name} <span style={{ color: G, fontSize: "14px" }}>(Base: R{selectedProduct.priceZar})</span>
                </div>

                {/* Existing groups */}
                {groups.map(group => (
                  <div key={group.id} style={{ background: BG2, border: `1px solid ${BORDER}`,
                    borderRadius: "14px", padding: "1rem", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between",
                      alignItems: "center", marginBottom: "10px" }}>
                      <div>
                        <span style={{ fontWeight: "700", color: "#f0ede8", fontSize: "14px" }}>{group.name}</span>
                        <span style={{ fontSize: "11px", color: "#6b6760", marginLeft: "8px" }}>
                          {group.type === "MULTI" ? "Multi-select" : "Single choice"}
                          {group.required && " · Required"}
                        </span>
                      </div>
                      <button onClick={() => deleteGroup(group.id)} style={{
                        background: "rgba(239,68,68,0.1)", color: "#ef4444",
                        border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px",
                        padding: "4px 10px", fontSize: "11px", cursor: "pointer",
                      }}>Delete Group</button>
                    </div>

                    {/* Choices */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
                      {group.choices.map(choice => (
                        <div key={choice.id} style={{ display: "flex", justifyContent: "space-between",
                          alignItems: "center", background: BG3, borderRadius: "8px", padding: "6px 10px" }}>
                          <span style={{ fontSize: "13px", color: "#f0ede8" }}>{choice.label}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "12px", color: choice.priceModifier >= 0 ? G : "#f87171", fontWeight: "700" }}>
                              {choice.priceModifier >= 0 ? "+" : ""}R{choice.priceModifier}
                            </span>
                            <button onClick={() => deleteChoice(choice.id)} style={{
                              background: "none", border: "none", color: "#6b6760",
                              cursor: "pointer", fontSize: "14px" }}>✕</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add choice inline */}
                    <AddChoiceForm groupId={group.id} onAdd={addChoice} />
                  </div>
                ))}

                {/* Add new group */}
                <div style={{ background: BG2, border: `1px dashed ${BORDER}`,
                  borderRadius: "14px", padding: "1rem" }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: G,
                    marginBottom: "10px", textTransform: "uppercase" }}>+ New Option Group</div>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                    <input style={{ ...inp, flex: 1, minWidth: "150px" }} placeholder="e.g. Property Size"
                      value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
                    <select style={{ ...inp, width: "auto" }} value={newGroupType}
                      onChange={e => setNewGroupType(e.target.value)}>
                      <option value="SINGLE">Single choice</option>
                      <option value="MULTI">Multi-select</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                    <input type="checkbox" checked={newGroupRequired}
                      onChange={e => setNewGroupRequired(e.target.checked)} />
                    <span style={{ fontSize: "12px", color: "#a8a49e" }}>Required (customer must choose)</span>
                  </div>
                  <button onClick={addGroup} style={{
                    background: G, color: "#0a0a0a", border: "none", borderRadius: "8px",
                    padding: "8px 18px", fontSize: "13px", fontWeight: "700", cursor: "pointer",
                  }}>Add Group</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AddChoiceForm({ groupId, onAdd }) {
  const [label, setLabel] = useState("");
  const [price, setPrice] = useState("");

  const inp = { background: BG3, border: `1px solid ${BORDER}`, borderRadius: "6px",
    color: "#f0ede8", padding: "6px 10px", fontSize: "12px", outline: "none",
    fontFamily: "'DM Sans',sans-serif" };

  function submit() {
    onAdd(groupId, label, price);
    setLabel(""); setPrice("");
  }

  return (
    <div style={{ display: "flex", gap: "6px" }}>
      <input style={{ ...inp, flex: 1 }} placeholder="Choice label e.g. 2 Bedroom"
        value={label} onChange={e => setLabel(e.target.value)} />
      <input style={{ ...inp, width: "90px" }} placeholder="+R0" type="number"
        value={price} onChange={e => setPrice(e.target.value)} />
      <button onClick={submit} style={{
        background: "rgba(232,184,75,0.1)", color: G, border: `1px solid ${BORDER}`,
        borderRadius: "6px", padding: "6px 14px", fontSize: "12px",
        fontWeight: "700", cursor: "pointer",
      }}>Add</button>
    </div>
  );
}

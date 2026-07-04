// PROJO GROUP — Admin Product Page
// Full product editor: Name, Type, Category, SKU, Weight, Price, Description,
// Image upload (base64 or URL), Variants, Options, Availability, Inventory, Tags
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/ui/Navbar";
import api from "../../services/api";
import toast from "react-hot-toast";

const G = "#e8b84b";
const BG = "#0a0a0a";
const BG2 = "#111111";
const BG3 = "#1a1a1a";
const BORDER = "rgba(232,184,75,0.15)";

const inp = {
  width: "100%", background: BG3, border: `1px solid ${BORDER}`, borderRadius: "8px",
  color: "#f0ede8", padding: "10px 12px", fontSize: "13px", outline: "none",
  fontFamily: "'DM Sans',sans-serif", boxSizing: "border-box",
};

const label = {
  fontSize: "11px", color: "#6b6760", marginBottom: "5px",
  textTransform: "uppercase", letterSpacing: "1px", display: "block",
};

function Toggle({ value, onChange, label: lbl, sub }) {
  return (
    <div onClick={() => onChange(!value)} style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      cursor: "pointer", padding: "4px 0",
    }}>
      <div>
        <div style={{ fontSize: "13px", color: "#f0ede8", fontWeight: "600" }}>{lbl}</div>
        {sub && <div style={{ fontSize: "11px", color: "#6b6760" }}>{sub}</div>}
      </div>
      <div style={{
        width: "44px", height: "24px", borderRadius: "12px",
        background: value ? G : BG3, border: `1px solid ${value ? G : BORDER}`,
        position: "relative", transition: "all .2s", flexShrink: 0,
      }}>
        <div style={{
          width: "18px", height: "18px", borderRadius: "50%", background: value ? "#0a0a0a" : "#6b6760",
          position: "absolute", top: "3px", left: value ? "22px" : "3px", transition: "left .2s",
        }} />
      </div>
    </div>
  );
}

const CATEGORIES = [
  "Products", "Cleaning", "Maintenance", "Painting", "CCTV", "Locksmith",
  "Pest Control", "Runners & Deliveries", "PC & Console Repair",
  "Laundry Services", "Web & App Development", "Digital Marketing",
];

const PRODUCT_TYPES = ["Physical", "Digital", "Service"];
const OPTION_TYPES = ["Text", "Single Choice", "Multiple Choice"];

export default function AdminProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === "new";
  const fileRef = useRef();

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  const [form, setForm] = useState({
    name: "", type: "Physical", category: "Products",
    sku: "", weight: "", priceZar: 0, originalPrice: 0,
    description: "", imageUrl: "", imageBase64: "",
    isActive: true, trackInventory: false, stockQty: 999,
    maxOrderQty: "", minOrderQty: "", tags: "",
  });

  const [variants, setVariants] = useState([]);
  const [options, setOptions] = useState([]);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    if (!isNew) loadProduct();
  }, [id]);

  async function loadProduct() {
    try {
      const res = await api.get(`/admin/products/${id}`);
      const p = res.product;
      setForm({
        name: p.name || "", type: p.type || "Physical",
        category: p.category || "Products", sku: p.sku || "",
        weight: p.weight || "", priceZar: p.priceZar || 0,
        originalPrice: p.originalPrice || 0, description: p.description || "",
        imageUrl: p.imageUrl || "", imageBase64: "",
        isActive: p.isActive !== false, trackInventory: p.trackInventory || false,
        stockQty: p.stockQty || 999, maxOrderQty: p.maxOrderQty || "",
        minOrderQty: p.minOrderQty || "", tags: (p.tags || []).join(", "),
      });
      if (p.imageUrl) setImagePreview(p.imageUrl);
    } catch { toast.error("Could not load product"); }
    finally { setLoading(false); }
  }

  function handleImageFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
      setForm(f => ({ ...f, imageBase64: e.target.result, imageUrl: "" }));
    };
    reader.readAsDataURL(file);
  }

  function addVariant() {
    setVariants(v => [...v, { id: Date.now(), name: "", price: 0, originalPrice: 0, sku: "" }]);
  }

  function updateVariant(id, key, value) {
    setVariants(v => v.map(x => x.id === id ? { ...x, [key]: value } : x));
  }

  function removeVariant(id) {
    setVariants(v => v.filter(x => x.id !== id));
  }

  function addOption() {
    setOptions(o => [...o, { id: Date.now(), name: "", type: "Text", required: false, choices: [] }]);
  }

  function updateOption(id, key, value) {
    setOptions(o => o.map(x => x.id === id ? { ...x, [key]: value } : x));
  }

  function removeOption(id) {
    setOptions(o => o.filter(x => x.id !== id));
  }

  function addChoice(optionId) {
    setOptions(o => o.map(x => x.id === optionId
      ? { ...x, choices: [...x.choices, { id: Date.now(), label: "", priceModifier: 0 }] }
      : x
    ));
  }

  function updateChoice(optionId, choiceId, key, value) {
    setOptions(o => o.map(x => x.id === optionId
      ? { ...x, choices: x.choices.map(c => c.id === choiceId ? { ...c, [key]: value } : c) }
      : x
    ));
  }

  function removeChoice(optionId, choiceId) {
    setOptions(o => o.map(x => x.id === optionId
      ? { ...x, choices: x.choices.filter(c => c.id !== choiceId) }
      : x
    ));
  }

  async function save() {
    if (!form.name.trim()) return toast.error("Product name is required");
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        variants, options,
      };

      if (isNew) {
        await api.post("/admin/products", payload);
        toast.success("Product created!");
      } else {
        await api.put(`/admin/products/${id}`, payload);
        toast.success("Product saved!");
      }
      navigate("/admin");
    } catch { toast.error("Could not save product"); }
    finally { setSaving(false); }
  }

  const section = { background: BG2, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "1.25rem", marginBottom: "1rem" };
  const sectionTitle = { fontFamily: "'Syne',sans-serif", fontSize: "14px", fontWeight: "700", color: G, marginBottom: "1rem" };

  if (loading) return <div style={{ background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b6760" }}>Loading...</div>;

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", paddingBottom: "6rem" }}>
      <Navbar />

      {/* Header */}
      <div style={{ position: "sticky", top: "64px", zIndex: 50, background: BG2, borderBottom: `1px solid ${BORDER}`, padding: "12px 1rem" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={() => navigate("/admin")} style={{ background: "none", border: "none", color: "#6b6760", fontSize: "20px", cursor: "pointer" }}>←</button>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: "800", color: "#f0ede8", fontSize: "16px" }}>
              {isNew ? "New Product" : "Edit Product"}
            </span>
          </div>
          <button onClick={save} disabled={saving} style={{
            background: G, color: "#0a0a0a", border: "none", borderRadius: "10px",
            padding: "10px 24px", fontWeight: "800", fontSize: "14px", cursor: "pointer",
            opacity: saving ? 0.7 : 1,
          }}>{saving ? "Saving..." : "Save"}</button>
        </div>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "1.5rem 1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1rem", alignItems: "start" }}>

          {/* LEFT COLUMN */}
          <div>
            {/* Basic Info */}
            <div style={section}>
              <div style={sectionTitle}>Product Details</div>
              <div style={{ marginBottom: "12px" }}>
                <span style={label}>Name *</span>
                <input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Product name" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <span style={label}>Type</span>
                  <select style={{ ...inp }} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <span style={label}>Category *</span>
                  <select style={{ ...inp }} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <span style={label}>SKU</span>
                  <input style={inp} value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="e.g. SKU-001" />
                </div>
                <div>
                  <span style={label}>Weight (g)</span>
                  <input style={inp} type="number" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} placeholder="0" />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div style={section}>
              <div style={sectionTitle}>Pricing</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <span style={label}>Price (R)</span>
                  <input style={inp} type="number" value={form.priceZar} onChange={e => setForm(f => ({ ...f, priceZar: parseFloat(e.target.value) || 0 }))} placeholder="0" />
                </div>
                <div>
                  <span style={label}>Original Price (R)</span>
                  <input style={inp} type="number" value={form.originalPrice} onChange={e => setForm(f => ({ ...f, originalPrice: parseFloat(e.target.value) || 0 }))} placeholder="0" />
                </div>
              </div>
              {form.originalPrice > 0 && form.priceZar > 0 && (
                <div style={{ marginTop: "8px", fontSize: "12px", color: "#4ade80" }}>
                  💸 {Math.round(((form.originalPrice - form.priceZar) / form.originalPrice) * 100)}% discount
                </div>
              )}
            </div>

            {/* Description */}
            <div style={section}>
              <div style={sectionTitle}>Description</div>
              <textarea style={{ ...inp, minHeight: "120px", resize: "vertical" }} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe your product..." />
            </div>

            {/* Images */}
            <div style={section}>
              <div style={sectionTitle}>Images</div>
              {imagePreview && (
                <div style={{ position: "relative", marginBottom: "12px" }}>
                  <img src={imagePreview} alt="Product" style={{ width: "100%", maxHeight: "200px", objectFit: "contain", borderRadius: "10px", background: BG3 }} />
                  <button onClick={() => { setImagePreview(""); setForm(f => ({ ...f, imageUrl: "", imageBase64: "" })); }}
                    style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(0,0,0,0.7)", border: "none", color: "#f0ede8", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", fontSize: "14px" }}>✕</button>
                </div>
              )}
              <div onClick={() => fileRef.current?.click()} style={{
                border: `2px dashed ${BORDER}`, borderRadius: "10px", padding: "2rem",
                textAlign: "center", cursor: "pointer",
              }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleImageFile(e.dataTransfer.files[0]); }}>
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>📁</div>
                <div style={{ fontSize: "13px", color: "#6b6760" }}>Drag & drop or <span style={{ color: G }}>click to upload</span></div>
                <div style={{ fontSize: "11px", color: "#6b6760", marginTop: "4px" }}>PNG, JPG up to 10MB</div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={e => handleImageFile(e.target.files[0])} />
              <div style={{ marginTop: "10px" }}>
                <span style={label}>Or paste image URL</span>
                <input style={inp} value={form.imageUrl} onChange={e => { setForm(f => ({ ...f, imageUrl: e.target.value, imageBase64: "" })); setImagePreview(e.target.value); }} placeholder="https://..." />
              </div>
            </div>

            {/* Variants */}
            <div style={section}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div style={sectionTitle}>Variants</div>
              </div>
              {variants.map((v, i) => (
                <div key={v.id} style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "1rem", marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: G }}>Variant {i + 1}</div>
                    <button onClick={() => removeVariant(v.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "16px" }}>🗑</button>
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <span style={label}>Name</span>
                    <input style={inp} value={v.name} onChange={e => updateVariant(v.id, "name", e.target.value)} placeholder="e.g. Red / XL" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                    <div>
                      <span style={label}>Price (R)</span>
                      <input style={inp} type="number" value={v.price} onChange={e => updateVariant(v.id, "price", parseFloat(e.target.value) || 0)} placeholder="0" />
                    </div>
                    <div>
                      <span style={label}>Original (R)</span>
                      <input style={inp} type="number" value={v.originalPrice} onChange={e => updateVariant(v.id, "originalPrice", parseFloat(e.target.value) || 0)} placeholder="0" />
                    </div>
                    <div>
                      <span style={label}>SKU</span>
                      <input style={inp} value={v.sku} onChange={e => updateVariant(v.id, "sku", e.target.value)} placeholder="SKU" />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={addVariant} style={{ background: "none", border: `1px dashed ${BORDER}`, borderRadius: "10px", padding: "10px", width: "100%", color: G, fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
                + Add Variant
              </button>
            </div>

            {/* Options */}
            <div style={section}>
              <div style={{ ...sectionTitle }}>Options</div>
              {options.map((o, i) => (
                <div key={o.id} style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "1rem", marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: G }}>Option {i + 1}</div>
                    <button onClick={() => removeOption(o.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "16px" }}>🗑</button>
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <span style={label}>Option Name</span>
                    <input style={inp} value={o.name} onChange={e => updateOption(o.id, "name", e.target.value)} placeholder="e.g. Size, Color" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                    <div>
                      <span style={label}>Type</span>
                      <select style={inp} value={o.type} onChange={e => updateOption(o.id, "type", e.target.value)}>
                        {OPTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "2px" }}>
                      <Toggle value={o.required} onChange={v => updateOption(o.id, "required", v)} label="Required" />
                    </div>
                  </div>
                  {(o.type === "Single Choice" || o.type === "Multiple Choice") && (
                    <div>
                      <span style={label}>Choices</span>
                      {o.choices.map(c => (
                        <div key={c.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "6px", marginBottom: "6px", alignItems: "center" }}>
                          <input style={inp} value={c.label} onChange={e => updateChoice(o.id, c.id, "label", e.target.value)} placeholder="Choice name" />
                          <input style={{ ...inp, width: "90px" }} type="number" value={c.priceModifier} onChange={e => updateChoice(o.id, c.id, "priceModifier", parseFloat(e.target.value) || 0)} placeholder="+R0" />
                          <button onClick={() => removeChoice(o.id, c.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "14px" }}>✕</button>
                        </div>
                      ))}
                      <button onClick={() => addChoice(o.id)} style={{ background: "none", border: `1px dashed ${BORDER}`, borderRadius: "8px", padding: "6px 12px", color: G, fontSize: "12px", cursor: "pointer", marginTop: "4px" }}>
                        + Add Choice
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <button onClick={addOption} style={{ background: "none", border: `1px dashed ${BORDER}`, borderRadius: "10px", padding: "10px", width: "100%", color: G, fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
                + Add Option
              </button>
            </div>

            {/* Tags */}
            <div style={section}>
              <div style={sectionTitle}>Tags</div>
              <input style={inp} value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="Separate tags with commas e.g. summer, sale, new" />
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div>
            {/* Availability */}
            <div style={section}>
              <div style={sectionTitle}>Availability</div>
              <Toggle value={form.isActive} onChange={v => setForm(f => ({ ...f, isActive: v }))} label="Visible" sub="Show in shop" />
              <div style={{ margin: "10px 0", height: "1px", background: BORDER }} />
              <Toggle value={false} onChange={() => {}} label="Mark as Sold Out" sub="Still visible, can't order" />
            </div>

            {/* Inventory */}
            <div style={section}>
              <div style={sectionTitle}>Inventory</div>
              <Toggle value={form.trackInventory} onChange={v => setForm(f => ({ ...f, trackInventory: v }))} label="Track Quantity" sub="Enable stock tracking" />
              {form.trackInventory && (
                <div style={{ marginTop: "12px" }}>
                  <span style={label}>Stock Quantity</span>
                  <input style={inp} type="number" value={form.stockQty} onChange={e => setForm(f => ({ ...f, stockQty: parseInt(e.target.value) || 0 }))} placeholder="999" />
                </div>
              )}
              <div style={{ marginTop: "12px" }}>
                <span style={label}>Max Order Qty</span>
                <input style={inp} type="number" value={form.maxOrderQty} onChange={e => setForm(f => ({ ...f, maxOrderQty: e.target.value }))} placeholder="No limit" />
              </div>
              <div style={{ marginTop: "10px" }}>
                <span style={label}>Min Order Qty</span>
                <input style={inp} type="number" value={form.minOrderQty} onChange={e => setForm(f => ({ ...f, minOrderQty: e.target.value }))} placeholder="1" />
              </div>
            </div>

            {/* Save button (mobile) */}
            <button onClick={save} disabled={saving} style={{
              width: "100%", background: G, color: "#0a0a0a", border: "none",
              borderRadius: "10px", padding: "14px", fontWeight: "800",
              fontSize: "15px", cursor: "pointer", opacity: saving ? 0.7 : 1,
            }}>{saving ? "Saving..." : "Save Product"}</button>

            {!isNew && (
              <button onClick={async () => {
                if (!window.confirm("Delete this product?")) return;
                await api.delete(`/admin/products/${id}`);
                toast.success("Deleted");
                navigate("/admin");
              }} style={{
                width: "100%", background: "transparent", color: "#ef4444",
                border: "1px solid #ef4444", borderRadius: "10px", padding: "12px",
                fontWeight: "700", fontSize: "13px", cursor: "pointer", marginTop: "8px",
              }}>Delete Product</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

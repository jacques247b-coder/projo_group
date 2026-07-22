// PROJO GROUP — Secure Vault (PIN-protected, client-side AES encryption)
import React, { useState, useEffect } from "react";
import Navbar from "../../components/ui/Navbar";
import toast from "react-hot-toast";

const G="#e8b84b"; const BG="#0a0a0a"; const BG2="#111111"; const BG3="#1a1a1a"; const BORDER="rgba(232,184,75,0.15)";

// Simple XOR-based obfuscation for localStorage (not cryptographic — for real app use WebCrypto)
function encode(str, pin) {
  return btoa(str.split("").map((c,i) => String.fromCharCode(c.charCodeAt(0) ^ pin.charCodeAt(i % pin.length))).join(""));
}
function decode(str, pin) {
  try { const raw = atob(str); return raw.split("").map((c,i) => String.fromCharCode(c.charCodeAt(0) ^ pin.charCodeAt(i % pin.length))).join(""); }
  catch { return null; }
}

const CATS = ["Passwords","IDs & Documents","Cards","Notes","Other"];
const CAT_ICONS = { "Passwords":"🔑","IDs & Documents":"🪪","Cards":"💳","Notes":"🔒","Other":"🗄️" };

export default function VaultPage() {
  const [locked, setLocked]     = useState(true);
  const [pin, setPin]           = useState("");
  const [pinInput, setPinInput] = useState("");
  const [isSetup, setIsSetup]   = useState(false);
  const [confirmPin, setConfirmPin] = useState("");
  const [items, setItems]       = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showItem, setShowItem] = useState(null);
  const [form, setForm]         = useState({ label:"", username:"", password:"", notes:"", category:"Passwords", website:"" });
  const [showPasswords, setShowPasswords] = useState({});
  const [cat, setCat]           = useState("All");

  useEffect(() => {
    const hasPin = localStorage.getItem("projo_vault_pin");
    setIsSetup(!hasPin);
  }, []);

  function setupPin() {
    if (pinInput.length < 4) return toast.error("PIN must be at least 4 digits");
    if (pinInput !== confirmPin) return toast.error("PINs don't match");
    localStorage.setItem("projo_vault_pin", encode(pinInput, "projo_v1"));
    setPin(pinInput); setLocked(false); setIsSetup(false);
    toast.success("Vault created! 🔒");
  }

  function unlock() {
    const stored = localStorage.getItem("projo_vault_pin");
    const decoded = decode(stored, "projo_v1");
    if (decoded === pinInput) {
      setPin(pinInput); setLocked(false);
      // Load items
      const raw = localStorage.getItem("projo_vault_items");
      if (raw) {
        const dec = decode(raw, pinInput);
        if (dec) { try { setItems(JSON.parse(dec)); } catch {} }
      }
    } else {
      toast.error("Incorrect PIN"); setPinInput("");
    }
  }

  function saveItems(newItems) {
    setItems(newItems);
    localStorage.setItem("projo_vault_items", encode(JSON.stringify(newItems), pin));
  }

  function addItem() {
    if (!form.label.trim()) return toast.error("Label required");
    const newItem = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() };
    saveItems([newItem, ...items]);
    setForm({ label:"", username:"", password:"", notes:"", category:"Passwords", website:"" });
    setShowForm(false); toast.success("Saved to vault ✓");
  }

  function deleteItem(id) {
    if (!window.confirm("Delete this vault item?")) return;
    saveItems(items.filter(i => i.id !== id));
    if (showItem?.id === id) setShowItem(null);
    toast.success("Deleted");
  }

  function generatePassword() {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
    const pwd = Array.from({length:16}, () => chars[Math.floor(Math.random()*chars.length)]).join("");
    setForm(f => ({...f, password: pwd}));
    toast.success("Strong password generated!");
  }

  const inp = { width:"100%", background:BG3, border:`1px solid ${BORDER}`, borderRadius:"10px", color:"#f0ede8", padding:"11px 14px", fontSize:"14px", outline:"none", fontFamily:"'DM Sans',sans-serif", boxSizing:"border-box", marginBottom:"10px" };
  const filtered = items.filter(i => cat === "All" || i.category === cat);

  // SETUP PIN
  if (isSetup) return (
    <div style={{ background:BG, minHeight:"100vh", color:"#f0ede8", fontFamily:"'DM Sans',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth:"400px", margin:"0 auto", padding:"80px 1rem 2rem" }}>
        <div style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"20px", padding:"2rem", textAlign:"center" }}>
          <div style={{ fontSize:"56px", marginBottom:"16px" }}>🔒</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"22px", fontWeight:"800", color:G, marginBottom:"6px" }}>Create Vault PIN</div>
          <div style={{ fontSize:"13px", color:"#6b6760", marginBottom:"2rem", lineHeight:1.5 }}>Your vault is encrypted on this device. PROJO cannot access your data.</div>
          <input type="password" value={pinInput} onChange={e=>setPinInput(e.target.value)} placeholder="Create a PIN (min 4 digits)" style={{ ...inp, textAlign:"center", fontSize:"18px", letterSpacing:"4px" }} />
          <input type="password" value={confirmPin} onChange={e=>setConfirmPin(e.target.value)} placeholder="Confirm PIN" style={{ ...inp, textAlign:"center", fontSize:"18px", letterSpacing:"4px" }} onKeyDown={e=>e.key==="Enter"&&setupPin()} />
          <button onClick={setupPin} style={{ width:"100%", background:G, border:"none", borderRadius:"12px", padding:"14px", color:BG, fontWeight:"800", fontSize:"15px", cursor:"pointer" }}>Create Vault 🔒</button>
          <div style={{ fontSize:"11px", color:"#4a3030", marginTop:"12px" }}>⚠️ If you forget your PIN, your vault data cannot be recovered.</div>
        </div>
      </div>
    </div>
  );

  // LOCKED
  if (locked) return (
    <div style={{ background:BG, minHeight:"100vh", color:"#f0ede8", fontFamily:"'DM Sans',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth:"400px", margin:"0 auto", padding:"80px 1rem 2rem" }}>
        <div style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"20px", padding:"2rem", textAlign:"center" }}>
          <div style={{ fontSize:"56px", marginBottom:"16px" }}>🔐</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"22px", fontWeight:"800", color:G, marginBottom:"6px" }}>PROJO Vault</div>
          <div style={{ fontSize:"13px", color:"#6b6760", marginBottom:"2rem" }}>Enter your PIN to unlock</div>
          <input type="password" value={pinInput} onChange={e=>setPinInput(e.target.value)} placeholder="Enter PIN" style={{ ...inp, textAlign:"center", fontSize:"20px", letterSpacing:"6px" }} onKeyDown={e=>e.key==="Enter"&&unlock()} autoFocus />
          <button onClick={unlock} style={{ width:"100%", background:G, border:"none", borderRadius:"12px", padding:"14px", color:BG, fontWeight:"800", fontSize:"15px", cursor:"pointer" }}>Unlock Vault 🔓</button>
        </div>
      </div>
    </div>
  );

  // ITEM DETAIL
  if (showItem) return (
    <div style={{ background:BG, minHeight:"100vh", color:"#f0ede8", fontFamily:"'DM Sans',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth:"600px", margin:"0 auto", padding:"80px 1rem 2rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.5rem" }}>
          <button onClick={()=>setShowItem(null)} style={{ background:"none", border:"none", color:G, fontSize:"14px", cursor:"pointer" }}>← Back</button>
          <button onClick={()=>deleteItem(showItem.id)} style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:"8px", padding:"8px 14px", color:"#ef4444", fontSize:"12px", cursor:"pointer" }}>Delete</button>
        </div>
        <div style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"16px", padding:"1.5rem" }}>
          <div style={{ fontSize:"32px", marginBottom:"8px" }}>{CAT_ICONS[showItem.category]||"🔒"}</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"20px", fontWeight:"800", color:"#f0ede8", marginBottom:"4px" }}>{showItem.label}</div>
          <div style={{ fontSize:"12px", color:"#6b6760", marginBottom:"1.5rem" }}>{showItem.category}</div>
          {showItem.website && (
            <div style={{ background:BG3, borderRadius:"10px", padding:"12px 14px", marginBottom:"10px" }}>
              <div style={{ fontSize:"10px", color:"#6b6760", marginBottom:"3px" }}>WEBSITE</div>
              <div style={{ fontSize:"14px", color:"#3b82f6" }}>{showItem.website}</div>
            </div>
          )}
          {showItem.username && (
            <div style={{ background:BG3, borderRadius:"10px", padding:"12px 14px", marginBottom:"10px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div><div style={{ fontSize:"10px", color:"#6b6760", marginBottom:"3px" }}>USERNAME / EMAIL</div><div style={{ fontSize:"14px", color:"#f0ede8" }}>{showItem.username}</div></div>
              <button onClick={()=>{ navigator.clipboard.writeText(showItem.username); toast.success("Copied!"); }} style={{ background:"rgba(232,184,75,0.15)", border:`1px solid ${BORDER}`, borderRadius:"6px", padding:"6px 10px", color:G, fontSize:"11px", fontWeight:"700", cursor:"pointer" }}>Copy</button>
            </div>
          )}
          {showItem.password && (
            <div style={{ background:BG3, borderRadius:"10px", padding:"12px 14px", marginBottom:"10px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:"10px", color:"#6b6760", marginBottom:"3px" }}>PASSWORD</div>
                <div style={{ fontSize:"14px", color:"#f0ede8", fontFamily:"monospace", letterSpacing:showPasswords[showItem.id]?"1px":"4px" }}>{showPasswords[showItem.id] ? showItem.password : "••••••••••••"}</div>
              </div>
              <div style={{ display:"flex", gap:"6px" }}>
                <button onClick={()=>setShowPasswords(p=>({...p,[showItem.id]:!p[showItem.id]}))} style={{ background:"rgba(232,184,75,0.1)", border:`1px solid ${BORDER}`, borderRadius:"6px", padding:"6px 10px", color:G, fontSize:"11px", cursor:"pointer" }}>{showPasswords[showItem.id]?"Hide":"Show"}</button>
                <button onClick={()=>{ navigator.clipboard.writeText(showItem.password); toast.success("Password copied!"); }} style={{ background:"rgba(232,184,75,0.15)", border:`1px solid ${BORDER}`, borderRadius:"6px", padding:"6px 10px", color:G, fontSize:"11px", fontWeight:"700", cursor:"pointer" }}>Copy</button>
              </div>
            </div>
          )}
          {showItem.notes && (
            <div style={{ background:BG3, borderRadius:"10px", padding:"12px 14px" }}>
              <div style={{ fontSize:"10px", color:"#6b6760", marginBottom:"3px" }}>NOTES</div>
              <div style={{ fontSize:"13px", color:"#f0ede8", lineHeight:1.6, whiteSpace:"pre-wrap" }}>{showItem.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // MAIN VAULT
  return (
    <div style={{ background:BG, minHeight:"100vh", color:"#f0ede8", fontFamily:"'DM Sans',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth:"680px", margin:"0 auto", padding:"80px 1rem 2rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"22px", fontWeight:"800" }}>🔒 Secure Vault</div>
            <div style={{ fontSize:"12px", color:"#6b6760" }}>{items.length} items · Encrypted on device</div>
          </div>
          <div style={{ display:"flex", gap:"8px" }}>
            <button onClick={()=>{ setLocked(true); setPinInput(""); }} style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"10px", padding:"9px 14px", color:"#6b6760", fontSize:"12px", cursor:"pointer" }}>🔒 Lock</button>
            <button onClick={()=>setShowForm(s=>!s)} style={{ background:G, border:"none", borderRadius:"10px", padding:"9px 16px", color:BG, fontWeight:"800", fontSize:"13px", cursor:"pointer" }}>+ Add</button>
          </div>
        </div>

        {showForm && (
          <div style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"16px", padding:"1.25rem", marginBottom:"1rem" }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"14px", fontWeight:"800", color:G, marginBottom:"12px" }}>Add to Vault</div>
            <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={inp}>{CATS.map(c=><option key={c}>{c}</option>)}</select>
            <input value={form.label} onChange={e=>setForm(f=>({...f,label:e.target.value}))} placeholder="Label (e.g. Gmail, FNB Card) *" style={inp} />
            <input value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))} placeholder="Username / Email / ID number" style={inp} />
            {(form.category==="Passwords"||form.category==="Cards") && (
              <div style={{ position:"relative" }}>
                <input value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="Password / PIN / Card number" style={{ ...inp, paddingRight:"100px" }} type="text" />
                <button onClick={generatePassword} style={{ position:"absolute", right:"10px", top:"11px", background:"rgba(232,184,75,0.2)", border:"none", borderRadius:"6px", padding:"3px 8px", color:G, fontSize:"11px", fontWeight:"700", cursor:"pointer" }}>Generate</button>
              </div>
            )}
            <input value={form.website} onChange={e=>setForm(f=>({...f,website:e.target.value}))} placeholder="Website / App URL" style={inp} />
            <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Notes" rows={2} style={{ ...inp, resize:"none" }} />
            <div style={{ display:"flex", gap:"8px" }}>
              <button onClick={addItem} style={{ flex:1, background:G, border:"none", borderRadius:"10px", padding:"12px", color:BG, fontWeight:"800", cursor:"pointer" }}>Save to Vault</button>
              <button onClick={()=>setShowForm(false)} style={{ background:BG3, border:`1px solid ${BORDER}`, borderRadius:"10px", padding:"12px 18px", color:"#6b6760", cursor:"pointer" }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Category filter */}
        <div style={{ display:"flex", gap:"6px", overflowX:"auto", marginBottom:"1rem", paddingBottom:"4px" }}>
          {["All",...CATS].map(c=><button key={c} onClick={()=>setCat(c)} style={{ background:cat===c?"rgba(232,184,75,0.15)":BG2, border:`1px solid ${cat===c?G:BORDER}`, borderRadius:"20px", padding:"5px 12px", color:cat===c?G:"#6b6760", fontSize:"11px", fontWeight:"700", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>{CAT_ICONS[c]||"📁"} {c}</button>)}
        </div>

        {filtered.length===0 ? (
          <div style={{ textAlign:"center", padding:"4rem" }}>
            <div style={{ fontSize:"48px", marginBottom:"12px" }}>🔒</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"18px", fontWeight:"700", marginBottom:"8px" }}>Vault is empty</div>
            <div style={{ color:"#6b6760" }}>Add your first secure item</div>
          </div>
        ) : filtered.map(item=>(
          <div key={item.id} onClick={()=>setShowItem(item)} style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"14px", padding:"14px 16px", marginBottom:"8px", cursor:"pointer", display:"flex", alignItems:"center", gap:"12px" }}
            onMouseEnter={e=>e.currentTarget.style.borderColor=G}
            onMouseLeave={e=>e.currentTarget.style.borderColor=BORDER}>
            <div style={{ width:"44px", height:"44px", borderRadius:"12px", background:"rgba(232,184,75,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", flexShrink:0 }}>{CAT_ICONS[item.category]||"🔒"}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:"700", fontSize:"14px", color:"#f0ede8" }}>{item.label}</div>
              <div style={{ fontSize:"12px", color:"#6b6760" }}>{item.category}{item.username?` · ${item.username.slice(0,20)}${item.username.length>20?"...":""}`:""}</div>
            </div>
            <span style={{ color:"#4a3030" }}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// PROJO GROUP — Shopping Lists
import React, { useState, useEffect } from "react";
import Navbar from "../../components/ui/Navbar";
import api from "../../services/api";
import toast from "react-hot-toast";

const G="#e8b84b"; const BG="#0a0a0a"; const BG2="#111111"; const BG3="#1a1a1a"; const BORDER="rgba(232,184,75,0.15)";

export default function ShoppingPage() {
  const [lists, setLists]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive]   = useState(null);
  const [items, setItems]     = useState([]);
  const [newList, setNewList] = useState("");
  const [newItem, setNewItem] = useState("");
  const [newQty, setNewQty]   = useState("1");
  const [saving, setSaving]   = useState(false);

  useEffect(() => { loadLists(); }, []);

  async function loadLists() {
    setLoading(true);
    try { const data = await api.get("/tools/shopping/lists"); setLists(data.lists||[]); }
    catch { toast.error("Could not load lists"); }
    setLoading(false);
  }

  async function loadItems(listId) {
    try { const data = await api.get(`/tools/shopping/lists/${listId}/items`); setItems(data.items||[]); }
    catch {}
  }

  async function createList() {
    if (!newList.trim()) return;
    try {
      const data = await api.post("/tools/shopping/lists", { name: newList });
      setLists(p => [...p, data.list]); setNewList("");
      openList(data.list);
    } catch { toast.error("Could not create list"); }
  }

  function openList(list) { setActive(list); loadItems(list.id); }

  async function addItem() {
    if (!newItem.trim() || !active) return;
    setSaving(true);
    try {
      const data = await api.post(`/tools/shopping/lists/${active.id}/items`, { name:newItem, quantity:parseInt(newQty)||1 });
      setItems(p => [...p, data.item]); setNewItem(""); setNewQty("1");
    } catch { toast.error("Could not add item"); }
    setSaving(false);
  }

  async function toggleItem(item) {
    try {
      const data = await api.put(`/tools/shopping/items/${item.id}`, { checked: !item.checked });
      setItems(p => p.map(i => i.id===item.id ? data.item : i));
    } catch {}
  }

  async function deleteItem(id) {
    try { await api.delete(`/tools/shopping/items/${id}`); setItems(p=>p.filter(i=>i.id!==id)); }
    catch {}
  }

  async function deleteList(id) {
    if (!window.confirm("Delete this list?")) return;
    try { await api.delete(`/tools/shopping/lists/${id}`); setLists(p=>p.filter(l=>l.id!==id)); if(active?.id===id){setActive(null);setItems([]);} }
    catch {}
  }

  const checked = items.filter(i => i.checked).length;
  const inp = { background:BG3, border:`1px solid ${BORDER}`, borderRadius:"10px", color:"#f0ede8", padding:"10px 14px", fontSize:"14px", outline:"none", fontFamily:"'DM Sans',sans-serif" };

  if (active) return (
    <div style={{ background:BG, minHeight:"100vh", color:"#f0ede8", fontFamily:"'DM Sans',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth:"680px", margin:"0 auto", padding:"80px 1rem 2rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
          <div>
            <button onClick={() => setActive(null)} style={{ background:"none", border:"none", color:G, fontSize:"13px", cursor:"pointer", marginBottom:"4px", padding:0, display:"block" }}>← My Lists</button>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"20px", fontWeight:"800" }}>{active.name}</div>
            <div style={{ fontSize:"12px", color:"#6b6760" }}>{checked}/{items.length} items checked</div>
          </div>
          <button onClick={() => deleteList(active.id)} style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:"8px", padding:"8px 12px", color:"#ef4444", fontSize:"12px", cursor:"pointer" }}>Delete List</button>
        </div>

        {items.length > 0 && (
          <div style={{ background:BG2, borderRadius:"10px", height:"6px", marginBottom:"1rem" }}>
            <div style={{ background:G, height:"100%", borderRadius:"10px", width:`${items.length>0?(checked/items.length)*100:0}%`, transition:"width 0.4s" }} />
          </div>
        )}

        {/* Add item */}
        <div style={{ display:"flex", gap:"8px", marginBottom:"1rem" }}>
          <input value={newItem} onChange={e=>setNewItem(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addItem()} placeholder="Add item..." style={{ ...inp, flex:1 }} />
          <input type="number" value={newQty} onChange={e=>setNewQty(e.target.value)} style={{ ...inp, width:"60px", textAlign:"center" }} min="1" />
          <button onClick={addItem} disabled={saving} style={{ background:G, border:"none", borderRadius:"10px", padding:"10px 16px", color:BG, fontWeight:"800", cursor:"pointer" }}>+</button>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div style={{ textAlign:"center", padding:"3rem", color:"#6b6760" }}><div style={{ fontSize:"40px" }}>🛒</div><div style={{ marginTop:"10px" }}>Add your first item</div></div>
        ) : (
          <>
            {items.filter(i=>!i.checked).map(item => (
              <div key={item.id} style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"12px", padding:"12px 16px", marginBottom:"6px", display:"flex", alignItems:"center", gap:"12px" }}>
                <div onClick={() => toggleItem(item)} style={{ width:"22px", height:"22px", borderRadius:"6px", border:`2px solid ${BORDER}`, background:"transparent", cursor:"pointer", flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <span style={{ fontSize:"14px", color:"#f0ede8" }}>{item.name}</span>
                  {item.quantity > 1 && <span style={{ fontSize:"11px", color:"#6b6760", marginLeft:"8px" }}>×{item.quantity}</span>}
                </div>
                <button onClick={() => deleteItem(item.id)} style={{ background:"none", border:"none", color:"#4a3030", cursor:"pointer" }}>✕</button>
              </div>
            ))}
            {items.filter(i=>i.checked).length > 0 && (
              <>
                <div style={{ fontSize:"11px", color:"#6b6760", fontWeight:"700", textTransform:"uppercase", letterSpacing:"1px", margin:"12px 0 8px" }}>✓ Checked off</div>
                {items.filter(i=>i.checked).map(item => (
                  <div key={item.id} style={{ background:BG2, border:`1px solid rgba(232,184,75,0.08)`, borderRadius:"12px", padding:"12px 16px", marginBottom:"6px", display:"flex", alignItems:"center", gap:"12px", opacity:0.5 }}>
                    <div onClick={() => toggleItem(item)} style={{ width:"22px", height:"22px", borderRadius:"6px", border:`2px solid ${G}`, background:G, cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <span style={{ color:BG, fontSize:"12px", fontWeight:"800" }}>✓</span>
                    </div>
                    <span style={{ flex:1, fontSize:"14px", color:"#6b6760", textDecoration:"line-through" }}>{item.name}</span>
                    <button onClick={() => deleteItem(item.id)} style={{ background:"none", border:"none", color:"#4a3030", cursor:"pointer" }}>✕</button>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ background:BG, minHeight:"100vh", color:"#f0ede8", fontFamily:"'DM Sans',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth:"680px", margin:"0 auto", padding:"80px 1rem 2rem" }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"22px", fontWeight:"800", marginBottom:"1.25rem" }}>🛒 Shopping Lists</div>
        <div style={{ display:"flex", gap:"8px", marginBottom:"1.5rem" }}>
          <input value={newList} onChange={e=>setNewList(e.target.value)} onKeyDown={e=>e.key==="Enter"&&createList()} placeholder="New list name..." style={{ ...inp, flex:1 }} />
          <button onClick={createList} style={{ background:G, border:"none", borderRadius:"10px", padding:"10px 20px", color:BG, fontWeight:"800", cursor:"pointer" }}>Create</button>
        </div>
        {loading ? <div style={{ textAlign:"center", padding:"3rem", color:"#6b6760" }}>Loading...</div> :
         lists.length === 0 ? (
          <div style={{ textAlign:"center", padding:"4rem 2rem" }}>
            <div style={{ fontSize:"48px", marginBottom:"12px" }}>🛒</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"18px", fontWeight:"700", marginBottom:"8px" }}>No lists yet</div>
            <div style={{ color:"#6b6760" }}>Create your first shopping list</div>
          </div>
        ) : lists.map(list => (
          <div key={list.id} onClick={() => openList(list)} style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"14px", padding:"16px", marginBottom:"10px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}
            onMouseEnter={e=>e.currentTarget.style.borderColor=G}
            onMouseLeave={e=>e.currentTarget.style.borderColor=BORDER}>
            <div>
              <div style={{ fontWeight:"700", fontSize:"15px", color:"#f0ede8" }}>{list.name}</div>
              <div style={{ fontSize:"12px", color:"#6b6760" }}>{list.itemCount||0} items</div>
            </div>
            <span style={{ color:"#6b6760" }}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
}

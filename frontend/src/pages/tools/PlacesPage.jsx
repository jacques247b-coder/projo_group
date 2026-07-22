// PROJO GROUP — Saved Places
import React, { useState, useEffect } from "react";
import Navbar from "../../components/ui/Navbar";
import api from "../../services/api";
import toast from "react-hot-toast";

const G="#e8b84b"; const BG="#0a0a0a"; const BG2="#111111"; const BG3="#1a1a1a"; const BORDER="rgba(232,184,75,0.15)";
const CATS = ["All","Restaurant","Cafe","Shop","Service","Hospital","School","Church","Park","Work","Home","Other"];
const CAT_ICONS = { Restaurant:"🍽️",Cafe:"☕",Shop:"🛍️",Service:"🔧",Hospital:"🏥",School:"🏫",Church:"⛪",Park:"🌳",Work:"💼",Home:"🏠",Other:"📍" };

export default function PlacesPage() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat]       = useState("All");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]     = useState({ name:"", address:"", category:"Restaurant", notes:"", phone:"", rating:5 });
  const [saving, setSaving] = useState(false);

  useEffect(()=>{loadPlaces();},[]);
  async function loadPlaces(){ setLoading(true); try{ const d=await api.get("/tools/places"); setPlaces(d.places||[]); }catch{} setLoading(false); }
  async function addPlace(){
    if(!form.name.trim()) return toast.error("Place name required");
    setSaving(true);
    try{ const d=await api.post("/tools/places",form); setPlaces(p=>[d.place,...p]); setShowForm(false); setForm({name:"",address:"",category:"Restaurant",notes:"",phone:"",rating:5}); toast.success("Place saved ✓"); }
    catch{ toast.error("Could not save"); }
    setSaving(false);
  }
  async function deletePlace(id){ try{ await api.delete(`/tools/places/${id}`); setPlaces(p=>p.filter(pl=>pl.id!==id)); }catch{} }

  const filtered = places.filter(p=>(cat==="All"||p.category===cat)&&(!search||p.name.toLowerCase().includes(search.toLowerCase())||p.address?.toLowerCase().includes(search.toLowerCase())));
  const inp = { width:"100%", background:BG3, border:`1px solid ${BORDER}`, borderRadius:"10px", color:"#f0ede8", padding:"11px 14px", fontSize:"14px", outline:"none", fontFamily:"'DM Sans',sans-serif", boxSizing:"border-box", marginBottom:"10px" };

  return (
    <div style={{ background:BG, minHeight:"100vh", color:"#f0ede8", fontFamily:"'DM Sans',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth:"680px", margin:"0 auto", padding:"80px 1rem 2rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
          <div><div style={{ fontFamily:"'Syne',sans-serif", fontSize:"22px", fontWeight:"800" }}>📍 Places</div><div style={{ fontSize:"12px", color:"#6b6760" }}>{places.length} saved places</div></div>
          <button onClick={()=>setShowForm(s=>!s)} style={{ background:G, border:"none", borderRadius:"10px", padding:"10px 16px", color:BG, fontWeight:"800", fontSize:"13px", cursor:"pointer" }}>+ Save Place</button>
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search places..." style={{ ...inp, marginBottom:"12px" }} />
        <div style={{ display:"flex", gap:"6px", overflowX:"auto", marginBottom:"1rem", paddingBottom:"4px" }}>
          {CATS.map(c=><button key={c} onClick={()=>setCat(c)} style={{ background:cat===c?"rgba(232,184,75,0.15)":BG2, border:`1px solid ${cat===c?G:BORDER}`, borderRadius:"20px", padding:"5px 12px", color:cat===c?G:"#6b6760", fontSize:"11px", fontWeight:"700", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>{c}</button>)}
        </div>
        {showForm && (
          <div style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"16px", padding:"1.25rem", marginBottom:"1rem" }}>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Place name *" style={inp} />
            <input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} placeholder="Address" style={inp} />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
              <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={{ ...inp, marginBottom:0 }}>{CATS.filter(c=>c!=="All").map(c=><option key={c}>{c}</option>)}</select>
              <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="Phone (optional)" style={{ ...inp, marginBottom:0 }} />
            </div>
            <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Notes" rows={2} style={{ ...inp, marginTop:"10px", resize:"none" }} />
            <div style={{ marginBottom:"10px" }}>
              <div style={{ fontSize:"12px", color:"#6b6760", marginBottom:"6px" }}>Rating</div>
              <div style={{ display:"flex", gap:"4px" }}>{[1,2,3,4,5].map(s=><button key={s} onClick={()=>setForm(f=>({...f,rating:s}))} style={{ background:"none", border:"none", fontSize:"22px", cursor:"pointer", color:s<=form.rating?G:"#4a3030" }}>★</button>)}</div>
            </div>
            <div style={{ display:"flex", gap:"8px" }}>
              <button onClick={addPlace} disabled={saving} style={{ flex:1, background:G, border:"none", borderRadius:"10px", padding:"11px", color:BG, fontWeight:"800", cursor:"pointer" }}>Save Place</button>
              <button onClick={()=>setShowForm(false)} style={{ background:BG3, border:`1px solid ${BORDER}`, borderRadius:"10px", padding:"11px 18px", color:"#6b6760", cursor:"pointer" }}>Cancel</button>
            </div>
          </div>
        )}
        {loading ? <div style={{ textAlign:"center", padding:"3rem", color:"#6b6760" }}>Loading...</div> :
         filtered.length===0 ? <div style={{ textAlign:"center", padding:"4rem" }}><div style={{ fontSize:"48px", marginBottom:"12px" }}>📍</div><div style={{ fontFamily:"'Syne',sans-serif", fontSize:"18px", fontWeight:"700" }}>No places saved yet</div></div> :
         filtered.map(place=>(
          <div key={place.id} style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"14px", padding:"16px", marginBottom:"10px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ display:"flex", gap:"12px", alignItems:"flex-start" }}>
                <div style={{ width:"44px", height:"44px", borderRadius:"12px", background:`rgba(232,184,75,0.15)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", flexShrink:0 }}>{CAT_ICONS[place.category]||"📍"}</div>
                <div>
                  <div style={{ fontWeight:"700", fontSize:"15px", color:"#f0ede8" }}>{place.name}</div>
                  {place.address && <div style={{ fontSize:"12px", color:"#6b6760" }}>{place.address}</div>}
                  <div style={{ fontSize:"10px", color:G, marginTop:"3px" }}>{"★".repeat(place.rating||5)}</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:"8px" }}>
                {place.phone && <a href={`tel:${place.phone}`} style={{ background:"rgba(74,222,128,0.1)", border:"1px solid rgba(74,222,128,0.3)", borderRadius:"8px", padding:"6px 10px", color:"#4ade80", fontSize:"12px", textDecoration:"none" }}>📞</a>}
                <a href={`https://www.google.com/maps/search/${encodeURIComponent(place.name+" "+place.address)}`} target="_blank" rel="noreferrer" style={{ background:"rgba(59,130,246,0.1)", border:"1px solid rgba(59,130,246,0.3)", borderRadius:"8px", padding:"6px 10px", color:"#3b82f6", fontSize:"12px", textDecoration:"none" }}>🗺️</a>
                <button onClick={()=>deletePlace(place.id)} style={{ background:"none", border:"none", color:"#4a3030", cursor:"pointer" }}>🗑️</button>
              </div>
            </div>
            {place.notes && <div style={{ fontSize:"12px", color:"#6b6760", marginTop:"8px", paddingLeft:"56px" }}>{place.notes}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// PROJO ADMIN — World Catalog Manager
import React, { useState, useEffect } from "react";
import Navbar from "../../components/ui/Navbar";
import api from "../../services/api";
import toast from "react-hot-toast";

const G="#e8b84b"; const BG="#0a0a0a"; const BG2="#111111"; const BG3="#1a1a1a"; const BORDER="rgba(232,184,75,0.15)";
const CATEGORIES=["FURNITURE","CLOTHING","GIFT","COIN_PACK","UPGRADE"];
const CAT_ICONS={FURNITURE:"🛋️",CLOTHING:"👗",GIFT:"🎁",COIN_PACK:"★",UPGRADE:"🏠"};

export default function AdminWorldCatalog() {
  const [items, setItems]   = useState([]);
  const [loading, setLoading]=useState(true);
  const [showForm, setShowForm]=useState(false);
  const [catFilter, setCatFilter]=useState("ALL");
  const [form, setForm]     = useState({
    category:"FURNITURE", subCategory:"Living Room", name:"", description:"", icon:"🛋️",
    coinCost:"", realPriceZar:"", coinsGranted:"", bonusCoins:"",
    isSpecialOffer:false, offerEndsAt:"", sortOrder:"0", notify:true
  });
  const [saving, setSaving] = useState(false);

  useEffect(()=>{ loadAll(); },[]);

  async function loadAll(){
    setLoading(true);
    try{ const d=await api.get("/world/catalog"); setItems(d.items||[]); }catch{}
    setLoading(false);
  }

  async function saveItem(){
    if(!form.name.trim()||!form.icon.trim()) return toast.error("Name and icon required");
    setSaving(true);
    try{
      await api.post("/world/catalog",{
        ...form,
        coinCost:form.coinCost?parseInt(form.coinCost):null,
        realPriceZar:form.realPriceZar?parseFloat(form.realPriceZar):null,
        coinsGranted:form.coinsGranted?parseInt(form.coinsGranted):null,
        bonusCoins:form.bonusCoins?parseInt(form.bonusCoins):null,
        sortOrder:parseInt(form.sortOrder)||0,
        notify:form.notify
      });
      toast.success("Item added! Players notified. ✓");
      setShowForm(false);
      loadAll();
      setForm({category:"FURNITURE",subCategory:"Living Room",name:"",description:"",icon:"🛋️",coinCost:"",realPriceZar:"",coinsGranted:"",bonusCoins:"",isSpecialOffer:false,offerEndsAt:"",sortOrder:"0",notify:true});
    }catch(e){ toast.error(e.message||"Could not save"); }
    setSaving(false);
  }

  async function toggleActive(item){
    try{
      await api.put(`/world/catalog/${item.id}`,{isActive:!item.isActive});
      setItems(p=>p.map(i=>i.id===item.id?{...i,isActive:!i.isActive}:i));
    }catch{}
  }

  async function markSpecial(item){
    try{
      await api.put(`/world/catalog/${item.id}`,{isSpecialOffer:!item.isSpecialOffer});
      setItems(p=>p.map(i=>i.id===item.id?{...i,isSpecialOffer:!i.isSpecialOffer}:i));
      toast.success(item.isSpecialOffer?"Removed special offer":"Marked as special offer + players notified!");
    }catch{}
  }

  const filtered = catFilter==="ALL" ? items : items.filter(i=>i.category===catFilter);
  const inp={width:"100%",background:BG3,border:`1px solid ${BORDER}`,borderRadius:"10px",color:"#f0ede8",padding:"10px 12px",fontSize:"13px",outline:"none",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",marginBottom:"8px"};

  return (
    <div style={{background:BG,minHeight:"100vh",color:"#f0ede8",fontFamily:"'DM Sans',sans-serif"}}>
      <Navbar/>
      <div style={{maxWidth:"720px",margin:"0 auto",padding:"80px 1rem 2rem"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:"22px",fontWeight:"800"}}>🌍 World Catalog</div>
            <div style={{fontSize:"12px",color:"#6b6760"}}>{items.length} items · Admin manages all buyable items</div>
          </div>
          <button onClick={()=>setShowForm(s=>!s)} style={{background:G,border:"none",borderRadius:"10px",padding:"10px 16px",color:BG,fontWeight:"800",fontSize:"13px",cursor:"pointer"}}>+ Add Item</button>
        </div>

        {showForm&&(
          <div style={{background:BG2,border:`1px solid ${G}`,borderRadius:"16px",padding:"1.25rem",marginBottom:"1rem"}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:"15px",fontWeight:"800",color:G,marginBottom:"12px"}}>Add Catalog Item</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
              <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={inp}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select>
              <input value={form.subCategory} onChange={e=>setForm(f=>({...f,subCategory:e.target.value}))} placeholder="Sub-category" style={inp}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"60px 1fr",gap:"8px"}}>
              <input value={form.icon} onChange={e=>setForm(f=>({...f,icon:e.target.value}))} placeholder="🛋️" style={inp}/>
              <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Item name *" style={inp}/>
            </div>
            <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Description" rows={2} style={{...inp,resize:"none"}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
              <input type="number" value={form.coinCost} onChange={e=>setForm(f=>({...f,coinCost:e.target.value}))} placeholder="Coin cost (for coin buy)" style={inp}/>
              <input type="number" value={form.realPriceZar} onChange={e=>setForm(f=>({...f,realPriceZar:e.target.value}))} placeholder="Real price R (coin packs)" style={inp}/>
            </div>
            {form.category==="COIN_PACK"&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                <input type="number" value={form.coinsGranted} onChange={e=>setForm(f=>({...f,coinsGranted:e.target.value}))} placeholder="Coins granted" style={inp}/>
                <input type="number" value={form.bonusCoins} onChange={e=>setForm(f=>({...f,bonusCoins:e.target.value}))} placeholder="Bonus coins" style={inp}/>
              </div>
            )}
            <div style={{display:"flex",gap:"12px",marginBottom:"8px"}}>
              <div onClick={()=>setForm(f=>({...f,isSpecialOffer:!f.isSpecialOffer}))} style={{display:"flex",alignItems:"center",gap:"8px",cursor:"pointer"}}>
                <div style={{width:"18px",height:"18px",borderRadius:"4px",border:`2px solid ${form.isSpecialOffer?"#ec4899":BORDER}`,background:form.isSpecialOffer?"rgba(236,72,153,0.2)":"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {form.isSpecialOffer&&<span style={{color:"#ec4899",fontSize:"11px"}}>✓</span>}
                </div>
                <span style={{fontSize:"12px",color:"#a8a49e"}}>🔥 Special Offer</span>
              </div>
              <div onClick={()=>setForm(f=>({...f,notify:!f.notify}))} style={{display:"flex",alignItems:"center",gap:"8px",cursor:"pointer"}}>
                <div style={{width:"18px",height:"18px",borderRadius:"4px",border:`2px solid ${form.notify?G:BORDER}`,background:form.notify?"rgba(232,184,75,0.2)":"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {form.notify&&<span style={{color:G,fontSize:"11px"}}>✓</span>}
                </div>
                <span style={{fontSize:"12px",color:"#a8a49e"}}>📱 Notify players</span>
              </div>
            </div>
            {form.isSpecialOffer&&<input type="date" value={form.offerEndsAt} onChange={e=>setForm(f=>({...f,offerEndsAt:e.target.value}))} placeholder="Offer ends" style={{...inp,colorScheme:"dark"}}/>}
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={saveItem} disabled={saving} style={{flex:1,background:G,border:"none",borderRadius:"10px",padding:"12px",color:BG,fontWeight:"800",cursor:"pointer"}}>{saving?"Saving...":"Add Item"}</button>
              <button onClick={()=>setShowForm(false)} style={{background:BG3,border:`1px solid ${BORDER}`,borderRadius:"10px",padding:"12px 18px",color:"#6b6760",cursor:"pointer"}}>Cancel</button>
            </div>
          </div>
        )}

        {/* Filter */}
        <div style={{display:"flex",gap:"6px",marginBottom:"1rem",flexWrap:"wrap"}}>
          {["ALL",...CATEGORIES].map(c=>(
            <button key={c} onClick={()=>setCatFilter(c)} style={{background:catFilter===c?"rgba(232,184,75,0.15)":BG2,border:`1px solid ${catFilter===c?G:BORDER}`,borderRadius:"20px",padding:"5px 12px",color:catFilter===c?G:"#6b6760",fontSize:"11px",fontWeight:"700",cursor:"pointer"}}>
              {CAT_ICONS[c]||"📦"} {c}
            </button>
          ))}
        </div>

        {loading?<div style={{textAlign:"center",padding:"3rem",color:"#6b6760"}}>Loading...</div>:
         filtered.length===0?<div style={{textAlign:"center",padding:"3rem",color:"#6b6760"}}>No items in this category yet</div>:
         filtered.map(item=>(
          <div key={item.id} style={{background:item.isSpecialOffer?"rgba(236,72,153,0.05)":BG2,border:`1px solid ${item.isSpecialOffer?"rgba(236,72,153,0.3)":BORDER}`,borderRadius:"12px",padding:"12px 14px",marginBottom:"8px",display:"flex",gap:"12px",alignItems:"center",opacity:item.isActive?1:0.5}}>
            <div style={{fontSize:"28px"}}>{item.icon}</div>
            <div style={{flex:1}}>
              <div style={{display:"flex",gap:"6px",alignItems:"center",marginBottom:"3px"}}>
                <span style={{fontWeight:"700",fontSize:"14px",color:"#f0ede8"}}>{item.name}</span>
                {item.isSpecialOffer&&<span style={{fontSize:"9px",fontWeight:"700",color:"#ec4899",background:"rgba(236,72,153,0.1)",borderRadius:"4px",padding:"1px 6px"}}>SPECIAL</span>}
                {!item.isActive&&<span style={{fontSize:"9px",color:"#6b6760",background:BG3,borderRadius:"4px",padding:"1px 6px"}}>HIDDEN</span>}
              </div>
              <div style={{fontSize:"11px",color:"#6b6760"}}>{item.category} · {item.subCategory}</div>
              <div style={{fontSize:"11px",color:G}}>{item.coinCost?`★${item.coinCost} coins`:item.realPriceZar?`R${item.realPriceZar}${item.coinsGranted?` → ${item.coinsGranted+(item.bonusCoins||0)} coins`:""}`:""}</div>
            </div>
            <div style={{display:"flex",gap:"6px",flexWrap:"wrap",justifyContent:"flex-end"}}>
              <button onClick={()=>markSpecial(item)} style={{background:"rgba(236,72,153,0.1)",border:"1px solid rgba(236,72,153,0.25)",borderRadius:"6px",padding:"5px 8px",color:"#ec4899",fontSize:"10px",cursor:"pointer"}}>{item.isSpecialOffer?"★ Unfeature":"🔥 Feature"}</button>
              <button onClick={()=>toggleActive(item)} style={{background:item.isActive?"rgba(239,68,68,0.1)":"rgba(74,222,128,0.1)",border:`1px solid ${item.isActive?"rgba(239,68,68,0.3)":"rgba(74,222,128,0.3)"}`,borderRadius:"6px",padding:"5px 8px",color:item.isActive?"#ef4444":"#4ade80",fontSize:"10px",cursor:"pointer"}}>{item.isActive?"Hide":"Show"}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

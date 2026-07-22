// PROJO GROUP — Giveaway Board
import React, { useState, useEffect } from "react";
import Navbar from "../../components/ui/Navbar";
import api from "../../services/api";
import toast from "react-hot-toast";

const G="#e8b84b"; const BG="#0a0a0a"; const BG2="#111111"; const BG3="#1a1a1a"; const BORDER="rgba(232,184,75,0.15)";
const CATS=["All","Furniture","Clothing","Electronics","Books","Toys","Kitchen","Garden","Other"];

export default function GiveawayPage() {
  const [items, setItems]=useState([]); const [mine, setMine]=useState([]); const [loading, setLoading]=useState(true);
  const [tab, setTab]=useState("browse"); const [cat, setCat]=useState("All"); const [search, setSearch]=useState("");
  const [showForm, setShowForm]=useState(false);
  const [form, setForm]=useState({title:"",description:"",category:"Furniture",condition:"Good",location:"Rustenburg",phone:""});
  const [saving, setSaving]=useState(false);

  useEffect(()=>{loadItems();loadMine();},[]);
  async function loadItems(){setLoading(true);try{const d=await api.get("/community/giveaway");setItems(d.items||[]);}catch{}setLoading(false);}
  async function loadMine(){try{const d=await api.get("/community/giveaway/mine");setMine(d.items||[]);}catch{}}
  async function post(){
    if(!form.title.trim()||!form.description.trim())return toast.error("Title and description required");
    if(!form.phone.trim())return toast.error("Phone number required");
    setSaving(true);
    try{const d=await api.post("/community/giveaway",form);setItems(p=>[d.item,...p]);setMine(p=>[d.item,...p]);setShowForm(false);setForm({title:"",description:"",category:"Furniture",condition:"Good",location:"Rustenburg",phone:""});toast.success("Listed for free! 🎁");}
    catch{toast.error("Could not post");}
    setSaving(false);
  }
  async function markClaimed(id){try{await api.put(`/community/giveaway/${id}/claim`);setMine(p=>p.map(i=>i.id===id?{...i,status:"CLAIMED"}:i));toast.success("Marked as claimed");}catch{}}
  async function deleteItem(id){try{await api.delete(`/community/giveaway/${id}`);setItems(p=>p.filter(i=>i.id!==id));setMine(p=>p.filter(i=>i.id!==id));}catch{}}

  const filtered=items.filter(i=>(cat==="All"||i.category===cat)&&(!search||i.title.toLowerCase().includes(search.toLowerCase())));
  const inp={width:"100%",background:BG3,border:`1px solid ${BORDER}`,borderRadius:"10px",color:"#f0ede8",padding:"11px 14px",fontSize:"14px",outline:"none",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",marginBottom:"10px"};

  return (
    <div style={{background:BG,minHeight:"100vh",color:"#f0ede8",fontFamily:"'DM Sans',sans-serif"}}>
      <Navbar />
      <div style={{maxWidth:"680px",margin:"0 auto",padding:"80px 1rem 2rem"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
          <div><div style={{fontFamily:"'Syne',sans-serif",fontSize:"22px",fontWeight:"800"}}>🎁 Giveaway Board</div><div style={{fontSize:"12px",color:"#6b6760"}}>Free items · Rustenburg & surrounds</div></div>
          <button onClick={()=>setShowForm(s=>!s)} style={{background:G,border:"none",borderRadius:"10px",padding:"10px 16px",color:BG,fontWeight:"800",fontSize:"13px",cursor:"pointer"}}>+ Give Away</button>
        </div>
        <div style={{display:"flex",gap:"8px",marginBottom:"1rem"}}>
          {[["browse","🔍 Browse"],["mine","📦 My Items"]].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{flex:1,background:tab===k?"rgba(232,184,75,0.15)":BG2,border:`1px solid ${tab===k?G:BORDER}`,borderRadius:"10px",padding:"10px",color:tab===k?G:"#6b6760",fontSize:"13px",fontWeight:"700",cursor:"pointer"}}>{l}</button>
          ))}
        </div>
        {showForm&&(
          <div style={{background:BG2,border:`1px solid ${BORDER}`,borderRadius:"16px",padding:"1.25rem",marginBottom:"1rem"}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:"15px",fontWeight:"800",color:G,marginBottom:"12px"}}>List Item for Free</div>
            <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Item title *" style={inp}/>
            <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Describe the item — condition, size, brand etc. *" rows={3} style={{...inp,resize:"none"}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
              <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={{...inp,marginBottom:0}}>{CATS.filter(c=>c!=="All").map(c=><option key={c}>{c}</option>)}</select>
              <select value={form.condition} onChange={e=>setForm(f=>({...f,condition:e.target.value}))} style={{...inp,marginBottom:0}}>{["New","Like New","Good","Fair","For Parts"].map(c=><option key={c}>{c}</option>)}</select>
            </div>
            <input value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} placeholder="Location (suburb / area)" style={{...inp,marginTop:"10px"}}/>
            <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="Phone number for collection *" style={inp}/>
            <div style={{background:"rgba(74,222,128,0.05)",border:"1px solid rgba(74,222,128,0.2)",borderRadius:"10px",padding:"10px",marginBottom:"10px",fontSize:"12px",color:"#4ade80"}}>✓ This item is FREE — no payment accepted through PROJO</div>
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={post} disabled={saving} style={{flex:1,background:G,border:"none",borderRadius:"10px",padding:"12px",color:BG,fontWeight:"800",cursor:"pointer"}}>{saving?"Posting...":"List for Free 🎁"}</button>
              <button onClick={()=>setShowForm(false)} style={{background:BG3,border:`1px solid ${BORDER}`,borderRadius:"10px",padding:"12px 18px",color:"#6b6760",cursor:"pointer"}}>Cancel</button>
            </div>
          </div>
        )}
        {tab==="browse"&&(<>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search items..." style={{...inp,marginBottom:"10px"}}/>
          <div style={{display:"flex",gap:"6px",overflowX:"auto",marginBottom:"1rem",paddingBottom:"4px"}}>
            {CATS.map(c=><button key={c} onClick={()=>setCat(c)} style={{background:cat===c?"rgba(232,184,75,0.15)":BG2,border:`1px solid ${cat===c?G:BORDER}`,borderRadius:"20px",padding:"5px 12px",color:cat===c?G:"#6b6760",fontSize:"11px",fontWeight:"700",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>{c}</button>)}
          </div>
          {loading?<div style={{textAlign:"center",padding:"3rem",color:"#6b6760"}}>Loading...</div>:filtered.length===0?<div style={{textAlign:"center",padding:"4rem"}}><div style={{fontSize:"48px",marginBottom:"12px"}}>🎁</div><div style={{fontFamily:"'Syne',sans-serif",fontSize:"18px",fontWeight:"700"}}>Nothing listed yet</div><div style={{color:"#6b6760"}}>Be first to give something away!</div></div>:
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
            {filtered.map(item=>(
              <div key={item.id} style={{background:BG2,border:`1px solid ${BORDER}`,borderRadius:"14px",padding:"14px"}}>
                <div style={{background:"rgba(74,222,128,0.15)",border:"1px solid rgba(74,222,128,0.3)",borderRadius:"6px",padding:"2px 8px",fontSize:"10px",fontWeight:"700",color:"#4ade80",display:"inline-block",marginBottom:"8px"}}>FREE</div>
                <div style={{fontWeight:"700",fontSize:"14px",color:"#f0ede8",marginBottom:"4px"}}>{item.title}</div>
                <div style={{fontSize:"11px",color:"#6b6760",marginBottom:"4px"}}>{item.condition} · {item.category}</div>
                <div style={{fontSize:"11px",color:"#6b6760",marginBottom:"10px"}}>📍 {item.location}</div>
                {item.phone&&<a href={`https://wa.me/${item.phone?.replace(/\D/g,"")}`} target="_blank" rel="noreferrer" style={{display:"block",textAlign:"center",background:"rgba(37,211,102,0.15)",border:"1px solid rgba(37,211,102,0.3)",borderRadius:"8px",padding:"8px",color:"#25d366",textDecoration:"none",fontSize:"12px",fontWeight:"700"}}>💬 WhatsApp</a>}
              </div>
            ))}
          </div>}
        </>)}
        {tab==="mine"&&(mine.length===0?<div style={{textAlign:"center",padding:"4rem"}}><div style={{fontSize:"48px",marginBottom:"12px"}}>📦</div><div>You haven't listed any items yet</div></div>:
          mine.map(item=>(
            <div key={item.id} style={{background:BG2,border:`1px solid ${BORDER}`,borderRadius:"14px",padding:"14px",marginBottom:"8px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"8px"}}>
                <div><div style={{fontWeight:"700",color:"#f0ede8"}}>{item.title}</div><div style={{fontSize:"12px",color:"#6b6760"}}>{item.category}</div></div>
                <span style={{fontSize:"11px",fontWeight:"700",color:item.status==="AVAILABLE"?"#4ade80":"#6b7280",background:item.status==="AVAILABLE"?"rgba(74,222,128,0.1)":"rgba(107,114,128,0.1)",borderRadius:"6px",padding:"2px 8px"}}>{item.status||"AVAILABLE"}</span>
              </div>
              <div style={{display:"flex",gap:"8px"}}>
                {(!item.status||item.status==="AVAILABLE")&&<button onClick={()=>markClaimed(item.id)} style={{flex:1,background:"rgba(74,222,128,0.1)",border:"1px solid rgba(74,222,128,0.3)",borderRadius:"8px",padding:"8px",color:"#4ade80",fontSize:"12px",fontWeight:"700",cursor:"pointer"}}>Mark Claimed</button>}
                <button onClick={()=>deleteItem(item.id)} style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:"8px",padding:"8px 12px",color:"#ef4444",fontSize:"12px",cursor:"pointer"}}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

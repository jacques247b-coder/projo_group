// PROJO GROUP — NPO Donation Board
import React, { useState, useEffect } from "react";
import Navbar from "../../components/ui/Navbar";
import api from "../../services/api";
import toast from "react-hot-toast";

const G="#e8b84b"; const BG="#0a0a0a"; const BG2="#111111"; const BG3="#1a1a1a"; const BORDER="rgba(232,184,75,0.15)";

export default function DonationsPage() {
  const [needs, setNeeds]=useState([]); const [loading, setLoading]=useState(true);
  const [selected, setSelected]=useState(null);
  const [pledgeForm, setPledgeForm]=useState({name:"",phone:"",quantity:"",message:""});
  const [saving, setSaving]=useState(false);

  useEffect(()=>{loadNeeds();},[]);
  async function loadNeeds(){setLoading(true);try{const d=await api.get("/community/donations");setNeeds(d.needs||[]);}catch{}setLoading(false);}

  async function pledge(){
    if(!pledgeForm.name.trim()||!pledgeForm.phone.trim())return toast.error("Name and phone required");
    setSaving(true);
    try{
      await api.post(`/community/donations/${selected.id}/pledge`,pledgeForm);
      toast.success("Thank you for your pledge! 🙏");
      setSelected(null); setPledgeForm({name:"",phone:"",quantity:"",message:""});
    }catch{toast.error("Could not submit pledge");}
    setSaving(false);
  }

  const inp={width:"100%",background:BG3,border:`1px solid ${BORDER}`,borderRadius:"10px",color:"#f0ede8",padding:"11px 14px",fontSize:"14px",outline:"none",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",marginBottom:"10px"};

  return (
    <div style={{background:BG,minHeight:"100vh",color:"#f0ede8",fontFamily:"'DM Sans',sans-serif"}}>
      <Navbar/>
      <div style={{maxWidth:"680px",margin:"0 auto",padding:"80px 1rem 2rem"}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:"22px",fontWeight:"800",marginBottom:"4px"}}>🤝 Donation Board</div>
        <div style={{fontSize:"12px",color:"#6b6760",marginBottom:"1.25rem"}}>Verified local NPOs sharing specific needs</div>
        <div style={{background:"rgba(74,222,128,0.05)",border:"1px solid rgba(74,222,128,0.2)",borderRadius:"12px",padding:"12px 14px",marginBottom:"1.25rem",fontSize:"12px",color:"#4ade80"}}>
          ✓ All organisations are verified by PROJO GROUP · Donations are arranged directly with the NPO
        </div>
        {loading?<div style={{textAlign:"center",padding:"3rem",color:"#6b6760"}}>Loading...</div>:needs.length===0?(
          <div style={{textAlign:"center",padding:"4rem"}}><div style={{fontSize:"48px",marginBottom:"12px"}}>🤝</div><div style={{fontFamily:"'Syne',sans-serif",fontSize:"18px",fontWeight:"700"}}>No active needs</div><div style={{color:"#6b6760",marginTop:"8px"}}>Check back soon — NPOs post here when they have specific needs</div></div>
        ):needs.map(need=>(
          <div key={need.id} style={{background:BG2,border:`1px solid ${BORDER}`,borderRadius:"16px",padding:"16px",marginBottom:"12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"10px"}}>
              <div>
                <div style={{fontWeight:"700",fontSize:"15px",color:"#f0ede8"}}>{need.title}</div>
                <div style={{fontSize:"12px",color:G,fontWeight:"700"}}>{need.charity?.name||"Verified NPO"}</div>
                <div style={{fontSize:"11px",color:"#6b6760"}}>📍 {need.charity?.location||"Rustenburg"}</div>
              </div>
              {need.urgent&&<span style={{fontSize:"11px",fontWeight:"700",color:"#ef4444",background:"rgba(239,68,68,0.1)",borderRadius:"6px",padding:"3px 8px"}}>🚨 Urgent</span>}
            </div>
            <div style={{fontSize:"13px",color:"#d4c9b8",lineHeight:1.6,marginBottom:"10px"}}>{need.description}</div>
            {need.targetQuantity&&(
              <div style={{marginBottom:"10px"}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:"11px",color:"#6b6760",marginBottom:"4px"}}>
                  <span>{need.fulfilledQuantity||0} / {need.targetQuantity} {need.unit||"items"}</span>
                  <span>{Math.round(((need.fulfilledQuantity||0)/need.targetQuantity)*100)}%</span>
                </div>
                <div style={{background:BG3,borderRadius:"6px",height:"6px"}}>
                  <div style={{background:"#4ade80",height:"100%",borderRadius:"6px",width:`${Math.min(100,((need.fulfilledQuantity||0)/need.targetQuantity)*100)}%`}}/>
                </div>
              </div>
            )}
            <button onClick={()=>setSelected(need)} style={{width:"100%",background:G,border:"none",borderRadius:"10px",padding:"11px",color:BG,fontWeight:"800",fontSize:"14px",cursor:"pointer"}}>🤝 I Can Help</button>
          </div>
        ))}
        {selected&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
            <div style={{background:BG2,border:`1px solid ${BORDER}`,borderRadius:"20px 20px 0 0",padding:"1.5rem",width:"100%",maxWidth:"500px"}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:"18px",fontWeight:"800",color:G,marginBottom:"4px"}}>🤝 Pledge to Help</div>
              <div style={{fontSize:"13px",color:"#6b6760",marginBottom:"1.25rem"}}>{selected.title} — {selected.charity?.name}</div>
              <input value={pledgeForm.name} onChange={e=>setPledgeForm(f=>({...f,name:e.target.value}))} placeholder="Your name *" style={inp}/>
              <input value={pledgeForm.phone} onChange={e=>setPledgeForm(f=>({...f,phone:e.target.value}))} placeholder="Phone number *" style={inp}/>
              {selected.targetQuantity&&<input type="number" value={pledgeForm.quantity} onChange={e=>setPledgeForm(f=>({...f,quantity:e.target.value}))} placeholder={`Quantity (${selected.unit||"items"})`} style={inp}/>}
              <textarea value={pledgeForm.message} onChange={e=>setPledgeForm(f=>({...f,message:e.target.value}))} placeholder="Message (optional)" rows={2} style={{...inp,resize:"none"}}/>
              <div style={{display:"flex",gap:"8px"}}>
                <button onClick={pledge} disabled={saving} style={{flex:1,background:G,border:"none",borderRadius:"10px",padding:"12px",color:BG,fontWeight:"800",cursor:"pointer"}}>{saving?"Submitting...":"Submit Pledge 🙏"}</button>
                <button onClick={()=>setSelected(null)} style={{background:BG3,border:`1px solid ${BORDER}`,borderRadius:"10px",padding:"12px 18px",color:"#6b6760",cursor:"pointer"}}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// PROJO GROUP — School Carpool Board
import React, { useState, useEffect } from "react";
import Navbar from "../../components/ui/Navbar";
import api from "../../services/api";
import toast from "react-hot-toast";

const G="#e8b84b"; const BG="#0a0a0a"; const BG2="#111111"; const BG3="#1a1a1a"; const BORDER="rgba(232,184,75,0.15)";

export default function CarpoolPage() {
  const [routes, setRoutes]=useState([]); const [loading, setLoading]=useState(true);
  const [tab, setTab]=useState("browse"); const [showForm, setShowForm]=useState(false);
  const [form, setForm]=useState({school:"",suburb:"",morningTime:"07:00",afternoonTime:"14:00",daysAvailable:"Mon-Fri",seatsAvailable:3,phone:"",notes:""});
  const [saving, setSaving]=useState(false); const [interest, setInterest]=useState({});

  useEffect(()=>{loadRoutes();},[]);
  async function loadRoutes(){setLoading(true);try{const d=await api.get("/community/carpool");setRoutes(d.routes||[]);}catch{}setLoading(false);}
  async function post(){
    if(!form.school.trim()||!form.suburb.trim())return toast.error("School and suburb required");
    if(!form.phone.trim())return toast.error("Phone number required");
    setSaving(true);
    try{const d=await api.post("/community/carpool",form);setRoutes(p=>[d.route,...p]);setShowForm(false);toast.success("Carpool posted! 🚗");}
    catch{toast.error("Could not post");}
    setSaving(false);
  }
  async function showInterest(routeId){
    const name=prompt("Your name?"); if(!name)return;
    const phone=prompt("Your phone number?"); if(!phone)return;
    try{await api.post(`/community/carpool/${routeId}/interest`,{name,phone});toast.success("Interest sent! The driver will contact you.");setInterest(p=>({...p,[routeId]:true}));}
    catch{toast.error("Could not send interest");}
  }

  const inp={width:"100%",background:BG3,border:`1px solid ${BORDER}`,borderRadius:"10px",color:"#f0ede8",padding:"11px 14px",fontSize:"14px",outline:"none",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",marginBottom:"10px"};

  return (
    <div style={{background:BG,minHeight:"100vh",color:"#f0ede8",fontFamily:"'DM Sans',sans-serif"}}>
      <Navbar/>
      <div style={{maxWidth:"680px",margin:"0 auto",padding:"80px 1rem 2rem"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
          <div><div style={{fontFamily:"'Syne',sans-serif",fontSize:"22px",fontWeight:"800"}}>🚗 School Carpool</div><div style={{fontSize:"12px",color:"#6b6760"}}>Share school runs · Save fuel · Build community</div></div>
          <button onClick={()=>setShowForm(s=>!s)} style={{background:G,border:"none",borderRadius:"10px",padding:"10px 14px",color:BG,fontWeight:"800",fontSize:"13px",cursor:"pointer"}}>+ Offer Lift</button>
        </div>
        <div style={{background:"rgba(59,130,246,0.05)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:"12px",padding:"12px",marginBottom:"1rem",fontSize:"12px",color:"#3b82f6"}}>
          🔒 Phone numbers are only shared after you click "I'm Interested" — your privacy is protected
        </div>
        {showForm&&(
          <div style={{background:BG2,border:`1px solid ${BORDER}`,borderRadius:"16px",padding:"1.25rem",marginBottom:"1rem"}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:"15px",fontWeight:"800",color:G,marginBottom:"12px"}}>Offer a Carpool</div>
            <input value={form.school} onChange={e=>setForm(f=>({...f,school:e.target.value}))} placeholder="School name *" style={inp}/>
            <input value={form.suburb} onChange={e=>setForm(f=>({...f,suburb:e.target.value}))} placeholder="Your suburb / area *" style={inp}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
              <div><label style={{fontSize:"11px",color:"#6b6760",display:"block",marginBottom:"4px"}}>🌅 Morning pickup</label><input type="time" value={form.morningTime} onChange={e=>setForm(f=>({...f,morningTime:e.target.value}))} style={{...inp,marginBottom:0,colorScheme:"dark"}}/></div>
              <div><label style={{fontSize:"11px",color:"#6b6760",display:"block",marginBottom:"4px"}}>🌇 Afternoon</label><input type="time" value={form.afternoonTime} onChange={e=>setForm(f=>({...f,afternoonTime:e.target.value}))} style={{...inp,marginBottom:0,colorScheme:"dark"}}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginTop:"10px"}}>
              <input value={form.daysAvailable} onChange={e=>setForm(f=>({...f,daysAvailable:e.target.value}))} placeholder="Days (e.g. Mon-Fri)" style={{...inp,marginBottom:0}}/>
              <input type="number" value={form.seatsAvailable} onChange={e=>setForm(f=>({...f,seatsAvailable:parseInt(e.target.value)}))} placeholder="Seats available" min="1" max="8" style={{...inp,marginBottom:0}}/>
            </div>
            <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="Your phone number *" style={{...inp,marginTop:"10px"}}/>
            <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Notes (e.g. route, cost sharing details)" rows={2} style={{...inp,resize:"none"}}/>
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={post} disabled={saving} style={{flex:1,background:G,border:"none",borderRadius:"10px",padding:"12px",color:BG,fontWeight:"800",cursor:"pointer"}}>{saving?"Posting...":"Post Carpool 🚗"}</button>
              <button onClick={()=>setShowForm(false)} style={{background:BG3,border:`1px solid ${BORDER}`,borderRadius:"10px",padding:"12px 18px",color:"#6b6760",cursor:"pointer"}}>Cancel</button>
            </div>
          </div>
        )}
        {loading?<div style={{textAlign:"center",padding:"3rem",color:"#6b6760"}}>Loading...</div>:routes.length===0?(
          <div style={{textAlign:"center",padding:"4rem"}}><div style={{fontSize:"48px",marginBottom:"12px"}}>🚗</div><div style={{fontFamily:"'Syne',sans-serif",fontSize:"18px",fontWeight:"700"}}>No carpools yet</div><div style={{color:"#6b6760",marginTop:"8px"}}>Offer a lift to get started!</div></div>
        ):routes.map(route=>(
          <div key={route.id} style={{background:BG2,border:`1px solid ${BORDER}`,borderRadius:"16px",padding:"16px",marginBottom:"12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"10px"}}>
              <div>
                <div style={{fontWeight:"700",fontSize:"16px",color:"#f0ede8"}}>🏫 {route.school}</div>
                <div style={{fontSize:"13px",color:G}}>📍 From {route.suburb}</div>
              </div>
              <div style={{background:"rgba(232,184,75,0.15)",border:`1px solid ${BORDER}`,borderRadius:"8px",padding:"4px 10px",textAlign:"center"}}>
                <div style={{fontSize:"16px",fontWeight:"800",color:G}}>{route.seatsAvailable}</div>
                <div style={{fontSize:"9px",color:"#6b6760"}}>seats</div>
              </div>
            </div>
            <div style={{display:"flex",gap:"12px",fontSize:"12px",color:"#6b6760",marginBottom:"10px"}}>
              <span>🌅 {route.morningTime}</span>
              <span>🌇 {route.afternoonTime}</span>
              <span>📅 {route.daysAvailable}</span>
            </div>
            {route.notes&&<div style={{fontSize:"12px",color:"#a8a49e",marginBottom:"10px"}}>{route.notes}</div>}
            {!interest[route.id]?
              <button onClick={()=>showInterest(route.id)} style={{width:"100%",background:G,border:"none",borderRadius:"10px",padding:"11px",color:BG,fontWeight:"800",fontSize:"14px",cursor:"pointer"}}>🙋 I'm Interested</button>:
              <div style={{background:"rgba(74,222,128,0.1)",border:"1px solid rgba(74,222,128,0.3)",borderRadius:"10px",padding:"11px",textAlign:"center",color:"#4ade80",fontSize:"13px",fontWeight:"700"}}>✓ Interest sent — driver will contact you</div>
            }
          </div>
        ))}
      </div>
    </div>
  );
}

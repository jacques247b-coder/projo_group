// PROJO GROUP — Road Hazards Reporter
import React, { useState, useEffect } from "react";
import Navbar from "../../components/ui/Navbar";
import api from "../../services/api";
import toast from "react-hot-toast";

const G="#e8b84b"; const BG="#0a0a0a"; const BG2="#111111"; const BG3="#1a1a1a"; const BORDER="rgba(232,184,75,0.15)";
const HAZARD_TYPES=["Pothole","Road Damage","Flooding","Traffic Light Out","Accident","Stray Animals","Construction Hazard","Fallen Tree","Other"];
const SEVERITY_COLORS={Low:"#e8b84b",Medium:"#f59e0b",High:"#ef4444",Critical:"#dc2626"};

export default function RoadHazardsPage() {
  const [reports, setReports]=useState([]); const [loading, setLoading]=useState(true);
  const [tab, setTab]=useState("map"); const [showForm, setShowForm]=useState(false);
  const [form, setForm]=useState({type:"Pothole",description:"",location:"",suburb:"Rustenburg",severity:"Medium",photo:""});
  const [saving, setSaving]=useState(false); const [filter, setFilter]=useState("All");

  useEffect(()=>{loadReports();},[]);
  async function loadReports(){setLoading(true);try{const d=await api.get("/civic/road-hazards");setReports(d.reports||[]);}catch{}setLoading(false);}
  async function report(){
    if(!form.description.trim()||!form.location.trim())return toast.error("Description and location required");
    setSaving(true);
    try{const d=await api.post("/civic/road-hazards",form);setReports(p=>[d.report,...p]);setShowForm(false);setForm({type:"Pothole",description:"",location:"",suburb:"Rustenburg",severity:"Medium",photo:""});toast.success("Hazard reported ✓ Thank you!");}
    catch{toast.error("Could not submit report");}
    setSaving(false);
  }
  async function confirm(id){try{await api.post(`/civic/road-hazards/${id}/confirm`);setReports(p=>p.map(r=>r.id===id?{...r,confirmations:(r.confirmations||0)+1}:r));toast.success("Confirmed");}catch{}}

  const filtered=reports.filter(r=>filter==="All"||r.type===filter||r.severity===filter);
  const inp={width:"100%",background:BG3,border:`1px solid ${BORDER}`,borderRadius:"10px",color:"#f0ede8",padding:"11px 14px",fontSize:"14px",outline:"none",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",marginBottom:"10px"};

  return (
    <div style={{background:BG,minHeight:"100vh",color:"#f0ede8",fontFamily:"'DM Sans',sans-serif"}}>
      <Navbar/>
      <div style={{maxWidth:"680px",margin:"0 auto",padding:"80px 1rem 2rem"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
          <div><div style={{fontFamily:"'Syne',sans-serif",fontSize:"22px",fontWeight:"800"}}>⚠️ Road Hazards</div><div style={{fontSize:"12px",color:"#6b6760"}}>{reports.length} active reports · Rustenburg</div></div>
          <button onClick={()=>setShowForm(s=>!s)} style={{background:"#ef4444",border:"none",borderRadius:"10px",padding:"10px 14px",color:"white",fontWeight:"800",fontSize:"13px",cursor:"pointer"}}>🚨 Report</button>
        </div>

        {/* Stats bar */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"8px",marginBottom:"1rem"}}>
          {["Critical","High","Medium","Low"].map(sev=>{
            const count=reports.filter(r=>r.severity===sev).length;
            return <div key={sev} style={{background:BG2,border:`1px solid ${BORDER}`,borderRadius:"10px",padding:"10px",textAlign:"center"}}>
              <div style={{fontSize:"18px",fontWeight:"800",color:SEVERITY_COLORS[sev]}}>{count}</div>
              <div style={{fontSize:"9px",color:"#6b6760",textTransform:"uppercase"}}>{sev}</div>
            </div>;
          })}
        </div>

        {showForm&&(
          <div style={{background:BG2,border:"2px solid rgba(239,68,68,0.4)",borderRadius:"16px",padding:"1.25rem",marginBottom:"1rem"}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:"15px",fontWeight:"800",color:"#ef4444",marginBottom:"12px"}}>🚨 Report a Road Hazard</div>
            <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={inp}>{HAZARD_TYPES.map(t=><option key={t}>{t}</option>)}</select>
            <input value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} placeholder="Street address / intersection *" style={inp}/>
            <input value={form.suburb} onChange={e=>setForm(f=>({...f,suburb:e.target.value}))} placeholder="Suburb" style={inp}/>
            <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Describe the hazard *" rows={3} style={{...inp,resize:"none"}}/>
            <div style={{marginBottom:"12px"}}>
              <div style={{fontSize:"12px",color:"#6b6760",marginBottom:"8px"}}>Severity</div>
              <div style={{display:"flex",gap:"8px"}}>
                {["Low","Medium","High","Critical"].map(s=>(
                  <button key={s} onClick={()=>setForm(f=>({...f,severity:s}))} style={{flex:1,background:form.severity===s?`${SEVERITY_COLORS[s]}22`:"transparent",border:`2px solid ${form.severity===s?SEVERITY_COLORS[s]:BORDER}`,borderRadius:"8px",padding:"8px 4px",color:form.severity===s?SEVERITY_COLORS[s]:"#6b6760",fontSize:"11px",fontWeight:"700",cursor:"pointer"}}>{s}</button>
                ))}
              </div>
            </div>
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={report} disabled={saving} style={{flex:1,background:"#ef4444",border:"none",borderRadius:"10px",padding:"12px",color:"white",fontWeight:"800",cursor:"pointer"}}>{saving?"Submitting...":"Submit Report 🚨"}</button>
              <button onClick={()=>setShowForm(false)} style={{background:BG3,border:`1px solid ${BORDER}`,borderRadius:"10px",padding:"12px 18px",color:"#6b6760",cursor:"pointer"}}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{display:"flex",gap:"6px",overflowX:"auto",marginBottom:"1rem",paddingBottom:"4px"}}>
          {["All","Critical","High","Medium","Low",...HAZARD_TYPES].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{background:filter===f?"rgba(239,68,68,0.15)":BG2,border:`1px solid ${filter===f?"#ef4444":BORDER}`,borderRadius:"20px",padding:"5px 12px",color:filter===f?"#ef4444":"#6b6760",fontSize:"11px",fontWeight:"700",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>{f}</button>
          ))}
        </div>

        {loading?<div style={{textAlign:"center",padding:"3rem",color:"#6b6760"}}>Loading...</div>:filtered.length===0?(
          <div style={{textAlign:"center",padding:"4rem"}}><div style={{fontSize:"48px",marginBottom:"12px"}}>⚠️</div><div style={{fontFamily:"'Syne',sans-serif",fontSize:"18px",fontWeight:"700"}}>No reports</div><div style={{color:"#6b6760",marginTop:"8px"}}>Help keep Rustenburg safe — report a hazard</div></div>
        ):filtered.map(report=>(
          <div key={report.id} style={{background:BG2,border:`1px solid ${report.severity==="Critical"?"rgba(220,38,38,0.4)":report.severity==="High"?"rgba(239,68,68,0.3)":BORDER}`,borderRadius:"14px",padding:"14px 16px",marginBottom:"10px",borderLeft:`3px solid ${SEVERITY_COLORS[report.severity]||G}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"6px"}}>
              <div>
                <div style={{display:"flex",gap:"8px",alignItems:"center",marginBottom:"4px"}}>
                  <span style={{fontSize:"13px",fontWeight:"700",color:SEVERITY_COLORS[report.severity]||G}}>{report.type}</span>
                  <span style={{fontSize:"10px",fontWeight:"700",color:SEVERITY_COLORS[report.severity],background:`${SEVERITY_COLORS[report.severity]}22`,borderRadius:"4px",padding:"1px 6px"}}>{report.severity}</span>
                </div>
                <div style={{fontWeight:"600",fontSize:"14px",color:"#f0ede8"}}>{report.location}</div>
                <div style={{fontSize:"11px",color:"#6b6760"}}>📍 {report.suburb}</div>
              </div>
              <a href={`https://www.google.com/maps/search/${encodeURIComponent(report.location+" "+report.suburb+" Rustenburg")}`} target="_blank" rel="noreferrer" style={{background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.3)",borderRadius:"8px",padding:"6px 10px",color:"#3b82f6",fontSize:"11px",textDecoration:"none",fontWeight:"700"}}>🗺️ Map</a>
            </div>
            <div style={{fontSize:"12px",color:"#a8a49e",marginBottom:"10px"}}>{report.description}</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:"11px",color:"#6b6760"}}>{new Date(report.createdAt).toLocaleDateString("en-ZA",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</span>
              <button onClick={()=>confirm(report.id)} style={{background:"rgba(232,184,75,0.1)",border:`1px solid ${BORDER}`,borderRadius:"8px",padding:"6px 12px",color:G,fontSize:"11px",fontWeight:"700",cursor:"pointer"}}>👍 Confirm ({report.confirmations||0})</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

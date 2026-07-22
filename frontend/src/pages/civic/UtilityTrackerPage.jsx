// PROJO GROUP — Utility Outage Tracker
import React, { useState, useEffect } from "react";
import Navbar from "../../components/ui/Navbar";
import api from "../../services/api";
import toast from "react-hot-toast";

const G="#e8b84b"; const BG="#0a0a0a"; const BG2="#111111"; const BG3="#1a1a1a"; const BORDER="rgba(232,184,75,0.15)";
const TYPES={Power:{icon:"⚡",color:"#f59e0b"},Water:{icon:"💧",color:"#3b82f6"},Refuse:{icon:"🗑️",color:"#10b981"},Sewage:{icon:"🚨",color:"#ef4444"},Internet:{icon:"📶",color:"#a78bfa"}};

export default function UtilityTrackerPage() {
  const [reports, setReports]=useState([]); const [loading, setLoading]=useState(true);
  const [showForm, setShowForm]=useState(false);
  const [form, setForm]=useState({type:"Power",suburb:"",description:"",estimatedDuration:"Unknown"});
  const [saving, setSaving]=useState(false); const [filter, setFilter]=useState("All");
  const [confirmed, setConfirmed]=useState({});

  useEffect(()=>{loadReports();},[]);
  async function loadReports(){setLoading(true);try{const d=await api.get("/civic/utility-tracker");setReports(d.reports||[]);}catch{}setLoading(false);}
  async function report(){
    if(!form.suburb.trim())return toast.error("Suburb required");
    setSaving(true);
    try{const d=await api.post("/civic/utility-tracker",form);setReports(p=>[d.report,...p]);setShowForm(false);setForm({type:"Power",suburb:"",description:"",estimatedDuration:"Unknown"});toast.success("Outage reported ✓");}
    catch{toast.error("Could not report");}
    setSaving(false);
  }
  async function stillOut(id){try{await api.post(`/civic/utility-tracker/${id}/still-out`);setReports(p=>p.map(r=>r.id===id?{...r,stillOutCount:(r.stillOutCount||0)+1}:r));setConfirmed(p=>({...p,[id]:true}));toast.success("Logged — still out");}catch{}}

  const filtered=reports.filter(r=>filter==="All"||r.type===filter);
  const inp={width:"100%",background:BG3,border:`1px solid ${BORDER}`,borderRadius:"10px",color:"#f0ede8",padding:"11px 14px",fontSize:"14px",outline:"none",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",marginBottom:"10px"};

  // Count by type
  const typeCounts=Object.keys(TYPES).reduce((acc,t)=>({...acc,[t]:reports.filter(r=>r.type===t&&r.status!=="RESOLVED").length}),{});

  return (
    <div style={{background:BG,minHeight:"100vh",color:"#f0ede8",fontFamily:"'DM Sans',sans-serif"}}>
      <Navbar/>
      <div style={{maxWidth:"680px",margin:"0 auto",padding:"80px 1rem 2rem"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
          <div><div style={{fontFamily:"'Syne',sans-serif",fontSize:"22px",fontWeight:"800"}}>💡 Utility Tracker</div><div style={{fontSize:"12px",color:"#6b6760"}}>Crowd-sourced outage reports · Rustenburg</div></div>
          <button onClick={()=>setShowForm(s=>!s)} style={{background:G,border:"none",borderRadius:"10px",padding:"10px 14px",color:BG,fontWeight:"800",fontSize:"13px",cursor:"pointer"}}>+ Report</button>
        </div>

        {/* Utility type overview */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"8px",marginBottom:"1.25rem"}}>
          {Object.entries(TYPES).map(([type,{icon,color}])=>(
            <div key={type} onClick={()=>setFilter(filter===type?"All":type)} style={{background:filter===type?`${color}22`:BG2,border:`1px solid ${filter===type?color:BORDER}`,borderRadius:"12px",padding:"10px",textAlign:"center",cursor:"pointer"}}>
              <div style={{fontSize:"22px"}}>{icon}</div>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:"16px",fontWeight:"800",color:typeCounts[type]>0?"#ef4444":color}}>{typeCounts[type]||0}</div>
              <div style={{fontSize:"9px",color:"#6b6760"}}>{type}</div>
            </div>
          ))}
        </div>

        {showForm&&(
          <div style={{background:BG2,border:`1px solid ${BORDER}`,borderRadius:"16px",padding:"1.25rem",marginBottom:"1rem"}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:"15px",fontWeight:"800",color:G,marginBottom:"12px"}}>Report an Outage</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"6px",marginBottom:"12px"}}>
              {Object.entries(TYPES).map(([type,{icon,color}])=>(
                <button key={type} onClick={()=>setForm(f=>({...f,type}))} style={{background:form.type===type?`${color}22`:"transparent",border:`2px solid ${form.type===type?color:BORDER}`,borderRadius:"10px",padding:"8px 4px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"2px"}}>
                  <span style={{fontSize:"20px"}}>{icon}</span><span style={{fontSize:"9px",color:form.type===type?color:"#6b6760",fontWeight:"700"}}>{type}</span>
                </button>
              ))}
            </div>
            <input value={form.suburb} onChange={e=>setForm(f=>({...f,suburb:e.target.value}))} placeholder="Suburb / area *" style={inp}/>
            <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Description (optional)" rows={2} style={{...inp,resize:"none"}}/>
            <select value={form.estimatedDuration} onChange={e=>setForm(f=>({...f,estimatedDuration:e.target.value}))} style={inp}>
              {["Unknown","Less than 1 hour","1-2 hours","2-4 hours","4-8 hours","More than 8 hours"].map(d=><option key={d}>{d}</option>)}
            </select>
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={report} disabled={saving} style={{flex:1,background:G,border:"none",borderRadius:"10px",padding:"12px",color:BG,fontWeight:"800",cursor:"pointer"}}>{saving?"Reporting...":"Submit Report"}</button>
              <button onClick={()=>setShowForm(false)} style={{background:BG3,border:`1px solid ${BORDER}`,borderRadius:"10px",padding:"12px 18px",color:"#6b6760",cursor:"pointer"}}>Cancel</button>
            </div>
          </div>
        )}

        {loading?<div style={{textAlign:"center",padding:"3rem",color:"#6b6760"}}>Loading...</div>:filtered.length===0?(
          <div style={{textAlign:"center",padding:"4rem"}}><div style={{fontSize:"48px",marginBottom:"12px"}}>💡</div><div style={{fontFamily:"'Syne',sans-serif",fontSize:"18px",fontWeight:"700"}}>No outages reported</div><div style={{color:"#6b6760",marginTop:"8px"}}>All utilities appear to be running normally</div></div>
        ):filtered.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(report=>{
          const typeInfo=TYPES[report.type]||{icon:"⚡",color:G};
          return (
            <div key={report.id} style={{background:BG2,border:`1px solid ${report.status==="RESOLVED"?"rgba(74,222,128,0.3)":BORDER}`,borderRadius:"14px",padding:"14px 16px",marginBottom:"10px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"8px"}}>
                <div style={{display:"flex",gap:"10px",alignItems:"center"}}>
                  <span style={{fontSize:"28px"}}>{typeInfo.icon}</span>
                  <div>
                    <div style={{fontWeight:"700",fontSize:"15px",color:report.status==="RESOLVED"?"#4ade80":"#f0ede8"}}>{report.type} Outage</div>
                    <div style={{fontSize:"13px",color:typeInfo.color,fontWeight:"700"}}>📍 {report.suburb}</div>
                  </div>
                </div>
                <span style={{fontSize:"10px",fontWeight:"700",color:report.status==="RESOLVED"?"#4ade80":"#ef4444",background:report.status==="RESOLVED"?"rgba(74,222,128,0.1)":"rgba(239,68,68,0.1)",borderRadius:"6px",padding:"3px 8px"}}>{report.status==="RESOLVED"?"✓ RESOLVED":"ACTIVE"}</span>
              </div>
              {report.description&&<div style={{fontSize:"12px",color:"#a8a49e",marginBottom:"8px"}}>{report.description}</div>}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:"11px"}}>
                <div style={{color:"#6b6760"}}>
                  <span>{new Date(report.createdAt).toLocaleDateString("en-ZA",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</span>
                  {report.estimatedDuration&&report.estimatedDuration!=="Unknown"&&<span> · Est. {report.estimatedDuration}</span>}
                  <span> · 👥 {(report.stillOutCount||0)+1} reporting</span>
                </div>
                {report.status!=="RESOLVED"&&(
                  <button onClick={()=>stillOut(report.id)} disabled={confirmed[report.id]} style={{background:confirmed[report.id]?"rgba(74,222,128,0.1)":"rgba(232,184,75,0.1)",border:`1px solid ${confirmed[report.id]?"rgba(74,222,128,0.3)":BORDER}`,borderRadius:"8px",padding:"5px 10px",color:confirmed[report.id]?"#4ade80":G,fontSize:"11px",fontWeight:"700",cursor:confirmed[report.id]?"default":"pointer"}}>
                    {confirmed[report.id]?"✓ Confirmed":"Still Out?"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

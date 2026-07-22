// PROJO GROUP — Municipal Accountability Scorecard (public page)
import React, { useState, useEffect } from "react";
import Navbar from "../../components/ui/Navbar";
import api from "../../services/api";
import { useParams } from "react-router-dom";

const G="#e8b84b"; const BG="#0a0a0a"; const BG2="#111111"; const BG3="#1a1a1a"; const BORDER="rgba(232,184,75,0.15)";

function scoreColor(s){ if(s>=75)return "#4ade80"; if(s>=50)return "#e8b84b"; if(s>=25)return "#f59e0b"; return "#ef4444"; }
function scoreLabel(s){ if(s>=75)return "Good"; if(s>=50)return "Fair"; if(s>=25)return "Poor"; return "Critical"; }

export default function MunicipalScorecard() {
  const { municipalityId } = useParams();
  const [municipalities, setMunicipalities]=useState([]); const [selected, setSelected]=useState(null);
  const [loading, setLoading]=useState(true);

  useEffect(()=>{ loadMunicipalities(); },[]);
  async function loadMunicipalities(){
    setLoading(true);
    try{
      const d=await api.get("/civic/municipalities");
      setMunicipalities(d.municipalities||[]);
      if(municipalityId) setSelected(d.municipalities?.find(m=>m.id===municipalityId)||null);
    }catch{}
    setLoading(false);
  }

  const metrics=[
    {key:"powerScore",label:"⚡ Power Supply"},
    {key:"waterScore",label:"💧 Water Supply"},
    {key:"refuseScore",label:"🗑️ Refuse Collection"},
    {key:"roadsScore",label:"🛣️ Roads Maintenance"},
    {key:"sanitationScore",label:"🚽 Sanitation"},
  ];

  if(selected) return (
    <div style={{background:BG,minHeight:"100vh",color:"#f0ede8",fontFamily:"'DM Sans',sans-serif"}}>
      <Navbar/>
      <div style={{maxWidth:"680px",margin:"0 auto",padding:"80px 1rem 2rem"}}>
        <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:G,fontSize:"14px",cursor:"pointer",marginBottom:"1rem"}}>← All Municipalities</button>
        <div style={{background:BG2,border:`1px solid ${BORDER}`,borderRadius:"20px",padding:"1.5rem",marginBottom:"1rem"}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:"22px",fontWeight:"800",color:"#f0ede8",marginBottom:"4px"}}>{selected.name}</div>
          <div style={{fontSize:"13px",color:"#6b6760",marginBottom:"1.5rem"}}>{selected.province} · Data from community reports</div>
          <div style={{display:"flex",alignItems:"center",gap:"16px",marginBottom:"1.5rem"}}>
            <div style={{width:"80px",height:"80px",borderRadius:"50%",background:`${scoreColor(selected.overallScore||0)}22`,border:`4px solid ${scoreColor(selected.overallScore||0)}`,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:"22px",fontWeight:"800",color:scoreColor(selected.overallScore||0)}}>{selected.overallScore||0}</div>
              <div style={{fontSize:"9px",color:"#6b6760"}}>/100</div>
            </div>
            <div>
              <div style={{fontSize:"20px",fontWeight:"700",color:scoreColor(selected.overallScore||0)}}>{scoreLabel(selected.overallScore||0)}</div>
              <div style={{fontSize:"12px",color:"#6b6760"}}>Overall performance</div>
            </div>
          </div>
          {metrics.map(({key,label})=>{
            const score=selected[key]||0;
            return (
              <div key={key} style={{marginBottom:"12px"}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:"13px",marginBottom:"4px"}}>
                  <span style={{color:"#f0ede8"}}>{label}</span>
                  <span style={{color:scoreColor(score),fontWeight:"700"}}>{score}/100</span>
                </div>
                <div style={{background:BG3,borderRadius:"8px",height:"8px"}}>
                  <div style={{background:scoreColor(score),height:"100%",borderRadius:"8px",width:`${score}%`,transition:"width 1s"}}/>
                </div>
              </div>
            );
          })}
          <div style={{marginTop:"1rem",padding:"12px",background:BG3,borderRadius:"10px",fontSize:"11px",color:"#6b6760",lineHeight:1.6}}>
            📊 Scores are calculated from crowd-sourced outage reports and community feedback. Higher report frequency indicates worse service.
            Last updated: {selected.updatedAt?new Date(selected.updatedAt).toLocaleDateString("en-ZA",{day:"2-digit",month:"short",year:"numeric"}):"N/A"}
          </div>
        </div>
        <a href="https://www.cogta.gov.za" target="_blank" rel="noreferrer" style={{display:"block",textAlign:"center",background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.3)",borderRadius:"12px",padding:"12px",color:"#3b82f6",textDecoration:"none",fontSize:"13px",fontWeight:"700"}}>
          📋 Submit formal complaint to COGTA →
        </a>
      </div>
    </div>
  );

  return (
    <div style={{background:BG,minHeight:"100vh",color:"#f0ede8",fontFamily:"'DM Sans',sans-serif"}}>
      <Navbar/>
      <div style={{maxWidth:"680px",margin:"0 auto",padding:"80px 1rem 2rem"}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:"22px",fontWeight:"800",marginBottom:"4px"}}>🏛️ Municipal Scorecard</div>
        <div style={{fontSize:"12px",color:"#6b6760",marginBottom:"1.25rem"}}>Accountability driven by community data</div>
        <div style={{background:"rgba(232,184,75,0.05)",border:`1px solid ${BORDER}`,borderRadius:"12px",padding:"12px 14px",marginBottom:"1.25rem",fontSize:"12px",color:"#a8a49e",lineHeight:1.6}}>
          📊 Scores are calculated from crowd-reported outages and community feedback via the Utility Tracker. This data holds municipalities accountable using real community experience.
        </div>
        {loading?<div style={{textAlign:"center",padding:"3rem",color:"#6b6760"}}>Loading...</div>:municipalities.length===0?(
          <div style={{textAlign:"center",padding:"4rem"}}><div style={{fontSize:"48px",marginBottom:"12px"}}>🏛️</div><div style={{fontFamily:"'Syne',sans-serif",fontSize:"18px",fontWeight:"700"}}>No scorecards yet</div><div style={{color:"#6b6760",marginTop:"8px"}}>Scorecards populate automatically as outages are reported</div></div>
        ):municipalities.map(mun=>{
          const score=mun.overallScore||0;
          return (
            <div key={mun.id} onClick={()=>setSelected(mun)} style={{background:BG2,border:`1px solid ${BORDER}`,borderRadius:"16px",padding:"16px",marginBottom:"12px",cursor:"pointer"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=G}
              onMouseLeave={e=>e.currentTarget.style.borderColor=BORDER}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
                <div>
                  <div style={{fontWeight:"700",fontSize:"16px",color:"#f0ede8"}}>{mun.name}</div>
                  <div style={{fontSize:"12px",color:"#6b6760"}}>{mun.province}</div>
                </div>
                <div style={{textAlign:"center"}}>
                  <div style={{fontFamily:"'Syne',sans-serif",fontSize:"24px",fontWeight:"800",color:scoreColor(score)}}>{score}</div>
                  <div style={{fontSize:"10px",color:scoreColor(score),fontWeight:"700"}}>{scoreLabel(score)}</div>
                </div>
              </div>
              <div style={{background:BG3,borderRadius:"8px",height:"6px"}}>
                <div style={{background:scoreColor(score),height:"100%",borderRadius:"8px",width:`${score}%`,transition:"width 0.8s"}}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

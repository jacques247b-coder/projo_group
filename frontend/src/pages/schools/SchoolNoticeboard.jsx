// PROJO GROUP — Individual School Noticeboard
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/ui/Navbar";
import api from "../../services/api";
import toast from "react-hot-toast";

const G="#e8b84b"; const BG="#0a0a0a"; const BG2="#111111"; const BG3="#1a1a1a"; const BORDER="rgba(232,184,75,0.15)";
const NOTICE_COLORS={General:"#e8b84b",Event:"#3b82f6",Emergency:"#ef4444",Newsletter:"#10b981",Sport:"#f59e0b",LostFound:"#a78bfa",Closure:"#ef4444",Exam:"#f59e0b"};
const NOTICE_ICONS={General:"📢",Event:"🎉",Emergency:"🚨",Newsletter:"📰",Sport:"⚽",LostFound:"🔍",Closure:"🚫",Exam:"📝"};
const NOTICE_TYPES=["All","General","Event","Emergency","Newsletter","Sport","LostFound","Closure","Exam"];

export default function SchoolNoticeboard() {
  const { id } = useParams();
  const nav    = useNavigate();
  const [school, setSchool]   = useState(null);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("All");
  const [selected, setSelected]     = useState(null);

  useEffect(()=>{ loadAll(); },[id]);
  useEffect(()=>{ if(school) loadNotices(); },[typeFilter]);

  async function loadAll(){
    setLoading(true);
    try{
      const [sd, nd] = await Promise.all([
        api.get(`/schools/${id}`),
        api.get(`/schools/${id}/notices`)
      ]);
      setSchool(sd.school);
      setNotices(nd.notices||[]);
    }catch{ toast.error("Could not load school"); }
    setLoading(false);
  }

  async function loadNotices(){
    try{ const d=await api.get(`/schools/${id}/notices?type=${typeFilter}`); setNotices(d.notices||[]); }catch{}
  }

  async function toggleFollow(){
    try{
      const d=await api.post(`/schools/${id}/follow`);
      setSchool(s=>({...s,following:d.following,followerCount:(s.followerCount||0)+(d.following?1:-1)}));
      toast.success(d.following?`Following ${school.name}!`:`Unfollowed`);
    }catch{}
  }

  if(loading) return (
    <div style={{background:BG,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <Navbar/><div style={{color:"#6b6760"}}>Loading...</div>
    </div>
  );

  if(!school) return (
    <div style={{background:BG,minHeight:"100vh",color:"#f0ede8",fontFamily:"'DM Sans',sans-serif"}}>
      <Navbar/><div style={{textAlign:"center",padding:"4rem"}}>School not found</div>
    </div>
  );

  const pinned = notices.filter(n=>n.pinned);
  const rest   = notices.filter(n=>!n.pinned);

  // NOTICE DETAIL
  if(selected) return (
    <div style={{background:BG,minHeight:"100vh",color:"#f0ede8",fontFamily:"'DM Sans',sans-serif"}}>
      <Navbar/>
      <div style={{maxWidth:"680px",margin:"0 auto",padding:"80px 1rem 2rem"}}>
        <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:G,fontSize:"14px",cursor:"pointer",marginBottom:"1rem"}}>← {school.name}</button>
        <div style={{background:BG2,border:`1px solid ${selected.urgent?"rgba(239,68,68,0.4)":BORDER}`,borderRadius:"20px",padding:"1.5rem"}}>
          <div style={{display:"flex",gap:"8px",alignItems:"center",marginBottom:"12px"}}>
            <span style={{fontSize:"24px"}}>{NOTICE_ICONS[selected.type]||"📢"}</span>
            <span style={{fontSize:"12px",fontWeight:"700",color:NOTICE_COLORS[selected.type]||G,background:`${NOTICE_COLORS[selected.type]||G}22`,borderRadius:"6px",padding:"3px 10px"}}>{selected.type}</span>
            {selected.urgent&&<span style={{fontSize:"11px",fontWeight:"700",color:"#ef4444",background:"rgba(239,68,68,0.1)",borderRadius:"6px",padding:"3px 8px"}}>🚨 URGENT</span>}
            {selected.pinned&&<span style={{fontSize:"11px",color:G}}>📌 Pinned</span>}
          </div>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:"22px",fontWeight:"800",color:"#f0ede8",marginBottom:"8px"}}>{selected.title}</div>
          <div style={{fontSize:"12px",color:"#6b6760",marginBottom:"1.5rem"}}>{new Date(selected.createdAt).toLocaleDateString("en-ZA",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
          {(selected.eventDate||selected.eventVenue)&&(
            <div style={{background:BG3,borderRadius:"12px",padding:"12px 14px",marginBottom:"1rem"}}>
              {selected.eventDate&&<div style={{fontSize:"13px",color:"#3b82f6",fontWeight:"700",marginBottom:"4px"}}>📅 {new Date(selected.eventDate).toLocaleDateString("en-ZA",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}{selected.eventTime?` · ${selected.eventTime}`:""}</div>}
              {selected.eventVenue&&<div style={{fontSize:"13px",color:"#a8a49e"}}>📍 {selected.eventVenue}</div>}
            </div>
          )}
          <div style={{fontSize:"15px",color:"#d4c9b8",lineHeight:1.8,whiteSpace:"pre-wrap"}}>{selected.body}</div>
          {selected.attachmentUrl&&(
            <a href={selected.attachmentUrl} target="_blank" rel="noreferrer" style={{display:"block",marginTop:"1rem",background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.3)",borderRadius:"10px",padding:"12px",textAlign:"center",color:"#3b82f6",textDecoration:"none",fontWeight:"700",fontSize:"13px"}}>
              📎 View Attachment / PDF
            </a>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{background:BG,minHeight:"100vh",color:"#f0ede8",fontFamily:"'DM Sans',sans-serif"}}>
      <Navbar/>
      <div style={{maxWidth:"680px",margin:"0 auto",padding:"80px 1rem 2rem"}}>
        {/* School header */}
        <button onClick={()=>nav("/schools")} style={{background:"none",border:"none",color:G,fontSize:"13px",cursor:"pointer",marginBottom:"1rem"}}>← Schools Hub</button>
        <div style={{background:BG2,border:`1px solid ${BORDER}`,borderRadius:"20px",padding:"1.25rem",marginBottom:"1.25rem"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{display:"flex",gap:"12px",alignItems:"center"}}>
              <div style={{width:"56px",height:"56px",borderRadius:"14px",background:"rgba(232,184,75,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"28px",flexShrink:0}}>
                {school.logoUrl?<img src={school.logoUrl} style={{width:"100%",height:"100%",borderRadius:"14px",objectFit:"cover"}} alt=""/>:"🏫"}
              </div>
              <div>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:"18px",fontWeight:"800",color:"#f0ede8"}}>{school.name}</div>
                <div style={{fontSize:"12px",color:G}}>{school.type} School · {school.suburb}</div>
                {school.principalName&&<div style={{fontSize:"11px",color:"#6b6760"}}>Principal: {school.principalName}</div>}
              </div>
            </div>
            <button onClick={toggleFollow} style={{background:school.following?"rgba(232,184,75,0.15)":"transparent",border:`2px solid ${school.following?G:BORDER}`,borderRadius:"20px",padding:"8px 16px",color:school.following?G:"#6b6760",fontSize:"12px",fontWeight:"700",cursor:"pointer",flexShrink:0}}>
              {school.following?"✓ Following":"+ Follow"}
            </button>
          </div>
          <div style={{display:"flex",gap:"16px",marginTop:"12px",fontSize:"12px",color:"#6b6760"}}>
            {school.phone&&<a href={`tel:${school.phone}`} style={{color:"#4ade80",textDecoration:"none"}}>📞 {school.phone}</a>}
            {school.email&&<a href={`mailto:${school.email}`} style={{color:"#3b82f6",textDecoration:"none"}}>✉️ Email</a>}
            {school.website&&<a href={school.website} target="_blank" rel="noreferrer" style={{color:G,textDecoration:"none"}}>🌐 Website</a>}
          </div>
          <div style={{fontSize:"11px",color:"#4a3030",marginTop:"8px"}}>👥 {school.followerCount||0} followers · 📢 {notices.length} notices</div>
        </div>

        {/* Type filter */}
        <div style={{display:"flex",gap:"6px",overflowX:"auto",marginBottom:"1rem",paddingBottom:"4px"}}>
          {NOTICE_TYPES.map(t=><button key={t} onClick={()=>setTypeFilter(t)} style={{background:typeFilter===t?`${NOTICE_COLORS[t]||G}22`:BG2,border:`1px solid ${typeFilter===t?NOTICE_COLORS[t]||G:BORDER}`,borderRadius:"20px",padding:"5px 12px",color:typeFilter===t?NOTICE_COLORS[t]||G:"#6b6760",fontSize:"11px",fontWeight:"700",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>{NOTICE_ICONS[t]||""} {t}</button>)}
        </div>

        {/* Notices */}
        {notices.length===0?(
          <div style={{textAlign:"center",padding:"4rem"}}>
            <div style={{fontSize:"48px",marginBottom:"12px"}}>📢</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:"18px",fontWeight:"700"}}>No notices yet</div>
            <div style={{color:"#6b6760",marginTop:"8px"}}>This school hasn't posted any notices yet</div>
          </div>
        ):(
          <>
            {pinned.length>0&&<>
              <div style={{fontSize:"11px",color:G,fontWeight:"700",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>📌 Pinned</div>
              {pinned.map(n=><NoticeCard key={n.id} notice={n} onClick={()=>setSelected(n)}/>)}
              {rest.length>0&&<div style={{fontSize:"11px",color:"#6b6760",fontWeight:"700",textTransform:"uppercase",letterSpacing:"1px",margin:"12px 0 8px"}}>Latest</div>}
            </>}
            {rest.map(n=><NoticeCard key={n.id} notice={n} onClick={()=>setSelected(n)}/>)}
          </>
        )}
      </div>
    </div>
  );
}

function NoticeCard({ notice, onClick }) {
  const BG2="#111111"; const BORDER="rgba(232,184,75,0.15)";
  return (
    <div onClick={onClick} style={{background:BG2,border:`1px solid ${notice.urgent?"rgba(239,68,68,0.35)":BORDER}`,borderRadius:"14px",padding:"14px 16px",marginBottom:"10px",cursor:"pointer",borderLeft:`3px solid ${NOTICE_COLORS[notice.type]||"#e8b84b"}`}}
      onMouseEnter={e=>e.currentTarget.style.borderLeftColor="#e8b84b"}
      onMouseLeave={e=>e.currentTarget.style.borderLeftColor=NOTICE_COLORS[notice.type]||"#e8b84b"}>
      <div style={{display:"flex",gap:"8px",alignItems:"center",marginBottom:"6px"}}>
        <span style={{fontSize:"16px"}}>{NOTICE_ICONS[notice.type]||"📢"}</span>
        <span style={{fontSize:"10px",fontWeight:"700",color:NOTICE_COLORS[notice.type]||"#e8b84b"}}>{notice.type}</span>
        {notice.urgent&&<span style={{fontSize:"10px",fontWeight:"700",color:"#ef4444",background:"rgba(239,68,68,0.1)",borderRadius:"4px",padding:"1px 6px"}}>🚨 URGENT</span>}
        {notice.pinned&&<span style={{fontSize:"10px",color:"#e8b84b"}}>📌</span>}
      </div>
      <div style={{fontWeight:"700",fontSize:"15px",color:"#f0ede8",marginBottom:"4px"}}>{notice.title}</div>
      {notice.body&&<div style={{fontSize:"12px",color:"#a8a49e",lineHeight:1.5,marginBottom:"6px"}}>{notice.body.slice(0,100)}{notice.body.length>100?"...":""}</div>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:"11px",color:"#4a3030"}}>{new Date(notice.createdAt).toLocaleDateString("en-ZA",{day:"2-digit",month:"short",year:"numeric"})}</div>
        {notice.eventDate&&<div style={{fontSize:"11px",color:"#3b82f6"}}>📅 {new Date(notice.eventDate).toLocaleDateString("en-ZA",{day:"2-digit",month:"short"})}</div>}
        {notice.attachmentUrl&&<div style={{fontSize:"10px",color:"#6b6760"}}>📎 Attachment</div>}
      </div>
    </div>
  );
}

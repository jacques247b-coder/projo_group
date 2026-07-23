// PROJO GROUP — Schools Hub (inside PROJO app, under Community)
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/ui/Navbar";
import api from "../../services/api";
import toast from "react-hot-toast";

const G="#e8b84b"; const BG="#0a0a0a"; const BG2="#111111"; const BG3="#1a1a1a"; const BORDER="rgba(232,184,75,0.15)";
const TYPES=["All","Primary","Secondary","Combined","Private"];
const TYPE_ICONS={Primary:"🏫",Secondary:"🎓",Combined:"🏛️",Private:"⭐"};

export default function SchoolsHubPage() {
  const nav = useNavigate();
  const [schools, setSchools]   = useState([]);
  const [feed, setFeed]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState("discover");
  const [search, setSearch]     = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  useEffect(()=>{ loadData(); },[]);
  async function loadData(){
    setLoading(true);
    try{
      const [sd, fd] = await Promise.all([
        api.get("/schools"),
        api.get("/schools/feed/mine")
      ]);
      setSchools(sd.schools||[]);
      setFeed(fd.notices||[]);
    }catch{ toast.error("Could not load schools"); }
    setLoading(false);
  }

  async function toggleFollow(school, e){
    e.stopPropagation();
    try{
      const d = await api.post(`/schools/${school.id}/follow`);
      setSchools(p=>p.map(s=>s.id===school.id?{...s,following:d.following,followerCount:s.followerCount+(d.following?1:-1)}:s));
      toast.success(d.following?`Following ${school.name}!`:`Unfollowed ${school.name}`);
      if(d.following) loadData();
    }catch{}
  }

  const filtered = schools
    .filter(s=>typeFilter==="All"||s.type===typeFilter)
    .filter(s=>!search||s.name.toLowerCase().includes(search.toLowerCase())||s.suburb.toLowerCase().includes(search.toLowerCase()));

  const NOTICE_COLORS={General:"#e8b84b",Event:"#3b82f6",Emergency:"#ef4444",Newsletter:"#10b981",Sport:"#f59e0b",LostFound:"#a78bfa",Closure:"#ef4444",Exam:"#f59e0b"};
  const NOTICE_ICONS={General:"📢",Event:"🎉",Emergency:"🚨",Newsletter:"📰",Sport:"⚽",LostFound:"🔍",Closure:"🚫",Exam:"📝"};

  const inp={width:"100%",background:BG3,border:`1px solid ${BORDER}`,borderRadius:"10px",color:"#f0ede8",padding:"11px 14px",fontSize:"14px",outline:"none",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box"};

  return (
    <div style={{background:BG,minHeight:"100vh",color:"#f0ede8",fontFamily:"'DM Sans',sans-serif"}}>
      <Navbar/>
      <div style={{maxWidth:"680px",margin:"0 auto",padding:"80px 1rem 2rem"}}>

        {/* Header */}
        <div style={{marginBottom:"1.25rem"}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:"24px",fontWeight:"800"}}>🏫 Schools Hub</div>
          <div style={{fontSize:"12px",color:"#6b6760"}}>Follow your school · Stay informed · Share lifts</div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:"8px",marginBottom:"1.25rem"}}>
          {[["discover","🔍 Schools"],["feed","📰 My Feed"],["carpool","🚗 School Lifts"]].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{flex:1,background:tab===k?"rgba(232,184,75,0.15)":BG2,border:`1px solid ${tab===k?G:BORDER}`,borderRadius:"10px",padding:"10px 6px",color:tab===k?G:"#6b6760",fontSize:"12px",fontWeight:"700",cursor:"pointer"}}>{l}</button>
          ))}
        </div>

        {/* DISCOVER TAB */}
        {tab==="discover"&&(<>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search schools..." style={{...inp,marginBottom:"10px"}}/>
          <div style={{display:"flex",gap:"6px",overflowX:"auto",marginBottom:"1rem",paddingBottom:"4px"}}>
            {TYPES.map(t=><button key={t} onClick={()=>setTypeFilter(t)} style={{background:typeFilter===t?"rgba(232,184,75,0.15)":BG2,border:`1px solid ${typeFilter===t?G:BORDER}`,borderRadius:"20px",padding:"5px 12px",color:typeFilter===t?G:"#6b6760",fontSize:"11px",fontWeight:"700",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>{t}</button>)}
          </div>
          {loading?<div style={{textAlign:"center",padding:"3rem",color:"#6b6760"}}>Loading...</div>:
           filtered.length===0?<div style={{textAlign:"center",padding:"4rem"}}><div style={{fontSize:"48px",marginBottom:"12px"}}>🏫</div><div style={{fontFamily:"'Syne',sans-serif",fontSize:"18px",fontWeight:"700"}}>No schools found</div><div style={{color:"#6b6760",marginTop:"8px"}}>Schools join via the PROJO Schools App</div></div>:
           filtered.map(school=>(
            <div key={school.id} onClick={()=>nav(`/schools/${school.id}`)} style={{background:BG2,border:`1px solid ${school.following?G:BORDER}`,borderRadius:"16px",padding:"14px 16px",marginBottom:"10px",cursor:"pointer",transition:"border-color 0.2s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=G}
              onMouseLeave={e=>e.currentTarget.style.borderColor=school.following?G:BORDER}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{display:"flex",gap:"12px",alignItems:"center"}}>
                  <div style={{width:"48px",height:"48px",borderRadius:"12px",background:"rgba(232,184,75,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px",flexShrink:0}}>{school.logoUrl?<img src={school.logoUrl} style={{width:"100%",height:"100%",borderRadius:"12px",objectFit:"cover"}} alt=""/>:TYPE_ICONS[school.type]||"🏫"}</div>
                  <div>
                    <div style={{fontWeight:"700",fontSize:"15px",color:"#f0ede8"}}>{school.name}</div>
                    <div style={{fontSize:"12px",color:G}}>{school.type} School · {school.suburb}</div>
                    <div style={{fontSize:"11px",color:"#6b6760",marginTop:"2px"}}>📢 {school.noticeCount||0} notices · 👥 {school.followerCount||0} following</div>
                  </div>
                </div>
                <button onClick={e=>toggleFollow(school,e)} style={{background:school.following?"rgba(232,184,75,0.15)":"transparent",border:`2px solid ${school.following?G:BORDER}`,borderRadius:"20px",padding:"6px 14px",color:school.following?G:"#6b6760",fontSize:"11px",fontWeight:"700",cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>
                  {school.following?"✓ Following":"+ Follow"}
                </button>
              </div>
            </div>
          ))}
          {/* Register CTA */}
          <div style={{background:"rgba(59,130,246,0.05)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:"16px",padding:"16px",marginTop:"1rem",textAlign:"center"}}>
            <div style={{fontSize:"20px",marginBottom:"8px"}}>📱</div>
            <div style={{fontWeight:"700",color:"#3b82f6",marginBottom:"4px"}}>Is your school not listed?</div>
            <div style={{fontSize:"12px",color:"#6b6760",marginBottom:"12px"}}>Schools can register via the free PROJO Schools App and get verified within 24 hours.</div>
            <a href="https://schools.projogroup.co.za" target="_blank" rel="noreferrer" style={{display:"inline-block",background:"rgba(59,130,246,0.15)",border:"1px solid rgba(59,130,246,0.4)",borderRadius:"10px",padding:"10px 20px",color:"#3b82f6",textDecoration:"none",fontSize:"13px",fontWeight:"700"}}>Register Your School →</a>
          </div>
        </>)}

        {/* MY FEED TAB */}
        {tab==="feed"&&(
          loading?<div style={{textAlign:"center",padding:"3rem",color:"#6b6760"}}>Loading...</div>:
          feed.length===0?(
            <div style={{textAlign:"center",padding:"4rem"}}>
              <div style={{fontSize:"48px",marginBottom:"12px"}}>📰</div>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:"18px",fontWeight:"700"}}>No notices yet</div>
              <div style={{color:"#6b6760",marginTop:"8px"}}>Follow schools in the Schools tab to see their notices here</div>
              <button onClick={()=>setTab("discover")} style={{background:G,border:"none",borderRadius:"10px",padding:"12px 24px",color:BG,fontWeight:"800",fontSize:"14px",cursor:"pointer",marginTop:"16px"}}>Browse Schools</button>
            </div>
          ):feed.map(notice=>(
            <div key={notice.id} onClick={()=>nav(`/schools/${notice.schoolId}`)} style={{background:BG2,border:`1px solid ${notice.urgent?"rgba(239,68,68,0.4)":BORDER}`,borderRadius:"14px",padding:"14px 16px",marginBottom:"10px",cursor:"pointer",borderLeft:`3px solid ${NOTICE_COLORS[notice.type]||G}`}}>
              <div style={{display:"flex",gap:"8px",alignItems:"center",marginBottom:"6px"}}>
                <span style={{fontSize:"16px"}}>{NOTICE_ICONS[notice.type]||"📢"}</span>
                <span style={{fontSize:"11px",fontWeight:"700",color:NOTICE_COLORS[notice.type]||G}}>{notice.type}</span>
                {notice.urgent&&<span style={{fontSize:"10px",fontWeight:"700",color:"#ef4444",background:"rgba(239,68,68,0.1)",borderRadius:"4px",padding:"1px 6px"}}>🚨 URGENT</span>}
                <span style={{fontSize:"11px",color:G,marginLeft:"auto",fontWeight:"700"}}>{notice.school?.name}</span>
              </div>
              <div style={{fontWeight:"700",fontSize:"15px",color:"#f0ede8",marginBottom:"4px"}}>{notice.title}</div>
              <div style={{fontSize:"12px",color:"#a8a49e",marginBottom:"6px",lineHeight:1.5}}>{notice.body?.slice(0,100)}...</div>
              {notice.eventDate&&<div style={{fontSize:"11px",color:"#3b82f6"}}>📅 {new Date(notice.eventDate).toLocaleDateString("en-ZA",{weekday:"short",day:"2-digit",month:"short",year:"numeric"})}{notice.eventTime?` · ${notice.eventTime}`:""}</div>}
              <div style={{fontSize:"10px",color:"#4a3030",marginTop:"4px"}}>{new Date(notice.createdAt).toLocaleDateString("en-ZA",{day:"2-digit",month:"short",year:"numeric"})}</div>
            </div>
          ))
        )}

        {/* CARPOOL TAB */}
        {tab==="carpool"&&<SchoolCarpoolTab schools={schools}/>}
      </div>
    </div>
  );
}

function SchoolCarpoolTab({ schools }) {
  const [carpools, setCarpools] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selectedSchool, setSelectedSchool] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({suburb:"",morningTime:"07:00",afternoonTime:"14:00",daysAvailable:"Mon-Fri",seatsAvailable:3,phone:"",notes:""});
  const [saving, setSaving] = useState(false);
  const [interests, setInterests] = useState({});

  useEffect(()=>{ if(selectedSchool) loadCarpools(); },[selectedSchool]);
  async function loadCarpools(){ setLoading(true); try{ const d=await api.get(`/schools/${selectedSchool}/carpools`); setCarpools(d.carpools||[]); }catch{} setLoading(false); }

  async function post(){
    if(!selectedSchool) return toast.error("Select a school first");
    if(!form.suburb.trim()||!form.phone.trim()) return toast.error("Suburb and phone required");
    setSaving(true);
    try{ const d=await api.post(`/schools/${selectedSchool}/carpools`,form); setCarpools(p=>[d.carpool,...p]); setShowForm(false); toast.success("Carpool posted! 🚗"); }
    catch{ toast.error("Could not post"); }
    setSaving(false);
  }

  async function showInterest(carpoolId){
    const name=prompt("Your name?"); if(!name) return;
    const phone=prompt("Your phone number?"); if(!phone) return;
    try{ await api.post(`/schools/carpools/${carpoolId}/interest`,{name,phone}); toast.success("Interest sent!"); setInterests(p=>({...p,[carpoolId]:true})); }
    catch{ toast.error("Could not send interest"); }
  }

  const inp={width:"100%",background:"#1a1a1a",border:`1px solid ${BORDER}`,borderRadius:"10px",color:"#f0ede8",padding:"11px 14px",fontSize:"14px",outline:"none",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",marginBottom:"10px"};

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:"16px",fontWeight:"800"}}>🚗 School Lift Club</div>
        <button onClick={()=>setShowForm(s=>!s)} style={{background:G,border:"none",borderRadius:"10px",padding:"9px 16px",color:BG,fontWeight:"800",fontSize:"13px",cursor:"pointer"}}>+ Offer Lift</button>
      </div>
      <select value={selectedSchool} onChange={e=>setSelectedSchool(e.target.value)} style={{...inp,marginBottom:"1rem"}}>
        <option value="">Select a school...</option>
        {schools.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      {showForm&&(
        <div style={{background:"#111111",border:`1px solid ${BORDER}`,borderRadius:"16px",padding:"1.25rem",marginBottom:"1rem"}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:"15px",fontWeight:"800",color:G,marginBottom:"12px"}}>Offer a School Lift</div>
          <input value={form.suburb} onChange={e=>setForm(f=>({...f,suburb:e.target.value}))} placeholder="Your suburb *" style={inp}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
            <div><label style={{fontSize:"11px",color:"#6b6760",display:"block",marginBottom:"4px"}}>🌅 Morning</label><input type="time" value={form.morningTime} onChange={e=>setForm(f=>({...f,morningTime:e.target.value}))} style={{...inp,marginBottom:0,colorScheme:"dark"}}/></div>
            <div><label style={{fontSize:"11px",color:"#6b6760",display:"block",marginBottom:"4px"}}>🌇 Afternoon</label><input type="time" value={form.afternoonTime} onChange={e=>setForm(f=>({...f,afternoonTime:e.target.value}))} style={{...inp,marginBottom:0,colorScheme:"dark"}}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginTop:"10px"}}>
            <input value={form.daysAvailable} onChange={e=>setForm(f=>({...f,daysAvailable:e.target.value}))} placeholder="Days (Mon-Fri)" style={{...inp,marginBottom:0}}/>
            <input type="number" value={form.seatsAvailable} onChange={e=>setForm(f=>({...f,seatsAvailable:parseInt(e.target.value)}))} min="1" max="8" placeholder="Seats" style={{...inp,marginBottom:0}}/>
          </div>
          <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="Phone number *" style={{...inp,marginTop:"10px"}}/>
          <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Notes (route, cost sharing)" rows={2} style={{...inp,resize:"none"}}/>
          <div style={{display:"flex",gap:"8px"}}>
            <button onClick={post} disabled={saving} style={{flex:1,background:G,border:"none",borderRadius:"10px",padding:"12px",color:BG,fontWeight:"800",cursor:"pointer"}}>{saving?"Posting...":"Post Lift 🚗"}</button>
            <button onClick={()=>setShowForm(false)} style={{background:"#1a1a1a",border:`1px solid ${BORDER}`,borderRadius:"10px",padding:"12px 18px",color:"#6b6760",cursor:"pointer"}}>Cancel</button>
          </div>
        </div>
      )}
      {!selectedSchool?<div style={{textAlign:"center",padding:"3rem",color:"#6b6760"}}><div style={{fontSize:"40px",marginBottom:"10px"}}>🏫</div><div>Select a school to see lift clubs</div></div>:
       loading?<div style={{textAlign:"center",padding:"3rem",color:"#6b6760"}}>Loading...</div>:
       carpools.length===0?<div style={{textAlign:"center",padding:"3rem",color:"#6b6760"}}><div style={{fontSize:"40px",marginBottom:"10px"}}>🚗</div><div>No lift clubs for this school yet</div></div>:
       carpools.map(cp=>(
        <div key={cp.id} style={{background:"#111111",border:`1px solid ${BORDER}`,borderRadius:"14px",padding:"14px 16px",marginBottom:"10px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"8px"}}>
            <div><div style={{fontWeight:"700",color:"#f0ede8"}}>📍 From {cp.suburb}</div><div style={{fontSize:"11px",color:"#6b6760"}}>🌅 {cp.morningTime} · 🌇 {cp.afternoonTime} · 📅 {cp.daysAvailable}</div></div>
            <div style={{background:"rgba(232,184,75,0.1)",border:`1px solid ${BORDER}`,borderRadius:"8px",padding:"4px 10px",textAlign:"center"}}><div style={{fontFamily:"'Syne',sans-serif",fontSize:"16px",fontWeight:"800",color:G}}>{cp.seatsAvailable}</div><div style={{fontSize:"9px",color:"#6b6760"}}>seats</div></div>
          </div>
          {cp.notes&&<div style={{fontSize:"12px",color:"#a8a49e",marginBottom:"8px"}}>{cp.notes}</div>}
          {!interests[cp.id]?
            <button onClick={()=>showInterest(cp.id)} style={{width:"100%",background:G,border:"none",borderRadius:"10px",padding:"10px",color:BG,fontWeight:"800",fontSize:"13px",cursor:"pointer"}}>🙋 I'm Interested</button>:
            <div style={{background:"rgba(74,222,128,0.1)",border:"1px solid rgba(74,222,128,0.3)",borderRadius:"10px",padding:"10px",textAlign:"center",color:"#4ade80",fontSize:"13px",fontWeight:"700"}}>✓ Interest sent</div>
          }
        </div>
      ))}
    </div>
  );
}

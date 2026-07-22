// PROJO GROUP — Calendar Page
import React, { useState, useEffect } from "react";
import Navbar from "../../components/ui/Navbar";
import api from "../../services/api";
import toast from "react-hot-toast";

const G="#e8b84b"; const BG="#0a0a0a"; const BG2="#111111"; const BG3="#1a1a1a"; const BORDER="rgba(232,184,75,0.15)";
const DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const COLORS=["#e8b84b","#ef4444","#3b82f6","#10b981","#a78bfa","#f59e0b","#ec4899"];

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]   = useState({ title:"", date:"", time:"", endTime:"", color:COLORS[0], notes:"", repeat:"none" });
  const [saving, setSaving] = useState(false);

  useEffect(()=>{ loadEvents(); },[month, year]);
  async function loadEvents(){
    try{ const d=await api.get(`/tools/calendar?month=${month+1}&year=${year}`); setEvents(d.events||[]); }catch{}
  }

  const daysInMonth = new Date(year, month+1, 0).getDate();
  const firstDay    = new Date(year, month, 1).getDay();
  const cells = Array(firstDay).fill(null).concat(Array.from({length:daysInMonth},(_,i)=>i+1));
  while (cells.length % 7 !== 0) cells.push(null);

  function eventsOnDay(day){
    if (!day) return [];
    const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return events.filter(e => e.date?.startsWith(dateStr));
  }

  function selectDay(day){
    if (!day) return;
    const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    setSelected({ day, dateStr, events: eventsOnDay(day) });
    setForm(f=>({...f, date:dateStr}));
  }

  async function addEvent(){
    if (!form.title.trim()) return toast.error("Event title required");
    if (!form.date) return toast.error("Date required");
    setSaving(true);
    try{
      const d=await api.post("/tools/calendar",form);
      setEvents(p=>[...p,d.event]); setShowForm(false);
      setForm(f=>({...f,title:"",time:"",endTime:"",notes:"",repeat:"none"}));
      toast.success("Event added ✓");
      if(selected) setSelected(s=>({...s,events:[...s.events,d.event]}));
    }catch{ toast.error("Could not save event"); }
    setSaving(false);
  }

  async function deleteEvent(id){
    try{ await api.delete(`/tools/calendar/${id}`); setEvents(p=>p.filter(e=>e.id!==id)); if(selected) setSelected(s=>({...s,events:s.events.filter(e=>e.id!==id)})); toast.success("Deleted"); }catch{}
  }

  const inp = { width:"100%", background:BG3, border:`1px solid ${BORDER}`, borderRadius:"10px", color:"#f0ede8", padding:"11px 14px", fontSize:"14px", outline:"none", fontFamily:"'DM Sans',sans-serif", boxSizing:"border-box", marginBottom:"10px" };

  return (
    <div style={{ background:BG, minHeight:"100vh", color:"#f0ede8", fontFamily:"'DM Sans',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth:"680px", margin:"0 auto", padding:"80px 1rem 2rem" }}>
        {/* Month nav */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem" }}>
          <button onClick={()=>{ if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); }} style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"8px", padding:"8px 14px", color:"#f0ede8", cursor:"pointer" }}>‹</button>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"18px", fontWeight:"800" }}>{MONTHS[month]} {year}</div>
          <button onClick={()=>{ if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); }} style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"8px", padding:"8px 14px", color:"#f0ede8", cursor:"pointer" }}>›</button>
        </div>

        {/* Day headers */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"2px", marginBottom:"4px" }}>
          {DAYS.map(d=><div key={d} style={{ textAlign:"center", fontSize:"11px", color:"#6b6760", fontWeight:"700", padding:"6px 0" }}>{d}</div>)}
        </div>

        {/* Calendar grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"2px", marginBottom:"1.5rem" }}>
          {cells.map((day,i)=>{
            const isToday = day && day===now.getDate() && month===now.getMonth() && year===now.getFullYear();
            const isSelected = selected?.day===day;
            const dayEvents = eventsOnDay(day);
            return (
              <div key={i} onClick={()=>selectDay(day)} style={{ minHeight:"48px", borderRadius:"10px", background:isSelected?"rgba(232,184,75,0.2)":day?BG2:"transparent", border:`1px solid ${isSelected?G:day?BORDER:"transparent"}`, cursor:day?"pointer":"default", display:"flex", flexDirection:"column", alignItems:"center", padding:"6px 4px" }}>
                {day && <>
                  <div style={{ fontSize:"13px", fontWeight:isToday?"800":"400", color:isToday?G:"#f0ede8", width:"24px", height:"24px", borderRadius:"50%", background:isToday?"rgba(232,184,75,0.2)":"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>{day}</div>
                  <div style={{ display:"flex", gap:"2px", flexWrap:"wrap", justifyContent:"center" }}>
                    {dayEvents.slice(0,3).map((e,ei)=><div key={ei} style={{ width:"5px", height:"5px", borderRadius:"50%", background:e.color||G }} />)}
                  </div>
                </>}
              </div>
            );
          })}
        </div>

        {/* Selected day panel */}
        {selected && (
          <div style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"16px", padding:"1.25rem", marginBottom:"1rem" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"15px", fontWeight:"800" }}>
                {DAYS[new Date(selected.dateStr).getDay()]} {selected.day} {MONTHS[month]}
              </div>
              <button onClick={()=>setShowForm(s=>!s)} style={{ background:G, border:"none", borderRadius:"8px", padding:"7px 14px", color:BG, fontWeight:"800", fontSize:"12px", cursor:"pointer" }}>+ Add Event</button>
            </div>
            {showForm && (
              <div style={{ background:BG3, borderRadius:"12px", padding:"1rem", marginBottom:"12px" }}>
                <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Event title *" style={inp} />
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
                  <input type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} placeholder="Start time" style={{ ...inp, marginBottom:0, colorScheme:"dark" }} />
                  <input type="time" value={form.endTime} onChange={e=>setForm(f=>({...f,endTime:e.target.value}))} placeholder="End time" style={{ ...inp, marginBottom:0, colorScheme:"dark" }} />
                </div>
                <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Notes" rows={2} style={{ ...inp, marginTop:"10px", resize:"none" }} />
                <div style={{ display:"flex", gap:"6px", marginBottom:"10px" }}>
                  {COLORS.map(c=><div key={c} onClick={()=>setForm(f=>({...f,color:c}))} style={{ width:"22px", height:"22px", borderRadius:"50%", background:c, cursor:"pointer", border:form.color===c?"3px solid white":"3px solid transparent" }} />)}
                </div>
                <div style={{ display:"flex", gap:"8px" }}>
                  <button onClick={addEvent} disabled={saving} style={{ flex:1, background:G, border:"none", borderRadius:"8px", padding:"10px", color:BG, fontWeight:"800", cursor:"pointer" }}>Add Event</button>
                  <button onClick={()=>setShowForm(false)} style={{ background:"transparent", border:`1px solid ${BORDER}`, borderRadius:"8px", padding:"10px 14px", color:"#6b6760", cursor:"pointer" }}>Cancel</button>
                </div>
              </div>
            )}
            {selected.events.length===0 ? <div style={{ textAlign:"center", padding:"1rem", color:"#6b6760", fontSize:"13px" }}>No events this day</div> :
             selected.events.map(evt=>(
              <div key={evt.id} style={{ display:"flex", gap:"10px", alignItems:"center", padding:"10px 12px", background:BG3, borderRadius:"10px", marginBottom:"6px", borderLeft:`3px solid ${evt.color||G}` }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:"700", fontSize:"14px" }}>{evt.title}</div>
                  {evt.time && <div style={{ fontSize:"11px", color:"#6b6760" }}>🕐 {evt.time}{evt.endTime?` – ${evt.endTime}`:""}</div>}
                  {evt.notes && <div style={{ fontSize:"11px", color:"#6b6760" }}>{evt.notes}</div>}
                </div>
                <button onClick={()=>deleteEvent(evt.id)} style={{ background:"none", border:"none", color:"#4a3030", cursor:"pointer" }}>🗑️</button>
              </div>
            ))}
          </div>
        )}

        {/* Upcoming events */}
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"15px", fontWeight:"800", marginBottom:"10px" }}>Upcoming Events</div>
        {events.length===0 ? <div style={{ textAlign:"center", padding:"2rem", color:"#6b6760" }}>No events this month</div> :
         events.sort((a,b)=>new Date(a.date)-new Date(b.date)).map(evt=>(
          <div key={evt.id} style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"12px", padding:"12px 14px", marginBottom:"8px", display:"flex", gap:"12px", alignItems:"center" }}>
            <div style={{ width:"40px", height:"40px", borderRadius:"10px", background:`${evt.color||G}22`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:evt.color||G }} />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:"700", fontSize:"14px" }}>{evt.title}</div>
              <div style={{ fontSize:"11px", color:"#6b6760" }}>{new Date(evt.date).toLocaleDateString("en-ZA",{weekday:"short",day:"2-digit",month:"short"})}{evt.time ? ` · ${evt.time}` : ""}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

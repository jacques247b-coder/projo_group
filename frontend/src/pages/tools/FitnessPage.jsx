// PROJO GROUP — Fitness Tracker
import React, { useState, useEffect } from "react";
import Navbar from "../../components/ui/Navbar";
import api from "../../services/api";
import toast from "react-hot-toast";

const G="#e8b84b"; const BG="#0a0a0a"; const BG2="#111111"; const BG3="#1a1a1a"; const BORDER="rgba(232,184,75,0.15)";
const WORKOUT_TYPES = ["Running","Walking","Cycling","Gym","Yoga","Pilates","HIIT","Swimming","Soccer","Other"];

export default function FitnessPage() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ type:"Running", duration:30, distance:"", calories:"", notes:"", date:new Date().toISOString().split("T")[0] });
  const [saving, setSaving]     = useState(false);

  useEffect(()=>{loadWorkouts();},[]);
  async function loadWorkouts(){
    setLoading(true);
    try{ const data=await api.get("/tools/fitness/workouts"); setWorkouts(data.workouts||[]); }
    catch{}
    setLoading(false);
  }

  async function addWorkout(){
    setSaving(true);
    try{
      const data=await api.post("/tools/fitness/workouts",{...form,duration:parseInt(form.duration),calories:form.calories?parseInt(form.calories):null});
      setWorkouts(p=>[data.workout,...p]); setShowForm(false); toast.success("Workout logged ✓");
    }catch{ toast.error("Could not save"); }
    setSaving(false);
  }

  const thisWeek = workouts.filter(w=>{const d=new Date(w.date||w.createdAt);const now=new Date();const weekAgo=new Date(now-7*86400000);return d>=weekAgo;});
  const totalMin = thisWeek.reduce((s,w)=>s+parseInt(w.duration||0),0);
  const totalCal = thisWeek.reduce((s,w)=>s+parseInt(w.calories||0),0);

  const inp = { width:"100%", background:BG3, border:`1px solid ${BORDER}`, borderRadius:"10px", color:"#f0ede8", padding:"11px 14px", fontSize:"14px", outline:"none", fontFamily:"'DM Sans',sans-serif", boxSizing:"border-box", marginBottom:"10px" };

  return (
    <div style={{ background:BG, minHeight:"100vh", color:"#f0ede8", fontFamily:"'DM Sans',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth:"680px", margin:"0 auto", padding:"80px 1rem 2rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"22px", fontWeight:"800" }}>💪 Fitness</div>
          <button onClick={()=>setShowForm(s=>!s)} style={{ background:G, border:"none", borderRadius:"10px", padding:"10px 20px", color:BG, fontWeight:"800", fontSize:"14px", cursor:"pointer" }}>+ Log Workout</button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px", marginBottom:"1.25rem" }}>
          {[["💪",thisWeek.length,"Workouts this week"],["⏱️",`${totalMin}m`,"Total time"],["🔥",totalCal||"–","Calories burned"]].map(([icon,val,label])=>(
            <div key={label} style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"14px", padding:"14px", textAlign:"center" }}>
              <div style={{ fontSize:"22px" }}>{icon}</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"18px", fontWeight:"800", color:G }}>{val}</div>
              <div style={{ fontSize:"10px", color:"#6b6760" }}>{label}</div>
            </div>
          ))}
        </div>

        {showForm && (
          <div style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"16px", padding:"1.25rem", marginBottom:"1rem" }}>
            <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={inp}>
              {WORKOUT_TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px" }}>
              <div><label style={{ fontSize:"11px", color:"#6b6760", display:"block", marginBottom:"4px" }}>Duration (min)</label><input type="number" value={form.duration} onChange={e=>setForm(f=>({...f,duration:e.target.value}))} style={{ ...inp, marginBottom:0 }} /></div>
              <div><label style={{ fontSize:"11px", color:"#6b6760", display:"block", marginBottom:"4px" }}>Distance (km)</label><input type="number" value={form.distance} onChange={e=>setForm(f=>({...f,distance:e.target.value}))} placeholder="Optional" style={{ ...inp, marginBottom:0 }} /></div>
              <div><label style={{ fontSize:"11px", color:"#6b6760", display:"block", marginBottom:"4px" }}>Calories</label><input type="number" value={form.calories} onChange={e=>setForm(f=>({...f,calories:e.target.value}))} placeholder="Optional" style={{ ...inp, marginBottom:0 }} /></div>
            </div>
            <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={{ ...inp, marginTop:"10px", colorScheme:"dark" }} />
            <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Notes" rows={2} style={{ ...inp, resize:"none" }} />
            <div style={{ display:"flex", gap:"8px" }}>
              <button onClick={addWorkout} disabled={saving} style={{ flex:1, background:G, border:"none", borderRadius:"10px", padding:"12px", color:BG, fontWeight:"800", cursor:"pointer" }}>Log Workout</button>
              <button onClick={()=>setShowForm(false)} style={{ background:BG3, border:`1px solid ${BORDER}`, borderRadius:"10px", padding:"12px 18px", color:"#6b6760", cursor:"pointer" }}>Cancel</button>
            </div>
          </div>
        )}

        {loading ? <div style={{ textAlign:"center", padding:"3rem", color:"#6b6760" }}>Loading...</div> :
         workouts.length===0 ? (
          <div style={{ textAlign:"center", padding:"4rem" }}>
            <div style={{ fontSize:"48px", marginBottom:"12px" }}>💪</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"18px", fontWeight:"700", marginBottom:"8px" }}>No workouts yet</div>
            <div style={{ color:"#6b6760" }}>Log your first workout to start tracking</div>
          </div>
        ) : workouts.map(w => (
          <div key={w.id} style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"14px", padding:"14px 16px", marginBottom:"8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontWeight:"700", color:"#f0ede8" }}>{w.type}</div>
              <div style={{ fontSize:"12px", color:"#6b6760" }}>{new Date(w.date||w.createdAt).toLocaleDateString("en-ZA",{weekday:"short",day:"2-digit",month:"short"})}</div>
            </div>
            <div style={{ display:"flex", gap:"12px", fontSize:"13px", color:"#a8a49e" }}>
              <span>⏱️ {w.duration}m</span>
              {w.distance && <span>📍 {w.distance}km</span>}
              {w.calories && <span>🔥 {w.calories}cal</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

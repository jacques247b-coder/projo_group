// PROJO GROUP — Health Tracker
import React, { useState, useEffect } from "react";
import Navbar from "../../components/ui/Navbar";
import api from "../../services/api";
import toast from "react-hot-toast";

const G="#e8b84b"; const BG="#0a0a0a"; const BG2="#111111"; const BG3="#1a1a1a"; const BORDER="rgba(232,184,75,0.15)";

export default function HealthPage() {
  const [logs, setLogs]         = useState([]);
  const [meds, setMeds]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState("log");
  const [form, setForm]         = useState({ weight:"", sleepHours:"", waterGlasses:"", mood:"Good", notes:"", date:new Date().toISOString().split("T")[0] });
  const [medForm, setMedForm]   = useState({ name:"", dosage:"", frequency:"daily", time:"08:00" });
  const [saving, setSaving]     = useState(false);

  useEffect(() => { loadAll(); }, []);
  async function loadAll() {
    setLoading(true);
    try {
      const [ld, md] = await Promise.all([api.get("/tools/health/logs"), api.get("/tools/health/medications")]);
      setLogs(ld.logs||[]); setMeds(md.medications||[]);
    } catch {}
    setLoading(false);
  }

  async function saveLog() {
    setSaving(true);
    try {
      const data = await api.post("/tools/health/logs", form);
      setLogs(p => [data.log, ...p]); toast.success("Health log saved ✓");
      setForm({ weight:"", sleepHours:"", waterGlasses:"", mood:"Good", notes:"", date:new Date().toISOString().split("T")[0] });
    } catch { toast.error("Could not save"); }
    setSaving(false);
  }

  async function addMed() {
    if (!medForm.name.trim()) return toast.error("Medication name required");
    setSaving(true);
    try {
      const data = await api.post("/tools/health/medications", medForm);
      setMeds(p => [...p, data.medication]); setMedForm({ name:"", dosage:"", frequency:"daily", time:"08:00" }); toast.success("Medication added");
    } catch {}
    setSaving(false);
  }

  const inp = { width:"100%", background:BG3, border:`1px solid ${BORDER}`, borderRadius:"10px", color:"#f0ede8", padding:"11px 14px", fontSize:"14px", outline:"none", fontFamily:"'DM Sans',sans-serif", boxSizing:"border-box", marginBottom:"10px" };
  const last7 = logs.slice(0,7);
  const avgSleep = last7.length ? (last7.reduce((s,l)=>s+parseFloat(l.sleepHours||0),0)/last7.length).toFixed(1) : 0;
  const avgWater = last7.length ? Math.round(last7.reduce((s,l)=>s+parseInt(l.waterGlasses||0),0)/last7.length) : 0;

  return (
    <div style={{ background:BG, minHeight:"100vh", color:"#f0ede8", fontFamily:"'DM Sans',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth:"680px", margin:"0 auto", padding:"80px 1rem 2rem" }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"22px", fontWeight:"800", marginBottom:"1.25rem" }}>❤️ Health Tracker</div>

        {/* Stats */}
        {last7.length > 0 && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px", marginBottom:"1.25rem" }}>
            {[["😴","Avg Sleep",`${avgSleep}h`],["💧","Avg Water",`${avgWater} glasses`],["📊","Entries",logs.length]].map(([icon,label,val]) => (
              <div key={label} style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"14px", padding:"14px", textAlign:"center" }}>
                <div style={{ fontSize:"22px" }}>{icon}</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"16px", fontWeight:"800", color:G }}>{val}</div>
                <div style={{ fontSize:"10px", color:"#6b6760" }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display:"flex", gap:"8px", marginBottom:"1.25rem" }}>
          {[["log","📋 Log"],["meds","💊 Medications"],["history","📈 History"]].map(([k,l]) => (
            <button key={k} onClick={()=>setTab(k)} style={{ flex:1, background:tab===k?"rgba(232,184,75,0.15)":BG2, border:`1px solid ${tab===k?G:BORDER}`, borderRadius:"10px", padding:"9px", color:tab===k?G:"#6b6760", fontSize:"12px", fontWeight:"700", cursor:"pointer" }}>{l}</button>
          ))}
        </div>

        {tab === "log" && (
          <div style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"16px", padding:"1.25rem" }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"15px", fontWeight:"800", color:G, marginBottom:"12px" }}>Today's Health Log</div>
            <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={{ ...inp, colorScheme:"dark" }} />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px" }}>
              <div><label style={{ fontSize:"11px", color:"#6b6760", display:"block", marginBottom:"4px" }}>Weight (kg)</label><input type="number" value={form.weight} onChange={e=>setForm(f=>({...f,weight:e.target.value}))} placeholder="70" style={{ ...inp, marginBottom:0 }} /></div>
              <div><label style={{ fontSize:"11px", color:"#6b6760", display:"block", marginBottom:"4px" }}>😴 Sleep (hrs)</label><input type="number" value={form.sleepHours} onChange={e=>setForm(f=>({...f,sleepHours:e.target.value}))} placeholder="8" style={{ ...inp, marginBottom:0 }} /></div>
              <div><label style={{ fontSize:"11px", color:"#6b6760", display:"block", marginBottom:"4px" }}>💧 Water</label><input type="number" value={form.waterGlasses} onChange={e=>setForm(f=>({...f,waterGlasses:e.target.value}))} placeholder="8" style={{ ...inp, marginBottom:0 }} /></div>
            </div>
            <div style={{ marginTop:"10px" }}>
              <label style={{ fontSize:"11px", color:"#6b6760", display:"block", marginBottom:"6px" }}>Mood</label>
              <div style={{ display:"flex", gap:"8px" }}>
                {["Great","Good","Okay","Low","Bad"].map(m => (
                  <button key={m} onClick={()=>setForm(f=>({...f,mood:m}))} style={{ flex:1, background:form.mood===m?"rgba(232,184,75,0.2)":BG3, border:`1px solid ${form.mood===m?G:BORDER}`, borderRadius:"8px", padding:"8px 4px", color:form.mood===m?G:"#6b6760", fontSize:"11px", fontWeight:"700", cursor:"pointer" }}>{m}</button>
                ))}
              </div>
            </div>
            <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Notes (optional)" rows={2} style={{ ...inp, marginTop:"10px", resize:"none" }} />
            <button onClick={saveLog} disabled={saving} style={{ width:"100%", background:G, border:"none", borderRadius:"10px", padding:"12px", color:BG, fontWeight:"800", cursor:"pointer" }}>{saving?"Saving...":"Save Log"}</button>
          </div>
        )}

        {tab === "meds" && (
          <div>
            <div style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"16px", padding:"1.25rem", marginBottom:"1rem" }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"15px", fontWeight:"800", color:G, marginBottom:"12px" }}>Add Medication</div>
              <input value={medForm.name} onChange={e=>setMedForm(f=>({...f,name:e.target.value}))} placeholder="Medication name" style={inp} />
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px" }}>
                <input value={medForm.dosage} onChange={e=>setMedForm(f=>({...f,dosage:e.target.value}))} placeholder="Dosage" style={{ ...inp, marginBottom:0 }} />
                <select value={medForm.frequency} onChange={e=>setMedForm(f=>({...f,frequency:e.target.value}))} style={{ ...inp, marginBottom:0 }}><option value="daily">Daily</option><option value="twice">Twice Daily</option><option value="weekly">Weekly</option></select>
                <input type="time" value={medForm.time} onChange={e=>setMedForm(f=>({...f,time:e.target.value}))} style={{ ...inp, marginBottom:0, colorScheme:"dark" }} />
              </div>
              <button onClick={addMed} disabled={saving} style={{ width:"100%", background:G, border:"none", borderRadius:"10px", padding:"12px", color:BG, fontWeight:"800", cursor:"pointer", marginTop:"10px" }}>Add Medication</button>
            </div>
            {meds.map(med => (
              <div key={med.id} style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"12px", padding:"14px", marginBottom:"8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontWeight:"700", color:"#f0ede8" }}>💊 {med.name}</div>
                  <div style={{ fontSize:"12px", color:"#6b6760" }}>{med.dosage} · {med.frequency} · {med.time}</div>
                </div>
                <button onClick={async()=>{await api.delete(`/tools/health/medications/${med.id}`);setMeds(p=>p.filter(m=>m.id!==med.id));}} style={{ background:"none", border:"none", color:"#4a3030", cursor:"pointer" }}>🗑️</button>
              </div>
            ))}
          </div>
        )}

        {tab === "history" && (
          loading ? <div style={{ textAlign:"center", padding:"2rem", color:"#6b6760" }}>Loading...</div> :
          logs.length === 0 ? <div style={{ textAlign:"center", padding:"3rem", color:"#6b6760" }}><div style={{ fontSize:"48px" }}>❤️</div><div style={{ marginTop:"10px" }}>Start logging your health</div></div> :
          logs.map(log => (
            <div key={log.id} style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"12px", padding:"14px 16px", marginBottom:"8px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
                <span style={{ fontWeight:"700", color:"#f0ede8" }}>{new Date(log.date||log.createdAt).toLocaleDateString("en-ZA",{weekday:"short",day:"2-digit",month:"short"})}</span>
                <span style={{ fontSize:"12px", color:G }}>{log.mood}</span>
              </div>
              <div style={{ display:"flex", gap:"16px", fontSize:"12px", color:"#6b6760" }}>
                {log.weight && <span>⚖️ {log.weight}kg</span>}
                {log.sleepHours && <span>😴 {log.sleepHours}h</span>}
                {log.waterGlasses && <span>💧 {log.waterGlasses} glasses</span>}
              </div>
              {log.notes && <div style={{ fontSize:"12px", color:"#a8a49e", marginTop:"6px" }}>{log.notes}</div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

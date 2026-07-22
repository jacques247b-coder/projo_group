// PROJO GROUP — Goals & Habits Page
import React, { useState, useEffect } from "react";
import Navbar from "../../components/ui/Navbar";
import api from "../../services/api";
import toast from "react-hot-toast";

const G="#e8b84b"; const BG="#0a0a0a"; const BG2="#111111"; const BG3="#1a1a1a"; const BORDER="rgba(232,184,75,0.15)";
const CATEGORIES = ["Health","Finance","Career","Personal","Learning","Fitness","Relationships","Other"];

export default function GoalsPage() {
  const [goals, setGoals]     = useState([]);
  const [habits, setHabits]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("goals");
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [gForm, setGForm] = useState({ title:"", description:"", category:"Personal", targetDate:"", progress:0 });
  const [hForm, setHForm] = useState({ title:"", description:"", frequency:"daily", targetDays:21 });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAll(); }, []);
  async function loadAll() {
    setLoading(true);
    try {
      const [gd, hd] = await Promise.all([api.get("/tools/goals"), api.get("/tools/habits")]);
      setGoals(gd.goals || []); setHabits(hd.habits || []);
    } catch { toast.error("Could not load"); }
    setLoading(false);
  }

  async function addGoal() {
    if (!gForm.title.trim()) return toast.error("Goal title required");
    setSaving(true);
    try {
      const data = await api.post("/tools/goals", gForm);
      setGoals(p => [data.goal, ...p]); setShowGoalForm(false); setGForm({ title:"", description:"", category:"Personal", targetDate:"", progress:0 });
      toast.success("Goal added ✓");
    } catch { toast.error("Could not add goal"); }
    setSaving(false);
  }

  async function addHabit() {
    if (!hForm.title.trim()) return toast.error("Habit title required");
    setSaving(true);
    try {
      const data = await api.post("/tools/habits", hForm);
      setHabits(p => [data.habit, ...p]); setShowHabitForm(false); setHForm({ title:"", description:"", frequency:"daily", targetDays:21 });
      toast.success("Habit added ✓");
    } catch { toast.error("Could not add habit"); }
    setSaving(false);
  }

  async function updateProgress(goal, v) {
    try {
      const data = await api.put(`/tools/goals/${goal.id}`, { progress: Math.min(100, Math.max(0, v)) });
      setGoals(p => p.map(g => g.id === goal.id ? data.goal : g));
    } catch {}
  }

  async function logHabit(habit) {
    try {
      await api.post(`/tools/habits/${habit.id}/log`, { date: new Date().toISOString().split("T")[0] });
      const data = await api.get("/tools/habits");
      setHabits(data.habits || []);
      toast.success(`✓ ${habit.title} logged!`);
    } catch { toast.error("Already logged today"); }
  }

  async function deleteGoal(id) { try { await api.delete(`/tools/goals/${id}`); setGoals(p=>p.filter(g=>g.id!==id)); } catch {} }
  async function deleteHabit(id) { try { await api.delete(`/tools/habits/${id}`); setHabits(p=>p.filter(h=>h.id!==id)); } catch {} }

  const inp = { width:"100%", background:BG3, border:`1px solid ${BORDER}`, borderRadius:"10px", color:"#f0ede8", padding:"11px 14px", fontSize:"14px", outline:"none", fontFamily:"'DM Sans',sans-serif", boxSizing:"border-box", marginBottom:"10px" };

  return (
    <div style={{ background:BG, minHeight:"100vh", color:"#f0ede8", fontFamily:"'DM Sans',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth:"680px", margin:"0 auto", padding:"80px 1rem 2rem" }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"22px", fontWeight:"800", marginBottom:"1.25rem" }}>🎯 Goals & Habits</div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:"8px", marginBottom:"1.25rem" }}>
          {[["goals","🎯 Goals"],["habits","🔁 Habits"]].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ flex:1, background:tab===k?"rgba(232,184,75,0.15)":BG2, border:`1px solid ${tab===k?G:BORDER}`, borderRadius:"10px", padding:"10px", color:tab===k?G:"#6b6760", fontSize:"14px", fontWeight:"700", cursor:"pointer" }}>{l}</button>
          ))}
        </div>

        {tab === "goals" && (
          <>
            <button onClick={() => setShowGoalForm(s=>!s)} style={{ width:"100%", background:G, border:"none", borderRadius:"10px", padding:"12px", color:BG, fontWeight:"800", fontSize:"14px", cursor:"pointer", marginBottom:"1rem" }}>+ Add Goal</button>
            {showGoalForm && (
              <div style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"16px", padding:"1.25rem", marginBottom:"1rem" }}>
                <input value={gForm.title} onChange={e => setGForm(f=>({...f,title:e.target.value}))} placeholder="Goal title *" style={inp} />
                <textarea value={gForm.description} onChange={e => setGForm(f=>({...f,description:e.target.value}))} placeholder="Description" rows={2} style={{ ...inp, resize:"none" }} />
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
                  <select value={gForm.category} onChange={e => setGForm(f=>({...f,category:e.target.value}))} style={{ ...inp, marginBottom:0 }}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <input type="date" value={gForm.targetDate} onChange={e => setGForm(f=>({...f,targetDate:e.target.value}))} style={{ ...inp, marginBottom:0, colorScheme:"dark" }} />
                </div>
                <div style={{ display:"flex", gap:"8px", marginTop:"10px" }}>
                  <button onClick={addGoal} disabled={saving} style={{ flex:1, background:G, border:"none", borderRadius:"10px", padding:"11px", color:BG, fontWeight:"800", cursor:"pointer" }}>Add Goal</button>
                  <button onClick={() => setShowGoalForm(false)} style={{ background:BG3, border:`1px solid ${BORDER}`, borderRadius:"10px", padding:"11px 18px", color:"#6b6760", cursor:"pointer" }}>Cancel</button>
                </div>
              </div>
            )}
            {loading ? <div style={{ textAlign:"center", padding:"2rem", color:"#6b6760" }}>Loading...</div> :
             goals.length === 0 ? (
              <div style={{ textAlign:"center", padding:"3rem", color:"#6b6760" }}>
                <div style={{ fontSize:"48px", marginBottom:"12px" }}>🎯</div>
                <div>Set your first goal and start achieving</div>
              </div>
            ) : goals.map(goal => (
              <div key={goal.id} style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"14px", padding:"16px", marginBottom:"10px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"8px" }}>
                  <div>
                    <div style={{ fontWeight:"700", fontSize:"15px", color:"#f0ede8" }}>{goal.title}</div>
                    <div style={{ fontSize:"11px", color:"#6b6760" }}>{goal.category}{goal.targetDate ? ` · Due ${new Date(goal.targetDate).toLocaleDateString("en-ZA",{day:"2-digit",month:"short",year:"numeric"})}`:""}</div>
                  </div>
                  <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
                    <span style={{ fontSize:"13px", fontWeight:"800", color:G }}>{goal.progress}%</span>
                    <button onClick={() => deleteGoal(goal.id)} style={{ background:"none", border:"none", color:"#4a3030", cursor:"pointer" }}>🗑️</button>
                  </div>
                </div>
                {goal.description && <div style={{ fontSize:"12px", color:"#6b6760", marginBottom:"10px" }}>{goal.description}</div>}
                <div style={{ background:BG3, borderRadius:"8px", height:"8px", marginBottom:"8px" }}>
                  <div style={{ background:`linear-gradient(90deg, ${G}, #f59e0b)`, height:"100%", borderRadius:"8px", width:`${goal.progress}%`, transition:"width 0.5s" }} />
                </div>
                <div style={{ display:"flex", gap:"6px" }}>
                  {[0,25,50,75,100].map(v => (
                    <button key={v} onClick={() => updateProgress(goal, v)} style={{ flex:1, background:goal.progress>=v?"rgba(232,184,75,0.15)":BG3, border:`1px solid ${goal.progress>=v?G:BORDER}`, borderRadius:"6px", padding:"5px", color:goal.progress>=v?G:"#6b6760", fontSize:"11px", fontWeight:"700", cursor:"pointer" }}>{v}%</button>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {tab === "habits" && (
          <>
            <button onClick={() => setShowHabitForm(s=>!s)} style={{ width:"100%", background:G, border:"none", borderRadius:"10px", padding:"12px", color:BG, fontWeight:"800", fontSize:"14px", cursor:"pointer", marginBottom:"1rem" }}>+ Add Habit</button>
            {showHabitForm && (
              <div style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"16px", padding:"1.25rem", marginBottom:"1rem" }}>
                <input value={hForm.title} onChange={e => setHForm(f=>({...f,title:e.target.value}))} placeholder="Habit title (e.g. Drink 8 glasses of water)" style={inp} />
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
                  <select value={hForm.frequency} onChange={e => setHForm(f=>({...f,frequency:e.target.value}))} style={{ ...inp, marginBottom:0 }}>
                    <option value="daily">Daily</option>
                    <option value="weekdays">Weekdays</option>
                    <option value="weekly">Weekly</option>
                  </select>
                  <input type="number" value={hForm.targetDays} onChange={e => setHForm(f=>({...f,targetDays:parseInt(e.target.value)}))} placeholder="Target days" style={{ ...inp, marginBottom:0 }} />
                </div>
                <div style={{ display:"flex", gap:"8px", marginTop:"10px" }}>
                  <button onClick={addHabit} disabled={saving} style={{ flex:1, background:G, border:"none", borderRadius:"10px", padding:"11px", color:BG, fontWeight:"800", cursor:"pointer" }}>Add Habit</button>
                  <button onClick={() => setShowHabitForm(false)} style={{ background:BG3, border:`1px solid ${BORDER}`, borderRadius:"10px", padding:"11px 18px", color:"#6b6760", cursor:"pointer" }}>Cancel</button>
                </div>
              </div>
            )}
            {loading ? <div style={{ textAlign:"center", padding:"2rem", color:"#6b6760" }}>Loading...</div> :
             habits.length === 0 ? (
              <div style={{ textAlign:"center", padding:"3rem", color:"#6b6760" }}>
                <div style={{ fontSize:"48px", marginBottom:"12px" }}>🔁</div>
                <div>Build powerful daily habits</div>
              </div>
            ) : habits.map(habit => {
              const todayLogged = habit.logs?.some(l => l.date === new Date().toISOString().split("T")[0]);
              const streak = habit.currentStreak || 0;
              return (
                <div key={habit.id} style={{ background:BG2, border:`1px solid ${todayLogged?G:BORDER}`, borderRadius:"14px", padding:"16px", marginBottom:"10px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
                    <div>
                      <div style={{ fontWeight:"700", fontSize:"15px", color:"#f0ede8" }}>{habit.title}</div>
                      <div style={{ fontSize:"11px", color:"#6b6760" }}>{habit.frequency} · {habit.targetDays} day target</div>
                    </div>
                    <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                      {streak > 0 && <span style={{ fontSize:"12px", color:"#f59e0b", fontWeight:"700" }}>🔥 {streak}</span>}
                      <button onClick={() => deleteHabit(habit.id)} style={{ background:"none", border:"none", color:"#4a3030", cursor:"pointer" }}>🗑️</button>
                    </div>
                  </div>
                  <button onClick={() => !todayLogged && logHabit(habit)} disabled={todayLogged} style={{ width:"100%", background:todayLogged?"rgba(74,222,128,0.15)":"rgba(232,184,75,0.15)", border:`1px solid ${todayLogged?"#4ade80":G}`, borderRadius:"10px", padding:"10px", color:todayLogged?"#4ade80":G, fontWeight:"700", fontSize:"13px", cursor:todayLogged?"default":"pointer" }}>
                    {todayLogged ? "✓ Done for today!" : "Mark Complete Today"}
                  </button>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

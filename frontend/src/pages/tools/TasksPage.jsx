// PROJO GROUP — Tasks Page
// Full task manager with subtasks, priorities, due dates, projects
import React, { useState, useEffect } from "react";
import Navbar from "../../components/ui/Navbar";
import api from "../../services/api";
import toast from "react-hot-toast";

const G="#e8b84b"; const BG="#0a0a0a"; const BG2="#111111"; const BG3="#1a1a1a";
const BORDER="rgba(232,184,75,0.15)";
const PRIORITY_COLORS = { high:"#ef4444", normal:"#e8b84b", low:"#6b7280" };
const PRIORITY_LABELS = { high:"🔴 High", normal:"🟡 Normal", low:"⚪ Low" };

export default function TasksPage() {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("active"); // active | completed | all
  const [project, setProject] = useState("All");
  const [projects, setProjects] = useState(["All"]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]       = useState({ title:"", notes:"", project:"", dueDate:"", priority:"normal" });
  const [saving, setSaving]   = useState(false);

  useEffect(() => { loadTasks(); }, []);

  async function loadTasks() {
    setLoading(true);
    try {
      const data = await api.get("/tools/tasks");
      const t = data.tasks || [];
      setTasks(t);
      const ps = [...new Set(t.map(x => x.project).filter(Boolean))];
      setProjects(["All", ...ps]);
    } catch { toast.error("Could not load tasks"); }
    setLoading(false);
  }

  async function addTask() {
    if (!form.title.trim()) return toast.error("Task title required");
    setSaving(true);
    try {
      const data = await api.post("/tools/tasks", form);
      setTasks(p => [data.task, ...p]);
      setForm({ title:"", notes:"", project:"", dueDate:"", priority:"normal" });
      setShowForm(false);
      toast.success("Task added ✓");
    } catch { toast.error("Could not add task"); }
    setSaving(false);
  }

  async function toggleTask(task) {
    try {
      const data = await api.put(`/tools/tasks/${task.id}`, { completed: !task.completed });
      setTasks(p => p.map(t => t.id === task.id ? data.task : t));
    } catch {}
  }

  async function deleteTask(id) {
    try {
      await api.delete(`/tools/tasks/${id}`);
      setTasks(p => p.filter(t => t.id !== id));
      toast.success("Task deleted");
    } catch {}
  }

  const filtered = tasks
    .filter(t => project === "All" || t.project === project)
    .filter(t => filter === "active" ? !t.completed : filter === "completed" ? t.completed : true)
    .sort((a,b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const po = { high:0, normal:1, low:2 };
      return (po[a.priority]||1) - (po[b.priority]||1);
    });

  const completed = tasks.filter(t => t.completed).length;
  const total = tasks.length;

  const inp = { width:"100%", background:BG3, border:`1px solid ${BORDER}`, borderRadius:"10px", color:"#f0ede8", padding:"11px 14px", fontSize:"14px", outline:"none", fontFamily:"'DM Sans',sans-serif", boxSizing:"border-box", marginBottom:"10px" };

  return (
    <div style={{ background:BG, minHeight:"100vh", color:"#f0ede8", fontFamily:"'DM Sans',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth:"680px", margin:"0 auto", padding:"80px 1rem 2rem" }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"22px", fontWeight:"800" }}>✅ Tasks</div>
            <div style={{ fontSize:"12px", color:"#6b6760" }}>{completed}/{total} completed</div>
          </div>
          <button onClick={() => setShowForm(s => !s)} style={{ background:G, border:"none", borderRadius:"10px", padding:"10px 20px", color:BG, fontWeight:"800", fontSize:"14px", cursor:"pointer" }}>+ Add Task</button>
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div style={{ background:BG2, borderRadius:"10px", height:"6px", marginBottom:"1.25rem" }}>
            <div style={{ background:G, height:"100%", borderRadius:"10px", width:`${(completed/total)*100}%`, transition:"width 0.5s" }} />
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <div style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"16px", padding:"1.25rem", marginBottom:"1.25rem" }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"15px", fontWeight:"800", color:G, marginBottom:"12px" }}>New Task</div>
            <input value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} placeholder="Task title *" style={inp} onKeyDown={e => e.key==="Enter" && addTask()} />
            <textarea value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} placeholder="Notes (optional)" rows={2} style={{ ...inp, resize:"none" }} />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px" }}>
              <select value={form.priority} onChange={e => setForm(f=>({...f,priority:e.target.value}))} style={{ ...inp, marginBottom:0 }}>
                <option value="high">🔴 High</option>
                <option value="normal">🟡 Normal</option>
                <option value="low">⚪ Low</option>
              </select>
              <input value={form.project} onChange={e => setForm(f=>({...f,project:e.target.value}))} placeholder="Project" style={{ ...inp, marginBottom:0 }} />
              <input type="date" value={form.dueDate} onChange={e => setForm(f=>({...f,dueDate:e.target.value}))} style={{ ...inp, marginBottom:0, colorScheme:"dark" }} />
            </div>
            <div style={{ display:"flex", gap:"8px", marginTop:"10px" }}>
              <button onClick={addTask} disabled={saving} style={{ flex:1, background:G, border:"none", borderRadius:"10px", padding:"11px", color:BG, fontWeight:"800", cursor:"pointer" }}>{saving?"Adding...":"Add Task"}</button>
              <button onClick={() => setShowForm(false)} style={{ background:BG3, border:`1px solid ${BORDER}`, borderRadius:"10px", padding:"11px 18px", color:"#6b6760", cursor:"pointer" }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display:"flex", gap:"6px", marginBottom:"1rem", flexWrap:"wrap" }}>
          {[["active","Active"],["completed","Done"],["all","All"]].map(([k,l]) => (
            <button key={k} onClick={() => setFilter(k)} style={{ background:filter===k?"rgba(232,184,75,0.15)":BG2, border:`1px solid ${filter===k?G:BORDER}`, borderRadius:"20px", padding:"5px 14px", color:filter===k?G:"#6b6760", fontSize:"12px", fontWeight:"700", cursor:"pointer" }}>{l}</button>
          ))}
          {projects.length > 1 && projects.map(p => (
            <button key={p} onClick={() => setProject(p)} style={{ background:project===p?"rgba(59,130,246,0.15)":BG2, border:`1px solid ${project===p?"#3b82f6":BORDER}`, borderRadius:"20px", padding:"5px 14px", color:project===p?"#3b82f6":"#6b6760", fontSize:"12px", fontWeight:"700", cursor:"pointer" }}>{p}</button>
          ))}
        </div>

        {/* Task list */}
        {loading ? <div style={{ textAlign:"center", padding:"3rem", color:"#6b6760" }}>Loading...</div> :
         filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"4rem 2rem" }}>
            <div style={{ fontSize:"48px", marginBottom:"12px" }}>✅</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"18px", fontWeight:"700", marginBottom:"8px" }}>{filter==="completed"?"No completed tasks":"All clear!"}</div>
            <div style={{ color:"#6b6760" }}>{filter==="active"?"Add a task to get started":"Nothing here yet"}</div>
          </div>
        ) : filtered.map(task => (
          <div key={task.id} style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"14px", padding:"14px 16px", marginBottom:"8px", display:"flex", alignItems:"flex-start", gap:"12px", opacity:task.completed?0.6:1, borderLeft:`3px solid ${PRIORITY_COLORS[task.priority]||G}` }}>
            <div onClick={() => toggleTask(task)} style={{ width:"22px", height:"22px", borderRadius:"50%", border:`2px solid ${task.completed?G:BORDER}`, background:task.completed?G:"transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, marginTop:"2px" }}>
              {task.completed && <span style={{ color:BG, fontSize:"12px", fontWeight:"800" }}>✓</span>}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:"15px", fontWeight:"600", color:"#f0ede8", textDecoration:task.completed?"line-through":"none", marginBottom:"3px" }}>{task.title}</div>
              {task.notes && <div style={{ fontSize:"12px", color:"#6b6760", marginBottom:"4px" }}>{task.notes}</div>}
              <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                {task.project && <span style={{ fontSize:"10px", background:"rgba(59,130,246,0.15)", color:"#3b82f6", borderRadius:"4px", padding:"2px 7px", fontWeight:"700" }}>{task.project}</span>}
                {task.dueDate && <span style={{ fontSize:"10px", color: new Date(task.dueDate)<new Date()&&!task.completed?"#ef4444":"#6b6760" }}>📅 {new Date(task.dueDate).toLocaleDateString("en-ZA",{day:"2-digit",month:"short"})}</span>}
                <span style={{ fontSize:"10px", color:PRIORITY_COLORS[task.priority]||G }}>{PRIORITY_LABELS[task.priority]||""}</span>
              </div>
            </div>
            <button onClick={() => deleteTask(task.id)} style={{ background:"none", border:"none", color:"#4a3030", fontSize:"16px", cursor:"pointer", flexShrink:0 }}>🗑️</button>
          </div>
        ))}
      </div>
    </div>
  );
}

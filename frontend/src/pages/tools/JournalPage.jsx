// PROJO GROUP — Journal Page
// Private daily journal with mood tracking and streak
import React, { useState, useEffect } from "react";
import Navbar from "../../components/ui/Navbar";
import api from "../../services/api";
import toast from "react-hot-toast";

const G="#e8b84b"; const BG="#0a0a0a"; const BG2="#111111"; const BG3="#1a1a1a"; const BORDER="rgba(232,184,75,0.15)";
const MOODS = [{ e:"😄", l:"Great", c:"#4ade80" },{ e:"🙂", l:"Good", c:"#e8b84b" },{ e:"😐", l:"Okay", c:"#6b7280" },{ e:"😔", l:"Low", c:"#f59e0b" },{ e:"😢", l:"Bad", c:"#ef4444" }];

export default function JournalPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView]       = useState("list"); // list | write | read
  const [selected, setSelected] = useState(null);
  const [form, setForm]       = useState({ title:"", body:"", mood:"😄" });
  const [saving, setSaving]   = useState(false);
  const today = new Date().toLocaleDateString("en-ZA",{weekday:"long",day:"numeric",month:"long",year:"numeric"});

  useEffect(() => { loadEntries(); }, []);

  async function loadEntries() {
    setLoading(true);
    try {
      const data = await api.get("/tools/journal");
      setEntries(data.entries || []);
    } catch { toast.error("Could not load journal"); }
    setLoading(false);
  }

  async function saveEntry() {
    if (!form.body.trim()) return toast.error("Write something first");
    setSaving(true);
    try {
      if (selected) {
        const data = await api.put(`/tools/journal/${selected.id}`, form);
        setEntries(p => p.map(e => e.id === selected.id ? data.entry : e));
      } else {
        const data = await api.post("/tools/journal", { ...form, title: form.title || today });
        setEntries(p => [data.entry, ...p]);
      }
      toast.success("Entry saved ✓");
      setView("list"); setSelected(null); setForm({ title:"", body:"", mood:"😄" });
    } catch { toast.error("Could not save"); }
    setSaving(false);
  }

  async function deleteEntry(id) {
    if (!window.confirm("Delete this entry?")) return;
    try { await api.delete(`/tools/journal/${id}`); setEntries(p => p.filter(e => e.id !== id)); toast.success("Deleted"); setView("list"); }
    catch { toast.error("Could not delete"); }
  }

  function openNew() { setSelected(null); setForm({ title: today, body:"", mood:"😄" }); setView("write"); }
  function openRead(entry) { setSelected(entry); setView("read"); }
  function openEdit(entry) { setSelected(entry); setForm({ title:entry.title, body:entry.body, mood:entry.mood||"😄" }); setView("write"); }

  const streak = (() => {
    let s = 0; const today = new Date(); today.setHours(0,0,0,0);
    for (let i = 0; i < 365; i++) {
      const d = new Date(today); d.setDate(d.getDate()-i);
      const hasEntry = entries.some(e => { const ed = new Date(e.createdAt); ed.setHours(0,0,0,0); return ed.getTime()===d.getTime(); });
      if (hasEntry) s++; else break;
    }
    return s;
  })();

  const inp = { width:"100%", background:BG3, border:`1px solid ${BORDER}`, borderRadius:"10px", color:"#f0ede8", padding:"11px 14px", fontSize:"14px", outline:"none", fontFamily:"'DM Sans',sans-serif", boxSizing:"border-box", marginBottom:"10px" };

  // WRITE VIEW
  if (view === "write") return (
    <div style={{ background:BG, minHeight:"100vh", color:"#f0ede8", fontFamily:"'DM Sans',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth:"680px", margin:"0 auto", padding:"80px 1rem 2rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.5rem" }}>
          <button onClick={() => setView("list")} style={{ background:"none", border:"none", color:G, fontSize:"14px", cursor:"pointer" }}>← Back</button>
          <div style={{ display:"flex", gap:"8px" }}>
            {selected && <button onClick={() => deleteEntry(selected.id)} style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:"8px", padding:"8px 14px", color:"#ef4444", fontSize:"13px", cursor:"pointer" }}>Delete</button>}
            <button onClick={saveEntry} disabled={saving} style={{ background:G, border:"none", borderRadius:"8px", padding:"8px 20px", color:BG, fontWeight:"700", cursor:"pointer" }}>{saving?"Saving...":"Save Entry"}</button>
          </div>
        </div>
        <div style={{ fontSize:"12px", color:"#6b6760", marginBottom:"8px" }}>{today}</div>
        <input value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} placeholder="Entry title..." style={{ ...inp, fontSize:"20px", fontWeight:"700", background:"transparent", border:"none", borderBottom:`2px solid ${G}`, borderRadius:0, padding:"8px 0" }} />
        <div style={{ marginBottom:"16px" }}>
          <div style={{ fontSize:"13px", color:"#6b6760", marginBottom:"8px" }}>How are you feeling?</div>
          <div style={{ display:"flex", gap:"10px" }}>
            {MOODS.map(m => (
              <button key={m.e} onClick={() => setForm(f=>({...f,mood:m.e}))} style={{ background:form.mood===m.e?`rgba(${m.c==="4ade80"?"74,222,128":m.c==="e8b84b"?"232,184,75":"107,114,128"},0.2)`:"transparent", border:`2px solid ${form.mood===m.e?m.c:"transparent"}`, borderRadius:"12px", padding:"8px 12px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:"3px" }}>
                <span style={{ fontSize:"24px" }}>{m.e}</span>
                <span style={{ fontSize:"10px", color:m.c, fontWeight:"700" }}>{m.l}</span>
              </button>
            ))}
          </div>
        </div>
        <textarea value={form.body} onChange={e => setForm(f=>({...f,body:e.target.value}))} placeholder={`Dear Journal,\n\nWhat's on your mind today?...`} rows={16} style={{ ...inp, resize:"vertical", minHeight:"320px", lineHeight:1.8 }} />
      </div>
    </div>
  );

  // READ VIEW
  if (view === "read" && selected) return (
    <div style={{ background:BG, minHeight:"100vh", color:"#f0ede8", fontFamily:"'DM Sans',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth:"680px", margin:"0 auto", padding:"80px 1rem 2rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.5rem" }}>
          <button onClick={() => setView("list")} style={{ background:"none", border:"none", color:G, fontSize:"14px", cursor:"pointer" }}>← Back</button>
          <button onClick={() => openEdit(selected)} style={{ background:G, border:"none", borderRadius:"8px", padding:"8px 20px", color:BG, fontWeight:"700", cursor:"pointer" }}>✏️ Edit</button>
        </div>
        <div style={{ fontSize:"28px", marginBottom:"8px" }}>{selected.mood}</div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"22px", fontWeight:"800", color:"#f0ede8", marginBottom:"6px" }}>{selected.title}</div>
        <div style={{ fontSize:"12px", color:"#6b6760", marginBottom:"2rem" }}>{new Date(selected.createdAt).toLocaleDateString("en-ZA",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
        <div style={{ fontSize:"15px", color:"#d4c9b8", lineHeight:1.9, whiteSpace:"pre-wrap" }}>{selected.body}</div>
      </div>
    </div>
  );

  // LIST VIEW
  return (
    <div style={{ background:BG, minHeight:"100vh", color:"#f0ede8", fontFamily:"'DM Sans',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth:"680px", margin:"0 auto", padding:"80px 1rem 2rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"22px", fontWeight:"800" }}>📖 Journal</div>
            <div style={{ fontSize:"12px", color:"#6b6760" }}>{entries.length} entries</div>
          </div>
          <button onClick={openNew} style={{ background:G, border:"none", borderRadius:"10px", padding:"10px 20px", color:BG, fontWeight:"800", fontSize:"14px", cursor:"pointer" }}>✏️ Write</button>
        </div>

        {streak > 0 && (
          <div style={{ background:"rgba(232,184,75,0.08)", border:`1px solid ${BORDER}`, borderRadius:"14px", padding:"14px 16px", marginBottom:"1.25rem", display:"flex", alignItems:"center", gap:"12px" }}>
            <div style={{ fontSize:"32px" }}>🔥</div>
            <div>
              <div style={{ fontWeight:"700", color:G }}>{streak} day streak!</div>
              <div style={{ fontSize:"12px", color:"#6b6760" }}>Keep writing every day</div>
            </div>
          </div>
        )}

        {loading ? <div style={{ textAlign:"center", padding:"3rem", color:"#6b6760" }}>Loading...</div> :
         entries.length === 0 ? (
          <div style={{ textAlign:"center", padding:"4rem 2rem" }}>
            <div style={{ fontSize:"48px", marginBottom:"12px" }}>📖</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"18px", fontWeight:"700", marginBottom:"8px" }}>Your journal awaits</div>
            <div style={{ color:"#6b6760", marginBottom:"20px" }}>Start writing your first entry</div>
            <button onClick={openNew} style={{ background:G, border:"none", borderRadius:"10px", padding:"12px 28px", color:BG, fontWeight:"800", cursor:"pointer" }}>Write First Entry</button>
          </div>
        ) : entries.map(entry => (
          <div key={entry.id} onClick={() => openRead(entry)} style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"14px", padding:"16px", marginBottom:"10px", cursor:"pointer", display:"flex", gap:"14px", alignItems:"flex-start" }}
            onMouseEnter={e => e.currentTarget.style.borderColor=G}
            onMouseLeave={e => e.currentTarget.style.borderColor=BORDER}>
            <div style={{ fontSize:"28px" }}>{entry.mood || "📝"}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:"700", fontSize:"15px", color:"#f0ede8", marginBottom:"4px" }}>{entry.title}</div>
              <div style={{ fontSize:"12px", color:"#6b6760", marginBottom:"6px" }}>{new Date(entry.createdAt).toLocaleDateString("en-ZA",{weekday:"short",day:"2-digit",month:"short",year:"numeric"})}</div>
              {entry.body && <div style={{ fontSize:"13px", color:"#a8a49e", lineHeight:1.5 }}>{entry.body.slice(0,100)}...</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

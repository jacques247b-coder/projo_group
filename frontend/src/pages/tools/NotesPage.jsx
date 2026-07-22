// PROJO GROUP — Notes Page
// Full-featured notes with folders, tags, pin, search, rich editor
import React, { useState, useEffect, useRef } from "react";
import Navbar from "../../components/ui/Navbar";
import api from "../../services/api";
import toast from "react-hot-toast";

const G = "#e8b84b"; const BG = "#0a0a0a"; const BG2 = "#111111"; const BG3 = "#1a1a1a";
const BORDER = "rgba(232,184,75,0.15)"; const RED = "#ef4444";

const FOLDERS = ["All Notes","Personal","Work","Ideas","Reminders","Other"];
const COLORS  = ["#e8b84b","#ef4444","#3b82f6","#10b981","#a78bfa","#f59e0b"];

export default function NotesPage() {
  const [notes, setNotes]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [folder, setFolder]     = useState("All Notes");
  const [search, setSearch]     = useState("");
  const [editing, setEditing]   = useState(null); // null | "new" | note object
  const [form, setForm]         = useState({ title:"", body:"", folder:"Personal", tags:"", pinned:false, color:"#e8b84b" });
  const [saving, setSaving]     = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => { loadNotes(); }, []);

  async function loadNotes() {
    setLoading(true);
    try {
      const data = await api.get("/tools/notes");
      setNotes(data.notes || []);
    } catch { toast.error("Could not load notes"); }
    setLoading(false);
  }

  async function saveNote() {
    if (!form.title.trim()) return toast.error("Title required");
    setSaving(true);
    try {
      if (editing === "new") {
        const data = await api.post("/tools/notes", form);
        setNotes(p => [data.note, ...p]);
        toast.success("Note saved ✓");
      } else {
        const data = await api.put(`/tools/notes/${editing.id}`, form);
        setNotes(p => p.map(n => n.id === editing.id ? data.note : n));
        toast.success("Note updated ✓");
      }
      setEditing(null);
    } catch { toast.error("Could not save note"); }
    setSaving(false);
  }

  async function deleteNote(id) {
    if (!window.confirm("Delete this note?")) return;
    try {
      await api.delete(`/tools/notes/${id}`);
      setNotes(p => p.filter(n => n.id !== id));
      toast.success("Deleted");
      if (editing?.id === id) setEditing(null);
    } catch { toast.error("Could not delete"); }
  }

  async function togglePin(note) {
    try {
      const data = await api.put(`/tools/notes/${note.id}`, { ...note, pinned: !note.pinned });
      setNotes(p => p.map(n => n.id === note.id ? data.note : n));
    } catch {}
  }

  function openNew() {
    setForm({ title:"", body:"", folder: folder !== "All Notes" ? folder : "Personal", tags:"", pinned:false, color:"#e8b84b" });
    setEditing("new");
    setTimeout(() => bodyRef.current?.focus(), 100);
  }

  function openEdit(note) {
    setForm({ title:note.title, body:note.body, folder:note.folder||"Personal", tags:note.tags||"", pinned:note.pinned, color:note.color||"#e8b84b" });
    setEditing(note);
  }

  const filtered = notes
    .filter(n => folder === "All Notes" || n.folder === folder)
    .filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.body?.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.updatedAt) - new Date(a.updatedAt));

  const pinned = filtered.filter(n => n.pinned);
  const rest   = filtered.filter(n => !n.pinned);

  const inp = { width:"100%", background:BG3, border:`1px solid ${BORDER}`, borderRadius:"10px", color:"#f0ede8", padding:"11px 14px", fontSize:"14px", outline:"none", fontFamily:"'DM Sans',sans-serif", boxSizing:"border-box", marginBottom:"10px" };

  // ── EDITOR ────────────────────────────────────────────────
  if (editing) return (
    <div style={{ background:BG, minHeight:"100vh", color:"#f0ede8", fontFamily:"'DM Sans',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth:"680px", margin:"0 auto", padding:"80px 1rem 2rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.5rem" }}>
          <button onClick={() => setEditing(null)} style={{ background:"none", border:"none", color:G, fontSize:"14px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>← Back</button>
          <div style={{ display:"flex", gap:"8px" }}>
            {editing !== "new" && <button onClick={() => deleteNote(editing.id)} style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:"8px", padding:"8px 14px", color:RED, fontSize:"13px", cursor:"pointer" }}>Delete</button>}
            <button onClick={saveNote} disabled={saving} style={{ background:G, border:"none", borderRadius:"8px", padding:"8px 20px", color:BG, fontWeight:"700", fontSize:"13px", cursor:"pointer" }}>{saving ? "Saving..." : "Save"}</button>
          </div>
        </div>

        {/* Color picker */}
        <div style={{ display:"flex", gap:"8px", marginBottom:"12px" }}>
          {COLORS.map(c => <div key={c} onClick={() => setForm(f=>({...f,color:c}))} style={{ width:"22px", height:"22px", borderRadius:"50%", background:c, cursor:"pointer", border:form.color===c?`3px solid white`:"3px solid transparent" }} />)}
        </div>

        <input value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} placeholder="Note title..." style={{ ...inp, fontSize:"20px", fontWeight:"700", background:"transparent", border:"none", borderBottom:`2px solid ${form.color}`, borderRadius:0, padding:"8px 0", marginBottom:"16px" }} />

        <textarea ref={bodyRef} value={form.body} onChange={e => setForm(f=>({...f,body:e.target.value}))} placeholder="Write your note here..." rows={14} style={{ ...inp, resize:"vertical", minHeight:"300px", lineHeight:1.7, marginBottom:"16px" }} />

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"10px" }}>
          <select value={form.folder} onChange={e => setForm(f=>({...f,folder:e.target.value}))} style={inp}>
            {FOLDERS.filter(f => f !== "All Notes").map(f => <option key={f}>{f}</option>)}
          </select>
          <input value={form.tags} onChange={e => setForm(f=>({...f,tags:e.target.value}))} placeholder="Tags (comma separated)" style={inp} />
        </div>

        <div onClick={() => setForm(f=>({...f,pinned:!f.pinned}))} style={{ display:"flex", alignItems:"center", gap:"10px", cursor:"pointer", padding:"8px 0" }}>
          <div style={{ width:"20px", height:"20px", borderRadius:"4px", border:`2px solid ${form.pinned?G:BORDER}`, background:form.pinned?"rgba(232,184,75,0.2)":"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
            {form.pinned && <span style={{ color:G, fontSize:"12px" }}>✓</span>}
          </div>
          <span style={{ fontSize:"13px", color:"#a8a49e" }}>📌 Pin this note</span>
        </div>
      </div>
    </div>
  );

  // ── LIST VIEW ─────────────────────────────────────────────
  return (
    <div style={{ background:BG, minHeight:"100vh", color:"#f0ede8", fontFamily:"'DM Sans',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth:"680px", margin:"0 auto", padding:"80px 1rem 2rem" }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem" }}>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"22px", fontWeight:"800", color:"#f0ede8" }}>📝 Notes</div>
            <div style={{ fontSize:"12px", color:"#6b6760" }}>{notes.length} notes</div>
          </div>
          <button onClick={openNew} style={{ background:G, border:"none", borderRadius:"10px", padding:"10px 20px", color:BG, fontWeight:"800", fontSize:"14px", cursor:"pointer" }}>+ New Note</button>
        </div>

        {/* Search */}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search notes..." style={{ ...inp, marginBottom:"16px" }} />

        {/* Folder tabs */}
        <div style={{ display:"flex", gap:"6px", overflowX:"auto", marginBottom:"1.5rem", paddingBottom:"4px" }}>
          {FOLDERS.map(f => (
            <button key={f} onClick={() => setFolder(f)} style={{ background:folder===f?"rgba(232,184,75,0.15)":BG2, border:`1px solid ${folder===f?G:BORDER}`, borderRadius:"20px", padding:"5px 14px", color:folder===f?G:"#6b6760", fontSize:"12px", fontWeight:"700", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>{f}</button>
          ))}
        </div>

        {loading ? <div style={{ textAlign:"center", padding:"3rem", color:"#6b6760" }}>Loading...</div> : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"4rem 2rem" }}>
            <div style={{ fontSize:"48px", marginBottom:"12px" }}>📝</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"18px", fontWeight:"700", color:"#f0ede8", marginBottom:"8px" }}>{search ? "No notes found" : "No notes yet"}</div>
            <div style={{ color:"#6b6760", marginBottom:"20px" }}>{search ? "Try a different search" : "Tap + New Note to get started"}</div>
          </div>
        ) : (
          <>
            {pinned.length > 0 && (
              <div style={{ marginBottom:"1.5rem" }}>
                <div style={{ fontSize:"11px", color:"#6b6760", fontWeight:"700", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"10px" }}>📌 Pinned</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                  {pinned.map(note => <NoteCard key={note.id} note={note} onEdit={openEdit} onPin={togglePin} onDelete={deleteNote} />)}
                </div>
              </div>
            )}
            {rest.length > 0 && (
              <div>
                {pinned.length > 0 && <div style={{ fontSize:"11px", color:"#6b6760", fontWeight:"700", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"10px" }}>All Notes</div>}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                  {rest.map(note => <NoteCard key={note.id} note={note} onEdit={openEdit} onPin={togglePin} onDelete={deleteNote} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function NoteCard({ note, onEdit, onPin, onDelete }) {
  const BG2 = "#111111"; const BORDER = "rgba(232,184,75,0.15)";
  return (
    <div onClick={() => onEdit(note)} style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"14px", padding:"14px", cursor:"pointer", position:"relative", borderLeft:`3px solid ${note.color||"#e8b84b"}`, transition:"transform 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.transform="translateY(-2px)"}
      onMouseLeave={e => e.currentTarget.style.transform="translateY(0)"}>
      <div style={{ fontWeight:"700", fontSize:"14px", color:"#f0ede8", marginBottom:"6px", lineHeight:1.3 }}>{note.title}</div>
      {note.body && <div style={{ fontSize:"12px", color:"#6b6760", lineHeight:1.5, marginBottom:"8px" }}>{note.body.slice(0,80)}{note.body.length>80?"...":""}</div>}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:"10px", color:"#4a3030" }}>{note.folder} · {new Date(note.updatedAt).toLocaleDateString("en-ZA",{day:"2-digit",month:"short"})}</div>
        <div style={{ display:"flex", gap:"6px" }} onClick={e => e.stopPropagation()}>
          <button onClick={() => onPin(note)} style={{ background:"none", border:"none", color:note.pinned?"#e8b84b":"#4a3030", fontSize:"14px", cursor:"pointer" }}>📌</button>
          <button onClick={() => onDelete(note.id)} style={{ background:"none", border:"none", color:"#4a3030", fontSize:"14px", cursor:"pointer" }}>🗑️</button>
        </div>
      </div>
    </div>
  );
}

// PROJO GROUP — Community Noticeboard
import React, { useState, useEffect } from "react";
import Navbar from "../../components/ui/Navbar";
import api from "../../services/api";
import toast from "react-hot-toast";

const G="#e8b84b"; const BG="#0a0a0a"; const BG2="#111111"; const BG3="#1a1a1a"; const BORDER="rgba(232,184,75,0.15)";
const CATS=["All","Lost & Found","Safety Alert","Missing Pet","Community Event","Announcement","For Sale","Request","Other"];
const CAT_COLORS={
  "Lost & Found":"#f59e0b","Safety Alert":"#ef4444","Missing Pet":"#a78bfa",
  "Community Event":"#3b82f6","Announcement":"#10b981","For Sale":"#e8b84b",
  "Request":"#6b7280","Other":"#6b7280"
};
const CAT_ICONS={
  "Lost & Found":"🔍","Safety Alert":"🚨","Missing Pet":"🐾",
  "Community Event":"🎉","Announcement":"📢","For Sale":"🏷️",
  "Request":"🙏","Other":"📋"
};

export default function NoticeboardPage() {
  const [posts, setPosts]=useState([]); const [loading, setLoading]=useState(true);
  const [cat, setCat]=useState("All"); const [search, setSearch]=useState("");
  const [showForm, setShowForm]=useState(false); const [selected, setSelected]=useState(null);
  const [form, setForm]=useState({title:"",body:"",category:"Announcement",location:"Rustenburg",phone:"",urgent:false});
  const [saving, setSaving]=useState(false); const [comment, setComment]=useState("");

  useEffect(()=>{loadPosts();},[cat]);
  async function loadPosts(){setLoading(true);try{const d=await api.get(`/community/noticeboard${cat!=="All"?`?category=${cat}`:""}`);setPosts(d.posts||[]);}catch{}setLoading(false);}
  async function post(){
    if(!form.title.trim()||!form.body.trim())return toast.error("Title and content required");
    setSaving(true);
    try{const d=await api.post("/community/noticeboard",form);setPosts(p=>[d.post,...p]);setShowForm(false);setForm({title:"",body:"",category:"Announcement",location:"Rustenburg",phone:"",urgent:false});toast.success("Posted! ✓");}
    catch{toast.error("Could not post");}
    setSaving(false);
  }
  async function upvote(id){try{const d=await api.post(`/community/noticeboard/${id}/upvote`);setPosts(p=>p.map(x=>x.id===id?{...x,upvotes:(x.upvotes||0)+1}:x));}catch{}}
  async function addComment(){
    if(!comment.trim()||!selected)return;
    try{const d=await api.post(`/community/noticeboard/${selected.id}/comments`,{body:comment});setSelected(s=>({...s,comments:[...(s.comments||[]),d.comment]}));setComment("");}
    catch{toast.error("Could not comment");}
  }

  const filtered=posts.filter(p=>(cat==="All"||p.category===cat)&&(!search||p.title.toLowerCase().includes(search.toLowerCase())));
  const inp={width:"100%",background:BG3,border:`1px solid ${BORDER}`,borderRadius:"10px",color:"#f0ede8",padding:"11px 14px",fontSize:"14px",outline:"none",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",marginBottom:"10px"};

  if(selected) return (
    <div style={{background:BG,minHeight:"100vh",color:"#f0ede8",fontFamily:"'DM Sans',sans-serif"}}>
      <Navbar/>
      <div style={{maxWidth:"680px",margin:"0 auto",padding:"80px 1rem 2rem"}}>
        <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:G,fontSize:"14px",cursor:"pointer",marginBottom:"1rem"}}>← Back</button>
        <div style={{background:BG2,border:`1px solid ${BORDER}`,borderRadius:"16px",padding:"1.5rem",marginBottom:"1rem"}}>
          <div style={{display:"flex",gap:"8px",alignItems:"center",marginBottom:"8px"}}>
            <span style={{fontSize:"20px"}}>{CAT_ICONS[selected.category]||"📋"}</span>
            <span style={{fontSize:"11px",fontWeight:"700",color:CAT_COLORS[selected.category]||G,background:`${CAT_COLORS[selected.category]||G}22`,borderRadius:"6px",padding:"2px 8px"}}>{selected.category}</span>
            {selected.urgent&&<span style={{fontSize:"11px",fontWeight:"700",color:"#ef4444",background:"rgba(239,68,68,0.15)",borderRadius:"6px",padding:"2px 8px"}}>🚨 URGENT</span>}
          </div>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:"20px",fontWeight:"800",color:"#f0ede8",marginBottom:"8px"}}>{selected.title}</div>
          <div style={{fontSize:"12px",color:"#6b6760",marginBottom:"1rem"}}>📍 {selected.location} · {new Date(selected.createdAt).toLocaleDateString("en-ZA",{day:"2-digit",month:"short",year:"numeric"})}</div>
          <div style={{fontSize:"14px",color:"#d4c9b8",lineHeight:1.7,whiteSpace:"pre-wrap",marginBottom:"1rem"}}>{selected.body}</div>
          {selected.phone&&<a href={`tel:${selected.phone}`} style={{display:"inline-block",background:"rgba(74,222,128,0.1)",border:"1px solid rgba(74,222,128,0.3)",borderRadius:"8px",padding:"8px 16px",color:"#4ade80",textDecoration:"none",fontSize:"13px",fontWeight:"700",marginBottom:"1rem"}}>📞 {selected.phone}</a>}
          <button onClick={()=>upvote(selected.id)} style={{background:"rgba(232,184,75,0.1)",border:`1px solid ${BORDER}`,borderRadius:"8px",padding:"8px 16px",color:G,fontSize:"13px",fontWeight:"700",cursor:"pointer"}}>👍 {selected.upvotes||0} Helpful</button>
        </div>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:"15px",fontWeight:"800",marginBottom:"10px"}}>Comments</div>
        {(selected.comments||[]).map((c,i)=>(
          <div key={i} style={{background:BG2,border:`1px solid ${BORDER}`,borderRadius:"12px",padding:"12px",marginBottom:"8px"}}>
            <div style={{fontSize:"13px",color:"#f0ede8"}}>{c.body}</div>
            <div style={{fontSize:"10px",color:"#6b6760",marginTop:"4px"}}>{c.userName||"Community member"}</div>
          </div>
        ))}
        <div style={{display:"flex",gap:"8px",marginTop:"12px"}}>
          <input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Add a comment..." style={{...inp,marginBottom:0,flex:1}} onKeyDown={e=>e.key==="Enter"&&addComment()}/>
          <button onClick={addComment} style={{background:G,border:"none",borderRadius:"10px",padding:"10px 16px",color:BG,fontWeight:"800",cursor:"pointer"}}>→</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{background:BG,minHeight:"100vh",color:"#f0ede8",fontFamily:"'DM Sans',sans-serif"}}>
      <Navbar/>
      <div style={{maxWidth:"680px",margin:"0 auto",padding:"80px 1rem 2rem"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
          <div><div style={{fontFamily:"'Syne',sans-serif",fontSize:"22px",fontWeight:"800"}}>📋 Noticeboard</div><div style={{fontSize:"12px",color:"#6b6760"}}>Rustenburg community board</div></div>
          <button onClick={()=>setShowForm(s=>!s)} style={{background:G,border:"none",borderRadius:"10px",padding:"10px 16px",color:BG,fontWeight:"800",fontSize:"13px",cursor:"pointer"}}>+ Post</button>
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search notices..." style={{...inp,marginBottom:"12px"}}/>
        <div style={{display:"flex",gap:"6px",overflowX:"auto",marginBottom:"1rem",paddingBottom:"4px"}}>
          {CATS.map(c=><button key={c} onClick={()=>setCat(c)} style={{background:cat===c?"rgba(232,184,75,0.15)":BG2,border:`1px solid ${cat===c?G:BORDER}`,borderRadius:"20px",padding:"5px 12px",color:cat===c?G:"#6b6760",fontSize:"11px",fontWeight:"700",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>{CAT_ICONS[c]||""} {c}</button>)}
        </div>
        {showForm&&(
          <div style={{background:BG2,border:`1px solid ${BORDER}`,borderRadius:"16px",padding:"1.25rem",marginBottom:"1rem"}}>
            <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={inp}>{CATS.filter(c=>c!=="All").map(c=><option key={c}>{c}</option>)}</select>
            <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Title *" style={inp}/>
            <textarea value={form.body} onChange={e=>setForm(f=>({...f,body:e.target.value}))} placeholder="Details... *" rows={4} style={{...inp,resize:"none"}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
              <input value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} placeholder="Location" style={{...inp,marginBottom:0}}/>
              <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="Contact number" style={{...inp,marginBottom:0}}/>
            </div>
            <div onClick={()=>setForm(f=>({...f,urgent:!f.urgent}))} style={{display:"flex",alignItems:"center",gap:"10px",cursor:"pointer",margin:"10px 0"}}>
              <div style={{width:"20px",height:"20px",borderRadius:"4px",border:`2px solid ${form.urgent?"#ef4444":BORDER}`,background:form.urgent?"rgba(239,68,68,0.2)":"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                {form.urgent&&<span style={{color:"#ef4444",fontSize:"12px"}}>✓</span>}
              </div>
              <span style={{fontSize:"13px",color:"#a8a49e"}}>🚨 Mark as Urgent</span>
            </div>
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={post} disabled={saving} style={{flex:1,background:G,border:"none",borderRadius:"10px",padding:"12px",color:BG,fontWeight:"800",cursor:"pointer"}}>{saving?"Posting...":"Post Notice"}</button>
              <button onClick={()=>setShowForm(false)} style={{background:BG3,border:`1px solid ${BORDER}`,borderRadius:"10px",padding:"12px 18px",color:"#6b6760",cursor:"pointer"}}>Cancel</button>
            </div>
          </div>
        )}
        {loading?<div style={{textAlign:"center",padding:"3rem",color:"#6b6760"}}>Loading...</div>:filtered.length===0?
          <div style={{textAlign:"center",padding:"4rem"}}><div style={{fontSize:"48px",marginBottom:"12px"}}>📋</div><div style={{fontFamily:"'Syne',sans-serif",fontSize:"18px",fontWeight:"700"}}>No notices yet</div><div style={{color:"#6b6760"}}>Be first to post!</div></div>:
          filtered.map(post=>(
            <div key={post.id} onClick={()=>setSelected(post)} style={{background:BG2,border:`1px solid ${post.urgent?"rgba(239,68,68,0.4)":BORDER}`,borderRadius:"14px",padding:"14px 16px",marginBottom:"10px",cursor:"pointer",borderLeft:`3px solid ${CAT_COLORS[post.category]||G}`}}
              onMouseEnter={e=>e.currentTarget.style.borderLeftColor=G}
              onMouseLeave={e=>e.currentTarget.style.borderLeftColor=CAT_COLORS[post.category]||G}>
              <div style={{display:"flex",gap:"8px",alignItems:"center",marginBottom:"6px"}}>
                <span>{CAT_ICONS[post.category]||"📋"}</span>
                <span style={{fontSize:"10px",fontWeight:"700",color:CAT_COLORS[post.category]||G}}>{post.category}</span>
                {post.urgent&&<span style={{fontSize:"10px",fontWeight:"700",color:"#ef4444"}}>🚨 URGENT</span>}
              </div>
              <div style={{fontWeight:"700",fontSize:"15px",color:"#f0ede8",marginBottom:"4px"}}>{post.title}</div>
              <div style={{fontSize:"12px",color:"#6b6760",marginBottom:"6px"}}>{post.body?.slice(0,80)}...</div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:"11px",color:"#4a3030"}}>
                <span>📍 {post.location}</span>
                <span>👍 {post.upvotes||0} · 💬 {post.commentCount||0}</span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

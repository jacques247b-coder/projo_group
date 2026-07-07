// PROJO ADMIN — Dating Verification Review
import React, { useEffect, useState } from "react";
import { datingAPI } from "../../services/api";
import toast from "react-hot-toast";

const C = { bg:"#0D0F12", card:"#161A1F", border:"rgba(255,255,255,0.08)", text:"#F1F3F5", muted:"#8A93A0", good:"#2ED9B4", danger:"#E05252" };

export default function DatingVerificationPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await datingAPI.adminListPendingVerifications();
      setRequests(res.requests || []);
    } catch { toast.error("Failed to load verification requests"); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function approve(id) {
    try { await datingAPI.adminApproveVerification(id); toast.success("Approved"); load(); }
    catch { toast.error("Failed"); }
  }
  async function reject(id) {
    try { await datingAPI.adminRejectVerification(id, "Photo unclear or doesn't match profile"); toast.success("Rejected"); load(); }
    catch { toast.error("Failed"); }
  }

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'Inter',sans-serif", padding:"1.5rem" }}>
      <div style={{ maxWidth:700, margin:"0 auto" }}>
        <div style={{ fontSize:"22px", fontWeight:700, marginBottom:"4px" }}>Dating Verification Review</div>
        <div style={{ fontSize:"13px", color:C.muted, marginBottom:"1.25rem" }}>Approve or reject selfie verification requests from PROJO Dating.</div>
        <button onClick={load} style={{ marginBottom:"1rem", padding:"8px 14px", borderRadius:"8px", fontSize:"12.5px", background:"transparent", border:`1px solid ${C.border}`, color:C.muted, cursor:"pointer" }}>↻ Refresh</button>
        {loading ? (
          <div style={{ color:C.muted }}>Loading…</div>
        ) : requests.length === 0 ? (
          <div style={{ color:C.muted, textAlign:"center", padding:"2.5rem 0" }}>No pending verification requests.</div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            {requests.map(r => (
              <div key={r.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:"12px", padding:"14px", display:"flex", gap:"14px", alignItems:"center" }}>
                <img src={r.selfieUrl} alt="selfie" style={{ width:80, height:80, borderRadius:"10px", objectFit:"cover", flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600 }}>{r.profile?.displayName}, {r.profile?.age}</div>
                  <div style={{ fontSize:"12px", color:C.muted }}>{r.profile?.city}</div>
                  <div style={{ fontSize:"11px", color:C.muted, marginTop:"2px" }}>Submitted {new Date(r.createdAt).toLocaleString()}</div>
                </div>
                <div style={{ display:"flex", gap:"8px", flexShrink:0 }}>
                  <button onClick={() => approve(r.id)} style={{ background:"transparent", border:`1px solid ${C.good}66`, color:C.good, borderRadius:"6px", padding:"6px 12px", fontSize:"12px", cursor:"pointer" }}>Approve</button>
                  <button onClick={() => reject(r.id)} style={{ background:"transparent", border:`1px solid ${C.danger}66`, color:C.danger, borderRadius:"6px", padding:"6px 12px", fontSize:"12px", cursor:"pointer" }}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

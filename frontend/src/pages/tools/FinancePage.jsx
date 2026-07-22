// PROJO GROUP — Personal Finance Tracker
import React, { useState, useEffect } from "react";
import Navbar from "../../components/ui/Navbar";
import api from "../../services/api";
import toast from "react-hot-toast";

const G="#e8b84b"; const BG="#0a0a0a"; const BG2="#111111"; const BG3="#1a1a1a"; const BORDER="rgba(232,184,75,0.15)";
const CATS_EXPENSE = ["Food & Drink","Transport","Housing","Utilities","Shopping","Health","Entertainment","Education","Savings","Other"];
const CATS_INCOME  = ["Salary","Freelance","Business","Investment","Gift","Other"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function FinancePage() {
  const [expenses, setExpenses]   = useState([]);
  const [income, setIncome]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState("overview");
  const [showForm, setShowForm]   = useState(false);
  const [formType, setFormType]   = useState("expense");
  const [form, setForm]           = useState({ amount:"", description:"", category:"Food & Drink", date: new Date().toISOString().split("T")[0] });
  const [saving, setSaving]       = useState(false);
  const now = new Date();
  const [month, setMonth]         = useState(now.getMonth());
  const [year]                    = useState(now.getFullYear());

  useEffect(() => { loadAll(); }, []);
  async function loadAll() {
    setLoading(true);
    try {
      const [ed, id] = await Promise.all([api.get("/tools/finance/expenses"), api.get("/tools/finance/income")]);
      setExpenses(ed.expenses || []); setIncome(id.income || []);
    } catch { toast.error("Could not load finance data"); }
    setLoading(false);
  }

  async function addEntry() {
    if (!form.amount || isNaN(form.amount) || parseFloat(form.amount) <= 0) return toast.error("Valid amount required");
    if (!form.description.trim()) return toast.error("Description required");
    setSaving(true);
    try {
      if (formType === "expense") {
        const data = await api.post("/tools/finance/expenses", { ...form, amount: parseFloat(form.amount) });
        setExpenses(p => [data.expense, ...p]);
      } else {
        const data = await api.post("/tools/finance/income", { ...form, amount: parseFloat(form.amount) });
        setIncome(p => [data.income, ...p]);
      }
      setForm({ amount:"", description:"", category: formType==="expense"?"Food & Drink":"Salary", date: new Date().toISOString().split("T")[0] });
      setShowForm(false); toast.success("Added ✓");
    } catch { toast.error("Could not save"); }
    setSaving(false);
  }

  async function deleteEntry(type, id) {
    try {
      await api.delete(`/tools/finance/${type}/${id}`);
      if (type === "expenses") setExpenses(p => p.filter(e => e.id !== id));
      else setIncome(p => p.filter(i => i.id !== id));
    } catch {}
  }

  const monthExpenses = expenses.filter(e => { const d = new Date(e.date||e.createdAt); return d.getMonth()===month && d.getFullYear()===year; });
  const monthIncome   = income.filter(i =>   { const d = new Date(i.date||i.createdAt); return d.getMonth()===month && d.getFullYear()===year; });
  const totalExp = monthExpenses.reduce((s,e) => s + parseFloat(e.amount||0), 0);
  const totalInc = monthIncome.reduce((s,i)   => s + parseFloat(i.amount||0), 0);
  const balance  = totalInc - totalExp;

  const catBreakdown = CATS_EXPENSE.map(cat => ({
    cat, amount: monthExpenses.filter(e => e.category===cat).reduce((s,e) => s+parseFloat(e.amount||0),0)
  })).filter(c => c.amount > 0).sort((a,b) => b.amount-a.amount);

  const inp = { width:"100%", background:BG3, border:`1px solid ${BORDER}`, borderRadius:"10px", color:"#f0ede8", padding:"11px 14px", fontSize:"14px", outline:"none", fontFamily:"'DM Sans',sans-serif", boxSizing:"border-box", marginBottom:"10px" };
  const fmt = (n) => `R${parseFloat(n||0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,",")}`;

  return (
    <div style={{ background:BG, minHeight:"100vh", color:"#f0ede8", fontFamily:"'DM Sans',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth:"680px", margin:"0 auto", padding:"80px 1rem 2rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"22px", fontWeight:"800" }}>💰 Finance</div>
          <button onClick={() => { setShowForm(s=>!s); setFormType("expense"); setForm(f=>({...f,category:"Food & Drink"})); }} style={{ background:G, border:"none", borderRadius:"10px", padding:"10px 16px", color:BG, fontWeight:"800", fontSize:"13px", cursor:"pointer" }}>+ Add</button>
        </div>

        {/* Month selector */}
        <div style={{ display:"flex", gap:"6px", overflowX:"auto", marginBottom:"1rem", paddingBottom:"4px" }}>
          {MONTHS.map((m,i) => (
            <button key={m} onClick={() => setMonth(i)} style={{ background:month===i?"rgba(232,184,75,0.15)":BG2, border:`1px solid ${month===i?G:BORDER}`, borderRadius:"20px", padding:"5px 12px", color:month===i?G:"#6b6760", fontSize:"12px", fontWeight:"700", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>{m}</button>
          ))}
        </div>

        {/* Summary cards */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px", marginBottom:"1.25rem" }}>
          {[["Income","#4ade80",totalInc],["Expenses","#ef4444",totalExp],["Balance",balance>=0?"#4ade80":"#ef4444",balance]].map(([l,c,v]) => (
            <div key={l} style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"14px", padding:"14px", textAlign:"center" }}>
              <div style={{ fontSize:"10px", color:"#6b6760", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"4px" }}>{l}</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"16px", fontWeight:"800", color:c }}>{fmt(Math.abs(v))}</div>
              {l==="Balance" && <div style={{ fontSize:"10px", color:c }}>{v>=0?"surplus":"deficit"}</div>}
            </div>
          ))}
        </div>

        {/* Add form */}
        {showForm && (
          <div style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"16px", padding:"1.25rem", marginBottom:"1rem" }}>
            <div style={{ display:"flex", gap:"8px", marginBottom:"12px" }}>
              {["expense","income"].map(t => (
                <button key={t} onClick={() => { setFormType(t); setForm(f=>({...f,category:t==="expense"?"Food & Drink":"Salary"})); }} style={{ flex:1, background:formType===t?"rgba(232,184,75,0.15)":BG3, border:`1px solid ${formType===t?G:BORDER}`, borderRadius:"8px", padding:"8px", color:formType===t?G:"#6b6760", fontWeight:"700", cursor:"pointer", fontSize:"13px" }}>{t==="expense"?"💸 Expense":"💰 Income"}</button>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
              <input type="number" value={form.amount} onChange={e => setForm(f=>({...f,amount:e.target.value}))} placeholder="Amount (R)" style={{ ...inp, marginBottom:0 }} />
              <input type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} style={{ ...inp, marginBottom:0, colorScheme:"dark" }} />
            </div>
            <input value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} placeholder="Description" style={{ ...inp, marginTop:"10px" }} />
            <select value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))} style={inp}>
              {(formType==="expense"?CATS_EXPENSE:CATS_INCOME).map(c => <option key={c}>{c}</option>)}
            </select>
            <div style={{ display:"flex", gap:"8px" }}>
              <button onClick={addEntry} disabled={saving} style={{ flex:1, background:G, border:"none", borderRadius:"10px", padding:"11px", color:BG, fontWeight:"800", cursor:"pointer" }}>Add {formType}</button>
              <button onClick={() => setShowForm(false)} style={{ background:BG3, border:`1px solid ${BORDER}`, borderRadius:"10px", padding:"11px 18px", color:"#6b6760", cursor:"pointer" }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:"flex", gap:"8px", marginBottom:"1rem" }}>
          {[["overview","Overview"],["expenses","Expenses"],["income","Income"]].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ flex:1, background:tab===k?"rgba(232,184,75,0.15)":BG2, border:`1px solid ${tab===k?G:BORDER}`, borderRadius:"10px", padding:"9px", color:tab===k?G:"#6b6760", fontSize:"13px", fontWeight:"700", cursor:"pointer" }}>{l}</button>
          ))}
        </div>

        {loading ? <div style={{ textAlign:"center", padding:"2rem", color:"#6b6760" }}>Loading...</div> : (
          <>
            {tab === "overview" && (
              <div>
                {catBreakdown.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"3rem", color:"#6b6760" }}><div style={{ fontSize:"48px", marginBottom:"12px" }}>💰</div><div>No expenses this month</div></div>
                ) : catBreakdown.map(({ cat, amount }) => (
                  <div key={cat} style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"12px", padding:"12px 16px", marginBottom:"8px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
                      <span style={{ fontSize:"13px", color:"#f0ede8" }}>{cat}</span>
                      <span style={{ fontSize:"13px", fontWeight:"700", color:"#ef4444" }}>{fmt(amount)}</span>
                    </div>
                    <div style={{ background:BG3, borderRadius:"6px", height:"4px" }}>
                      <div style={{ background:"#ef4444", height:"100%", borderRadius:"6px", width:`${totalExp>0?(amount/totalExp)*100:0}%` }} />
                    </div>
                    <div style={{ fontSize:"10px", color:"#6b6760", marginTop:"3px" }}>{totalExp>0?((amount/totalExp)*100).toFixed(0):0}% of expenses</div>
                  </div>
                ))}
              </div>
            )}

            {(tab === "expenses" ? monthExpenses : monthIncome).length === 0 ? (
              <div style={{ textAlign:"center", padding:"3rem", color:"#6b6760" }}><div style={{ fontSize:"48px", marginBottom:"12px" }}>{tab==="expenses"?"💸":"💰"}</div><div>No {tab} this month</div></div>
            ) : (tab === "expenses" ? monthExpenses : monthIncome).sort((a,b) => new Date(b.date||b.createdAt)-new Date(a.date||a.createdAt)).map(item => (
              <div key={item.id} style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"12px", padding:"12px 16px", marginBottom:"8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:"14px", fontWeight:"600", color:"#f0ede8" }}>{item.description}</div>
                  <div style={{ fontSize:"11px", color:"#6b6760" }}>{item.category} · {new Date(item.date||item.createdAt).toLocaleDateString("en-ZA",{day:"2-digit",month:"short"})}</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                  <span style={{ fontSize:"15px", fontWeight:"800", color:tab==="expenses"?"#ef4444":"#4ade80" }}>{fmt(item.amount)}</span>
                  <button onClick={() => deleteEntry(tab, item.id)} style={{ background:"none", border:"none", color:"#4a3030", cursor:"pointer" }}>🗑️</button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

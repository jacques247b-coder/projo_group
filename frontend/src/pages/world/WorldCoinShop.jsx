// PROJO WORLD — Coin Shop + Daily Login Tracker
import React, { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

const G="#e8b84b"; const BG="#0a0a0a"; const BG2="#111111"; const BG3="#1a1a1a";
const BORDER="rgba(232,184,75,0.15)";

const COIN_PACKS = [
  { id:"starter", name:"Starter Pack", price:50, coins:5, bonus:0, popular:false },
  { id:"standard", name:"Standard Pack", price:100, coins:12, bonus:2, popular:true },
  { id:"gold", name:"Gold Pack", price:200, coins:25, bonus:5, popular:false },
  { id:"mega", name:"Mega Pack", price:500, coins:65, bonus:15, popular:false },
  { id:"elite", name:"Elite Pack", price:1000, coins:140, bonus:40, popular:false },
];

export default function WorldCoinShop({ coins, onCoinsUpdate }) {
  const [streak, setStreak]     = useState(null);
  const [catalog, setCatalog]   = useState([]);
  const [tab, setTab]           = useState("login");
  const [checkingIn, setCheckingIn] = useState(false);
  const [loginMsg, setLoginMsg] = useState(null);
  const [adminItems, setAdminItems] = useState([]);

  useEffect(() => {
    loadStreak();
    loadCatalog();
    checkIn();
  }, []);

  async function loadStreak() {
    try { const d = await api.get("/world/login-streak"); setStreak(d.streak); }
    catch {}
  }

  async function loadCatalog() {
    try {
      const d = await api.get("/world/catalog?category=COIN_PACK");
      setAdminItems(d.items || []);
    } catch {}
  }

  async function checkIn() {
    try {
      const d = await api.post("/world/login-check");
      setStreak(d.streak);
      setLoginMsg(d.message);
      if (d.coinEarned && !d.alreadyChecked) {
        toast.success("🎉 You earned 1 World Coin from daily login!");
        if (onCoinsUpdate) onCoinsUpdate();
      }
    } catch {}
  }

  async function buyCoinPack(pack) {
    toast("Payment integration coming soon! Contact admin to purchase coins.", { icon:"💳" });
  }

  const progress = streak ? (streak.todayProgress % 5) * 20 : 0;
  const days = streak?.todayProgress || 0;

  const inp = { background:BG3, border:`1px solid ${BORDER}`, borderRadius:"8px", color:"#f0ede8", padding:"9px 12px", fontSize:"13px", outline:"none", fontFamily:"'DM Sans',sans-serif", width:"100%", boxSizing:"border-box" };

  return (
    <div style={{ background:BG, color:"#f0ede8", fontFamily:"'DM Sans',sans-serif", padding:"1rem" }}>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"18px", fontWeight:"800", color:G, marginBottom:"1rem" }}>★ World Coins</div>

      <div style={{ display:"flex", gap:"8px", marginBottom:"1rem" }}>
        {[["login","📅 Daily Login"],["buy","💳 Buy Coins"],["earn","💡 How to Earn"]].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ flex:1, background:tab===k?"rgba(232,184,75,0.15)":BG2, border:`1px solid ${tab===k?G:BORDER}`, borderRadius:"10px", padding:"9px 4px", color:tab===k?G:"#6b6760", fontSize:"11px", fontWeight:"700", cursor:"pointer" }}>{l}</button>
        ))}
      </div>

      {/* DAILY LOGIN */}
      {tab === "login" && (
        <div>
          <div style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"14px", padding:"1.25rem", marginBottom:"1rem" }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"14px", fontWeight:"800", color:G, marginBottom:"4px" }}>Daily Login Reward</div>
            <div style={{ fontSize:"11px", color:"#6b6760", marginBottom:"1rem" }}>Log in 5 days in a row to earn 1 World Coin</div>

            {/* Progress visual */}
            <div style={{ display:"flex", gap:"6px", marginBottom:"10px" }}>
              {[1,2,3,4,5].map(day => {
                const done = (streak?.todayProgress || 0) >= day || (streak?.todayProgress === 0 && streak?.coinsFromLogins > 0 && day === 5);
                const current = (streak?.todayProgress || 0) === day;
                return (
                  <div key={day} style={{ flex:1, textAlign:"center" }}>
                    <div style={{ height:"40px", background:done?"rgba(232,184,75,0.2)":BG3, border:`2px solid ${done?G:current?"rgba(232,184,75,0.4)":BORDER}`, borderRadius:"8px", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"4px", fontSize:"16px" }}>
                      {done ? "★" : current ? "◎" : "○"}
                    </div>
                    <div style={{ fontSize:"9px", color:done?G:"#6b6760", fontWeight:"700" }}>Day {day}</div>
                    <div style={{ fontSize:"9px", color:"#4a3030" }}>{day*20}%</div>
                  </div>
                );
              })}
              <div style={{ flex:1, textAlign:"center" }}>
                <div style={{ height:"40px", background:"rgba(232,184,75,0.1)", border:`2px solid ${G}`, borderRadius:"8px", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"4px", fontSize:"20px" }}>🪙</div>
                <div style={{ fontSize:"9px", color:G, fontWeight:"700" }}>= 1 Coin</div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ background:BG3, borderRadius:"8px", height:"10px", marginBottom:"8px", overflow:"hidden" }}>
              <div style={{ background:`linear-gradient(90deg,${G},#f59e0b)`, height:"100%", borderRadius:"8px", width:`${Math.min(100,((streak?.todayProgress||0)/5)*100)}%`, transition:"width 0.6s" }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:"11px" }}>
              <span style={{ color:"#6b6760" }}>{loginMsg || `${(streak?.todayProgress||0)*20}% today`}</span>
              <span style={{ color:G, fontWeight:"700" }}>🔥 {streak?.currentStreak || 0} day streak</span>
            </div>

            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px", marginTop:"12px" }}>
              {[["📅","Total Days",streak?.totalDaysLogged||0],["🪙","Coins Earned",streak?.coinsFromLogins||0],["🔥","Best Streak",streak?.currentStreak||0]].map(([i,l,v]) => (
                <div key={l} style={{ background:BG3, borderRadius:"8px", padding:"8px", textAlign:"center" }}>
                  <div style={{ fontSize:"16px" }}>{i}</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"16px", fontWeight:"800", color:G }}>{v}</div>
                  <div style={{ fontSize:"9px", color:"#6b6760" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background:"rgba(232,184,75,0.04)", border:`1px solid ${BORDER}`, borderRadius:"10px", padding:"10px 12px", fontSize:"11px", color:"#6b6760", lineHeight:1.6 }}>
            💡 Your daily login is checked automatically when you open PROJO World. Each login = 20% progress. Miss a day and progress resets to 0%.
          </div>
        </div>
      )}

      {/* BUY COINS */}
      {tab === "buy" && (
        <div>
          <div style={{ fontSize:"12px", color:"#6b6760", marginBottom:"1rem" }}>Purchase World Coins instantly with real money. Coins never expire.</div>

          {/* Admin special offers */}
          {adminItems.filter(i => i.isSpecialOffer).length > 0 && (
            <div style={{ marginBottom:"1rem" }}>
              <div style={{ fontSize:"11px", color:"#ec4899", fontWeight:"700", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"6px" }}>🔥 Special Offers</div>
              {adminItems.filter(i => i.isSpecialOffer).map(item => (
                <div key={item.id} style={{ background:"rgba(236,72,153,0.08)", border:"2px solid rgba(236,72,153,0.4)", borderRadius:"14px", padding:"14px", marginBottom:"8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontWeight:"700", color:"#ec4899" }}>{item.icon} {item.name}</div>
                    <div style={{ fontSize:"11px", color:"#6b6760" }}>{item.coinsGranted} coins{item.bonusCoins?` + ${item.bonusCoins} BONUS`:""}</div>
                    {item.offerEndsAt && <div style={{ fontSize:"10px", color:"#f59e0b" }}>Ends {new Date(item.offerEndsAt).toLocaleDateString("en-ZA",{day:"2-digit",month:"short"})}</div>}
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"20px", fontWeight:"800", color:"#4ade80" }}>R{item.realPriceZar}</div>
                    <button onClick={() => buyCoinPack(item)} style={{ background:"#ec4899", border:"none", borderRadius:"8px", padding:"6px 14px", color:"white", fontSize:"12px", fontWeight:"700", cursor:"pointer", marginTop:"4px" }}>Buy Now</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Standard packs */}
          {COIN_PACKS.map(pack => (
            <div key={pack.id} style={{ background:pack.popular?"rgba(232,184,75,0.06)":BG2, border:`${pack.popular?"2px":"1px"} solid ${pack.popular?G:BORDER}`, borderRadius:"14px", padding:"14px", marginBottom:"8px", display:"flex", justifyContent:"space-between", alignItems:"center", position:"relative" }}>
              {pack.popular && <div style={{ position:"absolute", top:"-10px", left:"14px", background:G, color:BG, fontSize:"9px", fontWeight:"800", borderRadius:"10px", padding:"2px 10px" }}>MOST POPULAR</div>}
              <div>
                <div style={{ fontWeight:"700", color:"#f0ede8", fontSize:"14px" }}>★ {pack.name}</div>
                <div style={{ fontSize:"12px", color:G }}>
                  {pack.coins} coins{pack.bonus > 0 ? <span style={{ color:"#f59e0b" }}> + {pack.bonus} BONUS</span> : ""}
                </div>
                <div style={{ fontSize:"10px", color:"#6b6760" }}>= {pack.coins + pack.bonus} total coins</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"22px", fontWeight:"800", color:"#4ade80" }}>R{pack.price}</div>
                <button onClick={() => buyCoinPack(pack)} style={{ background:pack.popular?G:BG3, border:`1px solid ${pack.popular?G:BORDER}`, borderRadius:"8px", padding:"6px 16px", color:pack.popular?BG:"#f0ede8", fontSize:"12px", fontWeight:"700", cursor:"pointer", marginTop:"4px" }}>Buy</button>
              </div>
            </div>
          ))}
          <div style={{ background:"rgba(59,130,246,0.05)", border:"1px solid rgba(59,130,246,0.2)", borderRadius:"10px", padding:"10px 12px", fontSize:"11px", color:"#6b6760", marginTop:"8px", lineHeight:1.6 }}>
            💳 Secure payment via PayFast / EFT. Coins credited instantly. Contact admin@projogroup.co.za for bulk purchases.
          </div>
        </div>
      )}

      {/* HOW TO EARN */}
      {tab === "earn" && (
        <div>
          {[
            ["📅","Daily login","20% progress per day (5 days = 1 coin)"],
            ["👟","Move avatar","1 coin per click/step"],
            ["💬","Chat in rooms","1 coin per message"],
            ["🕺","Dance emote","5 coins per dance"],
            ["🗺️","Explore rooms","3 coins per room visit"],
            ["🤝","Meet people","2 coins per NPC interaction"],
            ["🎁","Open a gift","5 coins when you open a received gift"],
            ["🚗","Book a ride","1 coin per R100 spent on PROJO"],
            ["📦","PROJO delivery","1 coin per R100 spent on delivery"],
            ["💼","PROJO services","1 coin per R100 spent on any service"],
            ["⭐","Real loyalty","Your PROJO loyalty points mirror into world coins"],
          ].map(([icon, label, desc]) => (
            <div key={label} style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"10px", padding:"10px 12px", marginBottom:"6px", display:"flex", gap:"10px", alignItems:"center" }}>
              <div style={{ fontSize:"24px", width:"32px", textAlign:"center" }}>{icon}</div>
              <div>
                <div style={{ fontSize:"13px", fontWeight:"600", color:"#f0ede8" }}>{label}</div>
                <div style={{ fontSize:"11px", color:"#6b6760" }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

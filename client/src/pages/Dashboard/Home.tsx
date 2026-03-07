// client/src/pages/Dashboard/Home.tsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fetchUserProfile } from "../../api/userApi";
import { fetchPlans, deletePlan, extendPlan } from "../../api/planApi";
import { getPlanStats, getTodayStatus } from "../../api/dailyprogressApi";
import type { Plan } from "../../types/plan";
import type { TodayStatusResult } from "../../types/progress";
import foodBg from "../../assets/food-bg.jpg";

interface PlanStat { savedDays: number; daysOver: number; compliance: number; }

type TodayState =
  | "plan-new" | "not-started" | "tracking"
  | "exercise-pending" | "day-saved" | "plan-completed";

const STATE_CONFIG: Record<TodayState, { dot: string; label: string; color: string; icon: string }> = {
  "plan-new":         { dot: "#B0A090", label: "Not started",          color: "#8A7B6E", icon: "○" },
  "not-started":      { dot: "#E8A020", label: "Not tracked today",    color: "#B07010", icon: "◔" },
  "tracking":         { dot: "#5B8FE8", label: "Tracking in progress", color: "#2B5FC0", icon: "✎" },
  "exercise-pending": { dot: "#E87B5B", label: "Choose exercise",      color: "#C04820", icon: "⚡" },
  "day-saved":        { dot: "#4CAF82", label: "Today saved ✓",        color: "#2A7A52", icon: "✓" },
  "plan-completed":   { dot: "#E8A020", label: "Plan completed 🏆",    color: "#B07010", icon: "🏆" },
};

const fmt = (n: number) => Math.round(n).toLocaleString();

export default function Home() {
  const [user,        setUser]        = useState<any>(null);
  const [plans,       setPlans]       = useState<Plan[]>([]);
  const [planStats,   setPlanStats]   = useState<Record<string, PlanStat>>({});
  const [todayStates, setTodayStates] = useState<Record<string, TodayState>>({});
  const [loading,     setLoading]     = useState(true);
  const navigate = useNavigate();

  const [deleteTarget,     setDeleteTarget]     = useState<Plan | null>(null);
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deleteError,      setDeleteError]      = useState("");

  const [extendTarget,  setExtendTarget]  = useState<Plan | null>(null);
  const [extendDays,    setExtendDays]    = useState("7");
  const [extendLoading, setExtendLoading] = useState(false);
  const [extendError,   setExtendError]   = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    (async () => {
      try {
        const [userData, plansData] = await Promise.all([fetchUserProfile(token), fetchPlans()]);
        setUser(userData);
        setPlans(plansData);
        const [statsResults, todayResults] = await Promise.all([
          Promise.allSettled(plansData.map((p: Plan) => getPlanStats(p._id))),
          Promise.allSettled(plansData.map((p: Plan) => getTodayStatus(p._id))),
        ]);
        const statsMap: Record<string, PlanStat> = {};
        statsResults.forEach((result, i) => {
          if (result.status === "fulfilled") {
            const data = result.value.data ?? [];
            const savedDays = data.length;
            const daysOver = data.filter((d: any) => d.calories_exceeded > 0).length;
            const compliance = savedDays > 0 ? Math.round(((savedDays - daysOver) / savedDays) * 100) : 0;
            statsMap[plansData[i]._id] = { savedDays, daysOver, compliance };
          }
        });
        setPlanStats(statsMap);
        const stateMap: Record<string, TodayState> = {};
        todayResults.forEach((result, i) => {
          const plan = plansData[i] as Plan;
          if (plan.status === "completed") { stateMap[plan._id] = "plan-completed"; return; }
          const savedDays = statsMap[plan._id]?.savedDays ?? 0;
          if (result.status === "rejected" || result.value === undefined) {
            stateMap[plan._id] = savedDays === 0 ? "plan-new" : "not-started"; return;
          }
          const todayStatus = result.value as TodayStatusResult;
          if (!todayStatus.exists) { stateMap[plan._id] = savedDays === 0 ? "plan-new" : "not-started"; return; }
          if (todayStatus.status === "tracking") {
            stateMap[plan._id] = todayStatus.eaten_count > 0 ? "tracking" : "not-started";
          } else if (todayStatus.status === "recommendation") {
            stateMap[plan._id] = "exercise-pending";
          } else if (todayStatus.status === "saved") {
            stateMap[plan._id] = "day-saved";
          }
        });
        setTodayStates(stateMap);
      } catch {
        localStorage.removeItem("token");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const handleLogout = () => { localStorage.removeItem("token"); navigate("/login"); };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteConfirming(true); setDeleteError("");
    try {
      await deletePlan(deleteTarget._id);
      setPlans(prev => prev.filter(p => p._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (e: any) { setDeleteError(e.message || "Failed to delete."); }
    finally { setDeleteConfirming(false); }
  };

  const handleExtendConfirm = async () => {
    if (!extendTarget) return;
    const days = parseInt(extendDays);
    if (!days || days < 1) { setExtendError("Enter at least 1 day."); return; }
    setExtendLoading(true); setExtendError("");
    try {
      const updated = await extendPlan(extendTarget._id, days);
      setPlans(prev => prev.map(p => p._id === updated._id ? updated : p));
      setTodayStates(prev => ({ ...prev, [updated._id]: "not-started" }));
      setExtendTarget(null); setExtendDays("7");
    } catch (e: any) { setExtendError(e.message || "Failed to extend."); }
    finally { setExtendLoading(false); }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F5F0E8" }}>
      <div style={{ width: 32, height: 32, border: "3px solid #E8A020", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
    </div>
  );

  const macros  = user?.macro_targets;
  const initial = user?.username?.charAt(0).toUpperCase() || "U";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .fu  { animation: fadeUp 0.4s ease both; }
        .d1  { animation-delay: .07s; } .d2 { animation-delay: .14s; }
        .d3  { animation-delay: .21s; } .d4 { animation-delay: .28s; }
        .plan-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .plan-card:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.08) !important; }
        .nav-link { transition: color 0.18s, background 0.18s; }
        .nav-link:hover { color: #fff !important; background: rgba(255,255,255,0.07) !important; }
        .back-link-hover:hover { color: #E8A020 !important; }
        a { text-decoration: none; }
      `}</style>

      {/* ── Delete modal ── */}
      {deleteTarget && (
        <div style={modal.overlay}>
          <div style={modal.box}>
            <div style={{ width: 52, height: 52, background: "#FEE2E2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
              <svg width="22" height="22" fill="none" stroke="#EF4444" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 style={{ fontFamily: "'Lora', serif", fontSize: 22, fontWeight: 700, color: "#1A1612", textAlign: "center", marginBottom: 8 }}>Delete Plan?</h3>
            <p style={{ color: "#8A7B6E", textAlign: "center", fontSize: 14, marginBottom: 4 }}>
              Delete <strong style={{ color: "#1A1612" }}>"{deleteTarget.name}"</strong>?
            </p>
            <p style={{ color: "#F87171", textAlign: "center", fontSize: 13, marginBottom: 20 }}>All tracking data will be permanently removed.</p>
            {deleteError && <p style={{ color: "#EF4444", fontSize: 13, textAlign: "center", marginBottom: 12 }}>{deleteError}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setDeleteTarget(null); setDeleteError(""); }} disabled={deleteConfirming} style={modal.cancelBtn}>Cancel</button>
              <button onClick={handleDeleteConfirm} disabled={deleteConfirming} style={modal.deleteBtn}>
                {deleteConfirming ? <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Extend modal ── */}
      {extendTarget && (
        <div style={modal.overlay}>
          <div style={modal.box}>
            <div style={{ fontSize: 36, textAlign: "center", marginBottom: 14 }}>🏆</div>
            <h3 style={{ fontFamily: "'Lora', serif", fontSize: 22, fontWeight: 700, color: "#1A1612", textAlign: "center", marginBottom: 6 }}>Plan Completed!</h3>
            <p style={{ color: "#8A7B6E", textAlign: "center", fontSize: 14, marginBottom: 22 }}>
              <strong style={{ color: "#1A1612" }}>{extendTarget.name}</strong> is finished. Keep going?
            </p>
            <div style={{ background: "#FAF7F2", border: "1px solid #EDE5D8", borderRadius: 14, padding: "18px 16px", marginBottom: 12 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#A89880", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Extend the plan</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="number" min="1" max="365" value={extendDays}
                  onChange={e => { setExtendDays(e.target.value); setExtendError(""); }}
                  style={{ width: 72, border: "1.5px solid #EDE5D8", borderRadius: 10, padding: "8px 10px", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, textAlign: "center", outline: "none", background: "#fff" }} />
                <span style={{ fontSize: 13, color: "#8A7B6E" }}>more days</span>
                <button onClick={handleExtendConfirm} disabled={extendLoading}
                  style={{ marginLeft: "auto", background: "#1A1612", color: "#E8A020", border: "none", borderRadius: 10, padding: "10px 18px", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {extendLoading ? "…" : "Extend →"}
                </button>
              </div>
              {extendError && <p style={{ color: "#EF4444", fontSize: 12, marginTop: 8 }}>{extendError}</p>}
            </div>
            <button onClick={() => setExtendTarget(null)} style={{ width: "100%", padding: "12px", border: "1.5px solid #EDE5D8", borderRadius: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#6B5E52", background: "none", cursor: "pointer", marginBottom: 10 }}>
              No thanks, I'm done
            </button>
            <Link to={`/plans/${extendTarget._id}/stats`} onClick={() => setExtendTarget(null)}
              style={{ display: "block", textAlign: "center", fontSize: 13, color: "#E8A020", fontWeight: 600 }}>
              View plan statistics →
            </Link>
          </div>
        </div>
      )}

      {/* ── Root ── */}
      <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: "#F5F0E8" }}>

        {/* ══ SIDEBAR ══ */}
        <aside style={sb.root}>
          <div style={sb.glow} />

          {/* Logo */}
          <div style={{ marginBottom: 32, position: "relative", zIndex: 1 }} className="fu">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <svg width="18" height="18" fill="none" stroke="#E8A020" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v7a4 4 0 004 4h0a4 4 0 004-4V3M7 14v7M17 3a4 4 0 010 8v9" />
              </svg>
              <span style={{ fontFamily: "'Lora', serif", fontSize: 20, color: "#E8A020", fontWeight: 700, letterSpacing: "0.02em" }}>MealBudget</span>
            </div>
            <p style={{ fontSize: 10, color: "#4A3D32", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 600 }}>Planning App</p>
          </div>

          {/* Avatar */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 28, position: "relative", zIndex: 1 }} className="fu d1">
            <div style={{ width: 76, height: 76, borderRadius: "50%", background: "#E8A020", display: "flex", alignItems: "center", justifyContent: "center", color: "#1A1612", fontSize: 28, fontWeight: 700, marginBottom: 14, overflow: "hidden", boxShadow: "0 4px 20px rgba(232,160,32,0.35)", border: "3px solid rgba(232,160,32,0.3)", flexShrink: 0 }}>
              {user?.profile_picture ? <img src={user.profile_picture} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initial}
            </div>
            <p style={{ fontFamily: "'Lora', serif", fontSize: 22, color: "#FFFFFF", fontWeight: 600, lineHeight: 1.2, marginBottom: 4 }}>{user?.username || "User"}</p>
            <p style={{ fontSize: 12, color: "#5A4D42", marginBottom: 10, wordBreak: "break-all" }}>{user?.email || ""}</p>
            <Link to="/profile" className="back-link-hover" style={{ fontSize: 12, color: "#7A6A5E", fontWeight: 500 }}>Edit Profile ✎</Link>
            <button onClick={handleLogout} style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#5A4D42", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
              </svg>
              Logout
            </button>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginBottom: 20 }} />

          {/* Stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 24, position: "relative", zIndex: 1 }} className="fu d2">
            {[
              { label: "Sex",      value: user?.gender         || "—" },
              { label: "Weight",   value: user?.weight         ? `${user.weight} Kg` : "—" },
              { label: "Height",   value: user?.height         ? `${user.height} Cm` : "—" },
              { label: "Goal",     value: user?.fitness_goal   || "Not set" },
              { label: "Activity", value: user?.activity_level || "Not set" },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: 10, color: "#4A3D32", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>{item.label}</span>
                <span style={{ fontSize: 14, color: "#D0C4B4", fontWeight: 600, textAlign: "right", maxWidth: 140, textTransform: "capitalize" }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Nav */}
          <nav style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: "auto", position: "relative", zIndex: 1 }} className="fu d3">
            {[
              { to: "/food",          icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v7a4 4 0 004 4h0a4 4 0 004-4V3M7 14v7M17 3a4 4 0 010 8v9" /></svg>, label: "Food Database" },
              { to: "/plans/create",  icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>,                                                                                                                        label: "Create Plan" },
            ].map(({ to, icon, label }) => (
              <Link key={to} to={to} className="nav-link" style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", borderRadius: 12, color: "#5A4D42", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>
                {icon}{label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* ══ MAIN ══ */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflowY: "auto" }}>

          {/* Mobile header */}
          <div style={{ background: "#1A1612", padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link to="/food" style={{ color: "#5A4D42", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v7a4 4 0 004 4h0a4 4 0 004-4V3M7 14v7M17 3a4 4 0 010 8v9" />
              </svg>
              Food DB
            </Link>
            <span style={{ fontFamily: "'Lora', serif", fontSize: 18, color: "#E8A020", fontWeight: 700 }}>MealBudget</span>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#E8A020", display: "flex", alignItems: "center", justifyContent: "center", color: "#1A1612", fontSize: 16, fontWeight: 700, overflow: "hidden" }}>
              {user?.profile_picture ? <img src={user.profile_picture} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initial}
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "36px 24px 48px" }}>
            <div style={{ width: "100%", maxWidth: 600, display: "flex", flexDirection: "column", gap: 32 }}>

              {/* Welcome */}
              <div className="fu" style={{ display: "none" }}>
                <p style={{ fontSize: 14, color: "#A89880", fontWeight: 500, letterSpacing: "0.03em", marginBottom: 4 }}>Welcome back,</p>
                <h1 style={{ fontFamily: "'Lora', serif", fontSize: 44, color: "#1A1612", lineHeight: 1.1, fontWeight: 700 }}>{user?.username || "User"}</h1>
              </div>
              {/* Desktop welcome — visible md+ */}
              <div className="fu" style={{ paddingTop: 4 }}>
                <p style={{ fontSize: 14, color: "#A89880", fontWeight: 500, letterSpacing: "0.03em", marginBottom: 4 }}>Welcome back,</p>
                <h1 style={{ fontFamily: "'Lora', serif", fontSize: 44, color: "#1A1612", lineHeight: 1.1, fontWeight: 700 }}>{user?.username || "User"}</h1>
              </div>

              {/* ── Macro card ── */}
              <div className="fu d2" style={{ position: "relative", borderRadius: 24, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
                <img src={foodBg} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(10,8,6,.88) 0%,rgba(10,8,6,.55) 100%)" }} />

                <div style={{ position: "relative", padding: "28px 28px 24px" }}>
                  {/* Header row */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
                    <h2 style={{ fontFamily: "'Lora', serif", fontSize: 26, color: "#FFFFFF", fontWeight: 700, lineHeight: 1.2 }}>Macronutrient</h2>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 2 }}>Daily Calories</p>
                      <p style={{ fontFamily: "'Lora', serif", fontSize: 30, color: "#E8A020", lineHeight: 1, fontWeight: 700 }}>
                        {macros?.daily_cal ? fmt(macros.daily_cal) : "—"}
                        <span style={{ fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 400, color: "rgba(255,255,255,0.45)", marginLeft: 6 }}>kcal</span>
                      </p>
                    </div>
                  </div>

                  {/* Goals row */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
                    {[
                      { label: "Fitness Goal",   value: user?.fitness_goal   || "—" },
                      { label: "Activity Level", value: user?.activity_level || "—" },
                    ].map(item => (
                      <div key={item.label} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 14px" }}>
                        <p style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 3 }}>{item.label}</p>
                        <p style={{ fontSize: 13, color: "#FFFFFF", fontWeight: 600, textTransform: "capitalize" }}>{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Macro pills */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                    {[
                      { key: "protein",      label: "Protein",      value: macros?.protein,      color: "#5B8FE8" },
                      { key: "carbohydrate", label: "Carbs",        value: macros?.carbohydrate, color: "#E8A020" },
                      { key: "fat",          label: "Fat",          value: macros?.fat,          color: "#E87B5B" },
                      { key: "sugar",        label: "Sugar",        value: macros?.sugar,        color: "#B87BDC" },
                    ].map(m => (
                      <div key={m.key} style={{ background: "rgba(255,255,255,0.07)", border: `1px solid ${m.color}40`, borderRadius: 14, padding: "14px 10px", textAlign: "center" }}>
                        <p style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>{m.label}</p>
                        <p style={{ fontFamily: "'Lora', serif", fontSize: 22, color: m.color, fontWeight: 700, lineHeight: 1 }}>
                          {m.value ?? "—"}<span style={{ fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 400, color: "rgba(255,255,255,0.4)", marginLeft: 2 }}>g</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Your Plans ── */}
              <div className="fu d4">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <h2 style={{ fontFamily: "'Lora', serif", fontSize: 32, color: "#1A1612", fontWeight: 700 }}>Your Plans</h2>
                  <Link to="/plans/create" style={{ width: 40, height: 40, borderRadius: "50%", background: "#1A1612", color: "#E8A020", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 300, boxShadow: "0 2px 12px rgba(0,0,0,0.15)", textDecoration: "none", lineHeight: 1 }}>+</Link>
                </div>

                {plans.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {plans.map(plan => {
                      const stat       = planStats[plan._id];
                      const todayState = todayStates[plan._id];
                      const isCompleted = plan.status === "completed";
                      const cfg        = todayState ? STATE_CONFIG[todayState] : null;

                      return (
                        <div key={plan._id} className="plan-card" style={{
                          background: isCompleted ? "#FAF7F2" : "#FFFFFF",
                          border: `1px solid ${isCompleted ? "#EDE5D8" : "#E8E0D4"}`,
                          borderRadius: 20,
                          boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                          opacity: isCompleted ? 0.8 : 1,
                          overflow: "hidden",
                        }}>
                          {isCompleted && (
                            <div style={{ padding: "10px 20px", borderBottom: "1px solid #EDE5D8", display: "flex", alignItems: "center", gap: 8, background: "#F5F0E8" }}>
                              <span style={{ fontSize: 14 }}>🏆</span>
                              <span style={{ fontSize: 10, fontWeight: 700, color: "#A89880", textTransform: "uppercase", letterSpacing: "0.1em" }}>Plan completed</span>
                            </div>
                          )}

                          <div style={{ padding: "18px 20px" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                              <div style={{ flex: 1, minWidth: 0 }}>

                                {/* Name + priority */}
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                                  <p style={{ fontFamily: "'Lora', serif", fontSize: 17, fontWeight: 600, color: isCompleted ? "#A89880" : "#1A1612" }}>{plan.name}</p>
                                  <span style={{
                                    fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                                    padding: "3px 9px", borderRadius: 100,
                                    background: plan.priority === "budget" ? "#FDF3DC" : "#DCFCE7",
                                    color: plan.priority === "budget" ? "#B07010" : "#166534",
                                    border: `1px solid ${plan.priority === "budget" ? "#E8C87A" : "#86EFAC"}`,
                                  }}>{plan.priority}</span>
                                </div>

                                {/* State badge */}
                                {cfg && (
                                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 100, background: cfg.dot + "18", border: `1px solid ${cfg.dot}40`, marginBottom: 10 }}>
                                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, display: "inline-block", flexShrink: 0 }} />
                                    <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
                                  </div>
                                )}

                                {/* Sub info */}
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px", fontSize: 13, color: "#8A7B6E", fontWeight: 400 }}>
                                  <span style={{ textTransform: "capitalize" }}>{plan.fitness_goal}</span>
                                  <span style={{ color: "#C8BFB2" }}>·</span>
                                  <span>{plan.duration} days</span>
                                  {plan.priority === "budget" && plan.budget_limit && (
                                    <><span style={{ color: "#C8BFB2" }}>·</span><span>฿{plan.budget_limit}/day</span></>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                {isCompleted ? (
                                  <Link to={`/plans/${plan._id}/stats`} style={{ background: "#F5F0E8", color: "#6B5E52", fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 100, border: "1px solid #EDE5D8" }}>Stats</Link>
                                ) : (
                                  <Link
                                    to={todayState === "exercise-pending" ? `/plans/${plan._id}/today` : `/plans/${plan._id}/track`}
                                    style={{
                                      fontSize: 13, fontWeight: 700, padding: "9px 18px", borderRadius: 100,
                                      background: todayState === "exercise-pending" ? "#E87B5B"
                                               : todayState === "day-saved"         ? "#4CAF82"
                                               : "#1A1612",
                                      color: "#FFFFFF",
                                      boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
                                    }}>
                                    {todayState === "exercise-pending" ? "Exercise →"
                                      : todayState === "day-saved"    ? "Done ✓"
                                      : todayState === "tracking"     ? "Continue"
                                      : "Track"}
                                  </Link>
                                )}
                                <button onClick={() => setDeleteTarget(plan)} style={{ width: 36, height: 36, borderRadius: "50%", background: "#FAF7F2", border: "1px solid #EDE5D8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#B0A090", transition: "all 0.15s" }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#FEE2E2"; (e.currentTarget as HTMLButtonElement).style.color = "#EF4444"; }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#FAF7F2"; (e.currentTarget as HTMLButtonElement).style.color = "#B0A090"; }}>
                                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {/* Stats row */}
                            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #F0EBE2", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                              {stat ? (
                                <>
                                  <span style={{ fontSize: 13, color: "#8A7B6E" }}>
                                    <strong style={{ color: "#1A1612" }}>{stat.savedDays}</strong>/{plan.duration} days saved
                                  </span>
                                  <span style={{ color: "#C8BFB2" }}>·</span>
                                  <span style={{
                                    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
                                    background: stat.compliance >= 70 ? "#DCFCE7" : "#FEE2E2",
                                    color:      stat.compliance >= 70 ? "#166534" : "#DC2626",
                                  }}>
                                    {stat.savedDays === 0 ? "No data yet" : `${stat.compliance}% compliant`}
                                  </span>
                                  {stat.daysOver > 0 && (
                                    <><span style={{ color: "#C8BFB2" }}>·</span>
                                    <span style={{ fontSize: 13, color: "#E87B5B", fontWeight: 600 }}>{stat.daysOver} over</span></>
                                  )}
                                </>
                              ) : (
                                <span style={{ fontSize: 13, color: "#B0A090" }}>No tracking data yet</span>
                              )}
                            </div>

                            {/* Completed CTA */}
                            {isCompleted && (
                              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #F0EBE2", display: "flex", gap: 10 }}>
                                <button onClick={() => { setExtendTarget(plan); setExtendDays("7"); setExtendError(""); }}
                                  style={{ flex: 1, padding: "12px", borderRadius: 12, background: "#1A1612", color: "#E8A020", border: "none", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                                  Extend Plan
                                </button>
                                <Link to={`/plans/${plan._id}/stats`}
                                  style={{ flex: 1, padding: "12px", borderRadius: 12, background: "#FAF7F2", color: "#6B5E52", border: "1px solid #EDE5D8", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, textAlign: "center", display: "block" }}>
                                  View Stats
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "48px 20px", border: "2px dashed #DDD5C7", borderRadius: 20, background: "#FFFBF5" }}>
                    <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                      <svg width="24" height="24" fill="none" stroke="#B0A090" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p style={{ fontSize: 14, color: "#8A7B6E", marginBottom: 20, fontWeight: 500 }}>You don't have any plans yet.</p>
                    <Link to="/plans/create" style={{ background: "#E8A020", color: "#1A1612", padding: "12px 28px", borderRadius: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, boxShadow: "0 4px 16px rgba(232,160,32,0.25)" }}>
                      Create Your First Plan
                    </Link>
                  </div>
                )}
              </div>

            </div>
          </div>
        </main>
      </div>
    </>
  );
}

// ── Shared modal styles ──────────────────────────────────
const modal: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 50,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(26,22,18,0.65)", backdropFilter: "blur(4px)", padding: 24,
  },
  box: {
    background: "#FFFFFF", width: "100%", maxWidth: 380,
    borderRadius: 24, padding: "32px 28px",
    boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
  },
  cancelBtn: {
    flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid #EDE5D8",
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
    color: "#6B5E52", background: "#FAF7F2", cursor: "pointer",
  },
  deleteBtn: {
    flex: 1, padding: "12px", borderRadius: 12, border: "none",
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700,
    color: "#FFFFFF", background: "#EF4444", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
};

// ── Sidebar styles ───────────────────────────────────────
const sb: Record<string, React.CSSProperties> = {
  root: {
    width: 268, flexShrink: 0, background: "#1A1612",
    display: "flex", flexDirection: "column",
    position: "sticky", top: 0, height: "100vh",
    padding: "28px 22px", overflow: "hidden",
  },
  glow: {
    position: "absolute", top: -60, right: -60,
    width: 200, height: 200,
    background: "rgba(232,160,32,0.07)",
    borderRadius: "50%", filter: "blur(40px)",
    pointerEvents: "none",
  },
};

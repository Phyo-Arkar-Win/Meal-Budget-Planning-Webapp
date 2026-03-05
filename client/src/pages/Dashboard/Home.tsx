// client/src/pages/Dashboard/Home.tsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fetchUserProfile } from "../../api/userApi";
import { fetchPlans, deletePlan, extendPlan } from "../../api/planApi";
import { getPlanStats, getTodayStatus } from "../../api/dailyprogressApi";
import type { Plan } from "../../types/plan";
import type { TodayStatusResult } from "../../types/progress";
import foodBg from "../../assets/food-bg.jpg";

interface PlanStat {
  savedDays:  number;
  daysOver:   number;
  compliance: number;
}

// What's happening with today's tracking for this plan
type TodayState =
  | "plan-new"          // 0 saved days, no today record
  | "not-started"       // has past days, but nothing opened today
  | "tracking"          // opened today, some foods ticked
  | "exercise-pending"  // completed day, choosing exercise
  | "day-saved"         // today fully saved
  | "plan-completed";   // plan.status === 'completed'


// Visual config per state
const STATE_CONFIG: Record<TodayState, {
  dot:   string;   // tailwind bg color for the dot
  label: string;
  badge: string;   // tailwind classes for the badge
  icon:  string;
}> = {
  "plan-new":         { dot: "bg-stone-300",   label: "Not started",          badge: "bg-stone-100 text-stone-400",         icon: "○" },
  "not-started":      { dot: "bg-amber-400",   label: "Not tracked today",    badge: "bg-amber-50 text-amber-600",          icon: "◔" },
  "tracking":         { dot: "bg-blue-400",    label: "Tracking in progress", badge: "bg-blue-50 text-blue-600",            icon: "✎" },
  "exercise-pending": { dot: "bg-orange-400",  label: "Choose exercise",      badge: "bg-orange-50 text-orange-600",        icon: "⚡" },
  "day-saved":        { dot: "bg-emerald-400", label: "Today saved ✓",        badge: "bg-emerald-50 text-emerald-700",      icon: "✓" },
  "plan-completed":   { dot: "bg-blue-500",    label: "Plan completed 🏆",    badge: "bg-blue-50 text-blue-700",            icon: "🏆" },
};

const fmt = (n: number) => Math.round(n).toLocaleString();

export default function Home() {
  const [user,        setUser]        = useState<any>(null);
  const [plans,       setPlans]       = useState<Plan[]>([]);
  const [planStats,   setPlanStats]   = useState<Record<string, PlanStat>>({});
  const [todayStates, setTodayStates] = useState<Record<string, TodayState>>({});
  const [loading,     setLoading]     = useState(true);
  const navigate = useNavigate();

  // Delete modal
  const [deleteTarget,     setDeleteTarget]     = useState<Plan | null>(null);
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deleteError,      setDeleteError]      = useState("");

  // Extend modal
  const [extendTarget,  setExtendTarget]  = useState<Plan | null>(null);
  const [extendDays,    setExtendDays]    = useState("7");
  const [extendLoading, setExtendLoading] = useState(false);
  const [extendError,   setExtendError]   = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    (async () => {
      try {
        const [userData, plansData] = await Promise.all([
          fetchUserProfile(token),
          fetchPlans(),
        ]);
        setUser(userData);
        setPlans(plansData);

        // Fetch stats AND today-status for every plan in parallel
        const [statsResults, todayResults] = await Promise.all([
          Promise.allSettled(plansData.map((p: Plan) => getPlanStats(p._id))),
          Promise.allSettled(plansData.map((p: Plan) => getTodayStatus(p._id))),
        ]);

        // Build stats map
        const statsMap: Record<string, PlanStat> = {};
        statsResults.forEach((result, i) => {
          if (result.status === "fulfilled") {
            const data       = result.value.data ?? [];
            const savedDays  = data.length;
            const daysOver   = data.filter((d: any) => d.calories_exceeded > 0).length;
            const compliance = savedDays > 0
              ? Math.round(((savedDays - daysOver) / savedDays) * 100) : 0;
            statsMap[plansData[i]._id] = { savedDays, daysOver, compliance };
          }
        });
        setPlanStats(statsMap);

        // Build today-state map
        const stateMap: Record<string, TodayState> = {};
        todayResults.forEach((result, i) => {
          const plan = plansData[i] as Plan;

          if (plan.status === "completed") {
            stateMap[plan._id] = "plan-completed";
            return;
          }

          const savedDays = statsMap[plan._id]?.savedDays ?? 0;

          if (result.status === "rejected" || result.value === undefined) {
            stateMap[plan._id] = savedDays === 0 ? "plan-new" : "not-started";
            return;
          }

          const todayStatus = result.value as TodayStatusResult;

          if (!todayStatus.exists) {
            // No record today — new plan or just hasn't opened today yet
            stateMap[plan._id] = savedDays === 0 ? "plan-new" : "not-started";
            return;
          }

          // Record exists — map its status
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
    setDeleteConfirming(true);
    setDeleteError("");
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
    setExtendLoading(true);
    setExtendError("");
    try {
      const updated = await extendPlan(extendTarget._id, days);
      setPlans(prev => prev.map(p => p._id === updated._id ? updated : p));
      setTodayStates(prev => ({ ...prev, [updated._id]: "not-started" }));
      setExtendTarget(null);
      setExtendDays("7");
    } catch (e: any) { setExtendError(e.message || "Failed to extend."); }
    finally { setExtendLoading(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
    </div>
  );

  const macros  = user?.macro_targets;
  const initial = user?.username?.charAt(0).toUpperCase() || "U";

  const daysRemaining = (plan: Plan) => {
    const deadline = new Date(plan.createdAt);
    deadline.setDate(deadline.getDate() + plan.duration);
    return Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / 86400000));
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        .home-root * { box-sizing:border-box; }
        .home-root { font-family:'DM Sans',sans-serif; }
        .serif { font-family:'DM Serif Display',serif; }
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp 0.45s ease both}
        .d1{animation-delay:.07s} .d2{animation-delay:.14s} .d3{animation-delay:.21s} .d4{animation-delay:.28s}
      `}</style>

      {/* ── Delete modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-6">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="serif text-xl font-bold text-stone-900 text-center mb-2">Delete Plan?</h3>
            <p className="text-stone-500 text-center text-sm mb-2">
              Delete <span className="font-bold text-stone-900">"{deleteTarget.name}"</span>?
            </p>
            <p className="text-red-400 text-center text-xs mb-5">All tracking data will be permanently removed.</p>
            {deleteError && <p className="text-red-500 text-xs text-center mb-3">{deleteError}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setDeleteTarget(null); setDeleteError(""); }} disabled={deleteConfirming}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-stone-500 bg-stone-100 hover:bg-stone-200 transition disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} disabled={deleteConfirming}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {deleteConfirming ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Extend modal ── */}
      {extendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-6">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mb-4 mx-auto text-2xl">🏆</div>
            <h3 className="serif text-xl font-bold text-stone-900 text-center mb-1">Plan Completed!</h3>
            <p className="text-stone-500 text-center text-sm mb-6">
              <span className="font-semibold text-stone-800">{extendTarget.name}</span> is finished. Keep going?
            </p>
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 mb-3">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Extend the plan</p>
              <div className="flex gap-2 items-center">
                <input type="number" min="1" max="365" value={extendDays}
                  onChange={e => { setExtendDays(e.target.value); setExtendError(""); }}
                  className="w-20 bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm text-center font-bold focus:outline-none focus:border-amber-400 transition" />
                <span className="text-sm text-stone-500">more days</span>
                <button onClick={handleExtendConfirm} disabled={extendLoading}
                  className="ml-auto bg-stone-900 hover:bg-amber-400 hover:text-stone-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50">
                  {extendLoading ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "Extend →"}
                </button>
              </div>
              {extendError && <p className="text-red-500 text-xs mt-2">{extendError}</p>}
            </div>
            <button onClick={() => setExtendTarget(null)}
              className="w-full py-3 rounded-2xl border-2 border-stone-200 font-bold text-sm text-stone-500 hover:border-stone-300 transition">
              No thanks, I'm done
            </button>
            <Link to={`/plans/${extendTarget._id}/stats`} onClick={() => setExtendTarget(null)}
              className="block text-center text-xs text-amber-600 hover:text-amber-700 mt-3 font-semibold">
              View plan statistics →
            </Link>
          </div>
        </div>
      )}

      <div className="home-root min-h-screen bg-stone-50 flex">

        {/* ── SIDEBAR ── */}
        <aside className="hidden md:flex flex-col w-72 shrink-0 bg-stone-900 text-white sticky top-0 h-screen px-8 py-10">
          <div className="mb-10 fu">
            <div className="flex items-center gap-2 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v7a4 4 0 004 4h0a4 4 0 004-4V3M7 14v7M17 3a4 4 0 010 8v9" />
              </svg>
              <span className="serif text-lg text-amber-400 tracking-wide">MealBudget</span>
            </div>
            <p className="text-stone-500 text-[10px] tracking-widest uppercase">Planning App</p>
          </div>

          <div className="flex flex-col items-center text-center mb-8 fu d1">
            <div className="w-20 h-20 rounded-full bg-amber-400 flex items-center justify-center text-stone-900 text-3xl font-bold shadow-lg mb-3 select-none overflow-hidden">
              {user?.profile_picture ? <img src={user.profile_picture} alt="" className="w-full h-full object-cover" /> : initial}
            </div>
            <p className="serif text-xl text-white leading-tight">{user?.username || "User"}</p>
            <p className="text-stone-500 text-xs mt-0.5 truncate w-full text-center">{user?.email || ""}</p>
            <Link to="/profile" className="mt-2 text-xs text-stone-400 hover:text-amber-400 transition">Edit Profile ✎</Link>
            <button onClick={handleLogout} className="mt-3 flex items-center gap-1.5 text-xs text-stone-500 hover:text-red-400 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
              </svg>
              Logout
            </button>
          </div>

          <div className="border-t border-stone-800 mb-6" />

          <div className="flex flex-col mb-8 fu d2">
            {[
              { label: "Sex",      value: user?.gender         || "—" },
              { label: "Weight",   value: user?.weight         ? `${user.weight} kg` : "—" },
              { label: "Height",   value: user?.height         ? `${user.height} cm` : "—" },
              { label: "Goal",     value: user?.fitness_goal   || "Not set" },
              { label: "Activity", value: user?.activity_level || "Not set" },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center py-2.5 border-b border-stone-800 last:border-0">
                <span className="text-[10px] text-stone-500 uppercase tracking-widest">{item.label}</span>
                <span className="text-sm text-stone-200 font-medium capitalize text-right" style={{ maxWidth: 130 }}>{item.value}</span>
              </div>
            ))}
          </div>

          <nav className="flex flex-col gap-1 mt-auto fu d3">
            <Link to="/food" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v7a4 4 0 004 4h0a4 4 0 004-4V3M7 14v7M17 3a4 4 0 010 8v9" />
              </svg>
              Food Database
            </Link>
            <Link to="/plans/create" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create Plan
            </Link>
          </nav>
        </aside>

        {/* ── MAIN ── */}
        <main className="flex-1 flex flex-col min-w-0">

          <div className="md:hidden bg-stone-900 px-5 pt-10 pb-5">
            <div className="flex items-center justify-between fu">
              <Link to="/food" className="flex flex-col items-center gap-1 text-stone-400 hover:text-amber-400 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v7a4 4 0 004 4h0a4 4 0 004-4V3M7 14v7M17 3a4 4 0 010 8v9" />
                </svg>
                <span className="text-[8px] uppercase tracking-wide text-center leading-tight" style={{ maxWidth: 52 }}>Food<br/>Database</span>
              </Link>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="serif text-white text-lg leading-tight">{user?.username || "User"}</p>
                  <Link to="/profile" className="text-[11px] text-stone-400 hover:text-amber-400 transition">Edit Profile ✎</Link>
                </div>
                <div className="w-11 h-11 rounded-full bg-amber-400 flex items-center justify-center text-stone-900 text-lg font-bold shadow shrink-0 select-none overflow-hidden">
                  {user?.profile_picture ? <img src={user.profile_picture} alt="" className="w-full h-full object-cover" /> : initial}
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-red-400 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>

          <div className="flex-1 flex justify-center py-8 px-5 md:py-10 md:px-10">
            <div className="w-full max-w-xl flex flex-col gap-7">

              <div className="hidden md:block fu">
                <p className="text-stone-400 text-sm tracking-wide">Welcome back,</p>
                <h1 className="serif text-4xl text-stone-900 mt-0.5">{user?.username || "User"}</h1>
              </div>

              {/* Macro card */}
              <div className="relative rounded-2xl overflow-hidden shadow-xl fu d2" style={{ minHeight: 230 }}>
                <img src={foodBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,rgba(10,10,10,.78) 0%,rgba(10,10,10,.48) 100%)" }} />
                <div className="relative p-6 md:p-8 text-white">
                  <h2 className="serif text-xl md:text-2xl mb-5 tracking-wide">Macronutrient</h2>
                  <div className="grid grid-cols-3 gap-x-4 gap-y-4">
                    <div className="flex flex-col gap-4">
                      <div>
                        <p className="text-[9px] text-white/55 uppercase tracking-widest font-medium mb-0.5">Fitness Goal</p>
                        <p className="text-sm font-semibold capitalize leading-tight">{user?.fitness_goal || "Not set"}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-white/55 uppercase tracking-widest font-medium mb-0.5">Activity Level</p>
                        <p className="text-sm font-semibold capitalize leading-tight">{user?.activity_level || "Not set"}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-4 text-center">
                      <div>
                        <p className="text-[9px] text-white/55 uppercase tracking-widest font-medium mb-0.5">Protein</p>
                        <p className="text-sm font-semibold">{macros?.protein ?? "—"} <span className="text-xs text-white/55">g</span></p>
                      </div>
                      <div>
                        <p className="text-[9px] text-white/55 uppercase tracking-widest font-medium mb-0.5">Carbohydrate</p>
                        <p className="text-sm font-semibold">{macros?.carbohydrate ?? "—"} <span className="text-xs text-white/55">g</span></p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-4 text-center">
                      <div>
                        <p className="text-[9px] text-white/55 uppercase tracking-widest font-medium mb-0.5">Sugar</p>
                        <p className="text-sm font-semibold">{macros?.sugar ?? "—"} <span className="text-xs text-white/55">g</span></p>
                      </div>
                      <div>
                        <p className="text-[9px] text-white/55 uppercase tracking-widest font-medium mb-0.5">Fat</p>
                        <p className="text-sm font-semibold">{macros?.fat ?? "—"} <span className="text-xs text-white/55">g</span></p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 pt-4 border-t border-white/20 text-center">
                    <p className="text-[9px] text-white/55 uppercase tracking-widest font-medium mb-1">Daily Calories</p>
                    <p className="serif text-3xl text-amber-400">
                      {macros?.daily_cal ? fmt(macros.daily_cal) : "—"}
                      <span className="text-sm font-sans font-normal text-white/55 ml-2">kcal</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile stats */}
              <div className="grid grid-cols-2 gap-3 md:hidden fu d3">
                {[
                  { label: "Weight", value: user?.weight ? `${user.weight} kg` : "—" },
                  { label: "Height", value: user?.height ? `${user.height} cm` : "—" },
                ].map(s => (
                  <div key={s.label} className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm text-center">
                    <p className="text-[9px] text-stone-400 uppercase tracking-widest font-medium mb-1">{s.label}</p>
                    <p className="serif text-2xl text-stone-800">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* ── Your Plans ── */}
              <div className="fu d4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="serif text-2xl md:text-3xl text-stone-900">Your Plans</h2>
                  <Link to="/plans/create"
                    className="w-9 h-9 rounded-full bg-stone-900 text-white flex items-center justify-center text-2xl font-light hover:bg-amber-400 hover:text-stone-900 transition shadow">
                    +
                  </Link>
                </div>

                {plans.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {plans.map(plan => {
                      const stat        = planStats[plan._id];
                      const todayState  = todayStates[plan._id];
                      const isCompleted = plan.status === "completed";
                      const cfg         = todayState ? STATE_CONFIG[todayState] : null;

                      return (
                        <div key={plan._id}
                          className={`border rounded-2xl shadow-sm transition-all duration-300 ${
                            isCompleted
                              ? "bg-stone-50 border-stone-200 opacity-70"
                              : "bg-white border-stone-100 hover:shadow-md"
                          }`}>

                          {isCompleted && (
                            <div className="px-5 pt-4 pb-2 flex items-center gap-2 border-b border-stone-100">
                              <span className="text-base">🏆</span>
                              <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Plan completed</span>
                            </div>
                          )}

                          <div className="p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">

                                {/* Plan name + priority badge */}
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                  <p className={`font-semibold ${isCompleted ? "text-stone-400" : "text-stone-800"}`}>
                                    {plan.name}
                                  </p>
                                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 ${
                                    plan.priority === "budget" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                                  }`}>{plan.priority}</span>
                                </div>

                                {/* Today state badge */}
                                {cfg && (
                                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold mb-2 ${cfg.badge}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                                    {cfg.label}
                                  </div>
                                )}

                                {/* Sub-info */}
                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-stone-400">
                                  <span className="capitalize">{plan.fitness_goal}</span>
                                  <span>·</span>
                                  <span>{plan.duration} days</span>
                                  {plan.priority === "budget" && plan.budget_limit && (
                                    <><span>·</span><span>฿{plan.budget_limit}/day</span></>
                                  )}
                                </div>
                              </div>

                              {/* Action buttons */}
                              <div className="flex items-center gap-2 shrink-0">
                                {isCompleted ? (
                                  <Link to={`/plans/${plan._id}/stats`}
                                    className="bg-stone-100 hover:bg-stone-200 text-stone-500 text-xs font-semibold px-3 py-2 rounded-full transition">
                                    Stats
                                  </Link>
                                ) : (
                                  <Link
                                    to={
                                      todayState === "exercise-pending"
                                        ? `/plans/${plan._id}/today`   // goes to DailyTrack which shows Exercise button
                                        : todayState === "day-saved"
                                        ? `/plans/${plan._id}/track`
                                        : `/plans/${plan._id}/track`
                                    }
                                    className={`text-xs font-semibold px-4 py-2 rounded-full transition ${
                                      todayState === "exercise-pending"
                                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                                        : todayState === "day-saved"
                                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                        : "bg-stone-900 hover:bg-amber-400 hover:text-stone-900 text-white"
                                    }`}>
                                    {todayState === "exercise-pending" ? "Exercise →"
                                      : todayState === "day-saved"     ? "Done ✓"
                                      : todayState === "tracking"      ? "Continue"
                                      : "Track"}
                                  </Link>
                                )}
                                <button onClick={() => setDeleteTarget(plan)}
                                  className="w-8 h-8 rounded-full bg-stone-100 hover:bg-red-100 text-stone-400 hover:text-red-500 flex items-center justify-center transition">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {/* Stats row */}
                            {stat ? (
                              <div className="mt-3 pt-3 border-t border-stone-50 flex items-center gap-3 flex-wrap">
                                <span className="text-[10px] text-stone-400">
                                  <span className="font-semibold text-stone-600">{stat.savedDays}</span>/{plan.duration} days saved
                                </span>
                                <span className="text-stone-200">·</span>
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                  stat.compliance >= 70 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                                }`}>
                                  {stat.savedDays === 0 ? "No data yet" : `${stat.compliance}% compliant`}
                                </span>
                                {stat.daysOver > 0 && (
                                  <><span className="text-stone-200">·</span>
                                  <span className="text-[10px] text-red-400 font-medium">{stat.daysOver} over</span></>
                                )}
                              </div>
                            ) : (
                              <div className="mt-3 pt-3 border-t border-stone-50">
                                <span className="text-[10px] text-stone-300">No tracking data yet</span>
                              </div>
                            )}

                            {/* Completed plan CTA */}
                            {isCompleted && (
                              <div className="mt-4 pt-4 border-t border-stone-100 flex gap-2">
                                <button
                                  onClick={() => { setExtendTarget(plan); setExtendDays("7"); setExtendError(""); }}
                                  className="flex-1 py-2.5 rounded-xl bg-stone-900 hover:bg-amber-400 hover:text-stone-900 text-white text-xs font-bold transition">
                                  Extend Plan
                                </button>
                                <Link to={`/plans/${plan._id}/stats`}
                                  className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-bold text-center transition">
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
                  <div className="text-center p-8 border-2 border-dashed border-stone-200 rounded-2xl text-stone-500">
                    <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-sm mb-4">You don't have any plans yet.</p>
                    <Link to="/plans/create"
                      className="bg-amber-400 text-stone-900 px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-amber-500 transition">
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
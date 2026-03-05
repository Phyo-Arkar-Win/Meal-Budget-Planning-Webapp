// client/src/pages/Dashboard/Home.tsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fetchUserProfile } from "../../api/userApi";
import { fetchPlans, deletePlan } from "../../api/planApi";
import { getPlanStats } from "../../api/dailyprogressApi";
import type { Plan } from "../../types/plan";
import foodBg from "../../assets/food-bg.jpg";

interface PlanStat {
  savedDays:    number;
  daysOver:     number;
  compliance:   number;
}

const Home = () => {
  const [user,      setUser]      = useState<any>(null);
  const [plans,     setPlans]     = useState<Plan[]>([]);
  const [planStats, setPlanStats] = useState<Record<string, PlanStat>>({});
  const [loading,   setLoading]   = useState(true);
  const navigate = useNavigate();

  const [deleteTarget,     setDeleteTarget]     = useState<Plan | null>(null);
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deleteError,      setDeleteError]      = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    const loadData = async () => {
      try {
        const [userData, plansData] = await Promise.all([
          fetchUserProfile(token),
          fetchPlans(),
        ]);
        setUser(userData);
        setPlans(plansData);

        // Fetch stats for all plans in parallel
        const statsResults = await Promise.allSettled(
          plansData.map((p: Plan) => getPlanStats(p._id))
        );

        const statsMap: Record<string, PlanStat> = {};
        statsResults.forEach((result, i) => {
          if (result.status === "fulfilled") {
            const data      = result.value.data ?? [];
            const savedDays = data.length;
            const daysOver  = data.filter((d: any) => d.calories_exceeded > 0).length;
            const compliance = savedDays > 0
              ? Math.round(((savedDays - daysOver) / savedDays) * 100)
              : 0;
            statsMap[plansData[i]._id] = { savedDays, daysOver, compliance };
          }
        });
        setPlanStats(statsMap);
      } catch (error) {
        localStorage.removeItem("token");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteConfirming(true);
    setDeleteError("");
    try {
      await deletePlan(deleteTarget._id);
      setPlans(prev => prev.filter(p => p._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (e: any) {
      setDeleteError(e.message || "Failed to delete plan.");
    } finally {
      setDeleteConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          <p className="text-stone-400 text-sm tracking-wide">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

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
        .home-root * { box-sizing: border-box; }
        .home-root { font-family: 'DM Sans', sans-serif; }
        .serif { font-family: 'DM Serif Display', serif; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fu { animation: fadeUp 0.45s ease both; }
        .d1 { animation-delay: 0.07s; } .d2 { animation-delay: 0.14s; }
        .d3 { animation-delay: 0.21s; } .d4 { animation-delay: 0.28s; }
      `}</style>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-6">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-xl font-serif font-bold text-stone-900 text-center mb-2">Delete Plan?</h3>
            <p className="text-stone-500 text-center text-sm mb-2">
              Are you sure you want to delete{" "}
              <span className="font-bold text-stone-900">"{deleteTarget.name}"</span>?
            </p>
            <p className="text-red-400 text-center text-xs mb-5">This will permanently remove all tracking data for this plan.</p>
            {deleteError && <p className="text-red-500 text-xs text-center mb-3">{deleteError}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setDeleteTarget(null); setDeleteError(""); }}
                disabled={deleteConfirming}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-stone-500 bg-stone-100 hover:bg-stone-200 transition disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} disabled={deleteConfirming}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white bg-red-500 hover:bg-red-600 transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {deleteConfirming
                  ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="home-root min-h-screen bg-stone-50 flex">

        {/* ── SIDEBAR (md+) ── */}
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
              {user?.profile_picture
                ? <img src={user.profile_picture} alt="" className="w-full h-full object-cover" />
                : initial}
            </div>
            <p className="serif text-xl text-white leading-tight">{user?.username || "User"}</p>
            <p className="text-stone-500 text-xs mt-0.5 truncate w-full text-center">{user?.email || ""}</p>
            <Link to="/profile" className="mt-2 text-xs text-stone-400 hover:text-amber-400 transition flex items-center gap-1">
              Edit Profile
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-9 9A2 2 0 0115 6l-1.414-1.414z" />
                <path d="M4 13.5V16h2.5l7.372-7.372-2.5-2.5L4 13.5z" />
              </svg>
            </Link>
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
              { label: "Weight",   value: user?.weight         ? `${user.weight} kg`  : "—" },
              { label: "Height",   value: user?.height         ? `${user.height} cm`  : "—" },
              { label: "Goal",     value: user?.fitness_goal   || "Not set" },
              { label: "Activity", value: user?.activity_level || "Not set" },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center py-2.5 border-b border-stone-800 last:border-0">
                <span className="text-[10px] text-stone-500 uppercase tracking-widest">{item.label}</span>
                <span className="text-sm text-stone-200 font-medium capitalize text-right" style={{ maxWidth: 130 }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* ── Nav — no Progress link ── */}
          <nav className="flex flex-col gap-1 mt-auto fu d3">
            <Link to="/food"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v7a4 4 0 004 4h0a4 4 0 004-4V3M7 14v7M17 3a4 4 0 010 8v9" />
              </svg>
              Food Database
            </Link>
            <Link to="/plans/create"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create Plan
            </Link>
          </nav>
        </aside>

        {/* ── MAIN ── */}
        <main className="flex-1 flex flex-col min-w-0">

          {/* Mobile top bar */}
          <div className="md:hidden bg-stone-900 px-5 pt-10 pb-5">
            <div className="flex items-center justify-between fu">
              <Link to="/food" className="flex flex-col items-center gap-1 text-stone-400 hover:text-amber-400 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v7a4 4 0 004 4h0a4 4 0 004-4V3M7 14v7M17 3a4 4 0 010 8v9" />
                </svg>
                <span className="text-[8px] uppercase tracking-wide text-center leading-tight" style={{ maxWidth: 52 }}>
                  See available<br />meals
                </span>
              </Link>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="serif text-white text-lg leading-tight">{user?.username || "User"}</p>
                  <Link to="/profile" className="text-[11px] text-stone-400 hover:text-amber-400 transition">Edit Profile ✎</Link>
                </div>
                <div className="w-11 h-11 rounded-full bg-amber-400 flex items-center justify-center text-stone-900 text-lg font-bold shadow shrink-0 select-none overflow-hidden">
                  {user?.profile_picture
                    ? <img src={user.profile_picture} alt="" className="w-full h-full object-cover" />
                    : initial}
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-2 fu d1">
              <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-red-400 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 flex justify-center py-8 px-5 md:py-10 md:px-10">
            <div className="w-full max-w-xl flex flex-col gap-7">

              {/* Greeting (desktop) */}
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
                      {macros?.daily_cal ? Math.round(macros.daily_cal).toLocaleString() : "—"}
                      <span className="text-sm font-sans font-normal text-white/55 ml-2">kcal</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile stats row */}
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

              {/* Your Plans */}
              <div className="fu d4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="serif text-2xl md:text-3xl text-stone-900">Your Plans</h2>
                  <Link to="/plans/create" title="Create new plan"
                    className="w-9 h-9 rounded-full bg-stone-900 text-white flex items-center justify-center text-2xl font-light hover:bg-amber-400 hover:text-stone-900 transition shadow">
                    +
                  </Link>
                </div>

                {plans.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {plans.map(plan => {
                      const remaining = daysRemaining(plan);
                      const isActive  = plan.status === "active";
                      const stat      = planStats[plan._id];

                      return (
                        <div key={plan._id} className="bg-white border border-stone-100 rounded-2xl shadow-sm p-5 hover:shadow-md transition">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">

                              {/* Plan name + badges */}
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <p className="font-semibold text-stone-800">{plan.name}</p>
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 ${
                                  plan.priority === "budget" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                                }`}>{plan.priority}</span>
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 ${
                                  plan.status === "active"    ? "bg-emerald-100 text-emerald-600" :
                                  plan.status === "completed" ? "bg-blue-100 text-blue-600"       :
                                                                "bg-stone-100 text-stone-500"
                                }`}>{plan.status}</span>
                              </div>

                              {/* Sub-info */}
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-stone-400">
                                <span className="capitalize">{plan.fitness_goal}</span>
                                <span>·</span>
                                <span>{plan.activity_level}</span>
                                <span>·</span>
                                <span>{plan.duration} day{plan.duration !== 1 ? "s" : ""}</span>
                                {plan.priority === "budget" && plan.budget_limit && (
                                  <><span>·</span><span>฿{plan.budget_limit}/day</span></>
                                )}
                              </div>

                              <p className={`text-xs mt-1.5 font-medium ${remaining === 0 ? "text-red-400" : "text-stone-400"}`}>
                                {remaining === 0 ? "Plan ended" : `${remaining} day${remaining !== 1 ? "s" : ""} remaining`}
                              </p>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-2 shrink-0">
                              <Link to={`/plans/${plan._id}/track`}
                                className="bg-stone-900 hover:bg-amber-400 hover:text-stone-900 text-white text-xs font-semibold px-4 py-2 rounded-full transition">
                                {isActive ? "Track" : "View"}
                              </Link>
                              <button onClick={() => setDeleteTarget(plan)}
                                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-red-100 text-stone-400 hover:text-red-500 flex items-center justify-center transition"
                                title="Delete plan">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Calorie + macro chips */}
                          <div className="mt-3 pt-3 border-t border-stone-50">
                            <div className="flex justify-between text-[10px] text-stone-400 mb-1.5">
                              <span>Daily target</span>
                              <span className="font-semibold text-stone-600">
                                {Math.round(plan.macro_targets.daily_cal).toLocaleString()} kcal
                              </span>
                            </div>
                            <div className="flex gap-1.5">
                              {[
                                { label: "P", value: plan.macro_targets.protein,      color: "#86efac" },
                                { label: "C", value: plan.macro_targets.carbohydrate, color: "#93c5fd" },
                                { label: "F", value: plan.macro_targets.fat,          color: "#fca5a5" },
                              ].map(m => (
                                <span key={m.label} className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                                  style={{ background: m.color + "33", color: m.color }}>
                                  {m.label} {Number(m.value).toFixed(0)}g
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* ── Plan stats row ── */}
                          {stat ? (
                            <div className="mt-3 pt-3 border-t border-stone-50 flex items-center gap-3">
                              <div className="flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-[10px] text-stone-400">
                                  <span className="font-semibold text-stone-600">{stat.savedDays}</span>/{plan.duration} days saved
                                </span>
                              </div>
                              <span className="text-stone-200">·</span>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                  stat.compliance >= 70 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                                }`}>
                                  {stat.savedDays === 0 ? "No data" : `${stat.compliance}% compliant`}
                                </span>
                              </div>
                              {stat.daysOver > 0 && (
                                <>
                                  <span className="text-stone-200">·</span>
                                  <span className="text-[10px] text-red-400 font-medium">{stat.daysOver} over</span>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="mt-3 pt-3 border-t border-stone-50">
                              <span className="text-[10px] text-stone-300">No tracking data yet</span>
                            </div>
                          )}
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
                    <p className="text-sm mb-4">You don't have an active plan yet.</p>
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
};

export default Home;
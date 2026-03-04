// client/src/pages/Plan/PlanDetail.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchPlanById } from "../../api/planApi";
import { getPlanStats } from "../../api/dailyprogressApi";
import type { Plan } from "../../types/plan";

const fmt = (n: number) => Math.round(n).toLocaleString();

// getPlanStats returns { total_days_tracked, data: ChartDay[] }
interface ChartDay {
  day_number:        number;
  date:              string;
  calories_exceeded: number;
  budget_exceeded:   number;
  exercised:         boolean;
}

export default function PlanDetail() {
  const { planId } = useParams<{ planId: string }>();
  const navigate   = useNavigate();

  const [plan,     setPlan]     = useState<Plan | null>(null);
  const [stats,    setStats]    = useState<ChartDay[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  useEffect(() => {
    if (!planId) return;
    (async () => {
      setLoading(true);
      try {
        const [p, s] = await Promise.all([
          fetchPlanById(planId),
          getPlanStats(planId),
        ]);
        setPlan(p);
        setStats(s.data ?? []);
      } catch (e: any) { setError(e.message || "Failed to load plan"); }
      finally { setLoading(false); }
    })();
  }, [planId]);

  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !plan) return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-3">
      <p className="text-stone-500 text-sm">{error || "Plan not found"}</p>
      <button onClick={() => navigate("/")} className="text-amber-500 text-sm hover:underline">← Dashboard</button>
    </div>
  );

  // Current day = days since plan creation (1-based), capped at duration
  const daysSinceStart = Math.floor(
    (Date.now() - new Date(plan.createdAt).getTime()) / 86400000
  );
  const currentDay = Math.min(daysSinceStart + 1, plan.duration);

  // Build lookup: day_number → saved ChartDay
  const savedMap = stats.reduce<Record<number, ChartDay>>((acc, d) => {
    acc[d.day_number] = d;
    return acc;
  }, {});

  // Summary stats from saved days only
  const savedDays      = stats.length;
  const daysOver       = stats.filter(d => d.calories_exceeded > 0).length;
  const daysExercised  = stats.filter(d => d.exercised).length;
  const compliance     = savedDays > 0 ? Math.round(((savedDays - daysOver) / savedDays) * 100) : 0;

  const templateCost = plan.template_menus.reduce((s, f) => s + f.price, 0);
  const templateCal  = plan.template_menus.reduce((s, f) => s + f.macros.calories, 0);
  const m            = plan.macro_targets;

  type DayStatus = "today" | "saved-ok" | "saved-over" | "missed" | "future";

  const dayStatus = (day: number): DayStatus => {
    if (plan.status === "active" && day === currentDay) return "today";
    if (day > currentDay) return "future";
    const entry = savedMap[day];
    if (!entry) return "missed";
    return entry.calories_exceeded > 0 ? "saved-over" : "saved-ok";
  };

  const dayCls: Record<DayStatus, string> = {
    today:      "bg-amber-400 text-stone-900 ring-2 ring-amber-200 font-bold shadow-md",
    "saved-ok": "bg-emerald-100 text-emerald-700 font-semibold",
    "saved-over":"bg-red-100 text-red-600 font-semibold",
    missed:     "bg-stone-100 text-stone-400",
    future:     "bg-white border border-stone-200 text-stone-400",
  };

  const dayIcon: Record<DayStatus, string> = {
    today: "▶", "saved-ok": "✓", "saved-over": "!", missed: "–", future: "",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
        .pd { font-family:'DM Sans',sans-serif; }
        .serif { font-family:'DM Serif Display',serif; }
        @keyframes fu{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .fu{animation:fu 0.35s ease both}
        .d1{animation-delay:.07s} .d2{animation-delay:.14s} .d3{animation-delay:.21s} .d4{animation-delay:.28s}
      `}</style>

      <div className="pd min-h-screen bg-stone-50 flex">

        {/* ── SIDEBAR ── */}
        <aside className="hidden md:flex flex-col w-72 shrink-0 bg-stone-900 text-white sticky top-0 h-screen px-8 py-10 overflow-y-auto">
          <button onClick={() => navigate("/")}
            className="flex items-center gap-2 text-stone-400 hover:text-white transition group w-fit mb-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm">Dashboard</span>
          </button>

          {/* Status + name */}
          <div className="mb-8">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full inline-block mb-3 ${
              plan.status === "active"    ? "bg-emerald-500/20 text-emerald-400" :
              plan.status === "completed" ? "bg-blue-500/20 text-blue-400"       :
                                            "bg-stone-700 text-stone-400"
            }`}>{plan.status}</span>
            <h1 className="serif text-3xl text-amber-400 leading-tight mb-1">{plan.name}</h1>
            <p className="text-stone-400 text-sm capitalize">{plan.fitness_goal} · {plan.activity_level}</p>
          </div>

          {/* Plan meta */}
          <div className="flex flex-col mb-8">
            {[
              { label: "Duration",  value: `${plan.duration} days` },
              { label: "Priority",  value: plan.priority.charAt(0).toUpperCase() + plan.priority.slice(1) },
              { label: "Budget",    value: plan.priority === "budget" && plan.budget_limit ? `฿${plan.budget_limit}/day` : "Unlimited" },
              { label: "Current Day", value: `${currentDay} of ${plan.duration}` },
              { label: "Days Saved",  value: `${savedDays}` },
              { label: "Compliance",  value: `${compliance}%` },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-center py-2.5 border-b border-stone-800 last:border-0">
                <span className="text-[10px] text-stone-500 uppercase tracking-widest">{r.label}</span>
                <span className="text-sm text-stone-200 font-medium">{r.value}</span>
              </div>
            ))}
          </div>

          {/* Daily targets */}
          <div className="border-t border-stone-800 pt-6 mb-8">
            <p className="text-xs text-stone-500 uppercase tracking-widest mb-3">Daily Targets</p>
            {[
              { label: "Calories", value: `${fmt(m.daily_cal)} kcal`, color: "#f59e0b" },
              { label: "Protein",  value: `${Number(m.protein).toFixed(1)}g`,      color: "#86efac" },
              { label: "Carbs",    value: `${Number(m.carbohydrate).toFixed(1)}g`, color: "#93c5fd" },
              { label: "Fat",      value: `${Number(m.fat).toFixed(1)}g`,          color: "#fca5a5" },
            ].map(t => (
              <div key={t.label} className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-stone-400">{t.label}</span>
                <span className="text-xs font-semibold" style={{ color: t.color }}>{t.value}</span>
              </div>
            ))}
            {plan.priority === "budget" && plan.budget_limit && (
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-stone-800">
                <span className="text-xs text-stone-400">Template cost</span>
                <span className={`text-xs font-semibold ${templateCost > plan.budget_limit ? "text-red-400" : "text-emerald-400"}`}>
                  ฿{templateCost} / ฿{plan.budget_limit}
                </span>
              </div>
            )}
          </div>

          {/* Stats link */}
          <Link to={`/plans/${planId}/stats`}
            className="mt-auto flex items-center gap-2 text-stone-400 hover:text-amber-400 transition text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            View Statistics
          </Link>
        </aside>

        {/* ── MAIN ── */}
        <main className="flex-1 overflow-y-auto">

          {/* Mobile header */}
          <div className="md:hidden bg-stone-900 px-5 py-5 flex items-center justify-between sticky top-0 z-20 shadow-md">
            <button onClick={() => navigate("/")} className="text-stone-400 hover:text-white transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="text-center">
              <p className="serif text-amber-400 text-lg leading-tight">{plan.name}</p>
              <p className="text-stone-400 text-[10px] capitalize">{plan.status}</p>
            </div>
            <Link to={`/plans/${planId}/stats`} className="text-stone-400 hover:text-amber-400 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </Link>
          </div>

          <div className="max-w-2xl mx-auto px-5 py-8 md:px-8 md:py-10 space-y-8">

            {/* Summary KPI cards */}
            <div className="grid grid-cols-3 gap-3 fu">
              {[
                { label: "Days Saved",   value: String(savedDays),    unit: `of ${plan.duration}`, color: "#86efac" },
                { label: "Compliance",   value: `${compliance}%`,      unit: "on target",           color: compliance >= 70 ? "#86efac" : "#fca5a5" },
                { label: "Exercised",    value: String(daysExercised), unit: "days",                color: "#93c5fd" },
              ].map(s => (
                <div key={s.label} className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm text-center">
                  <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-1">{s.label}</p>
                  <p className="font-bold text-xl" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[10px] text-stone-400 mt-0.5">{s.unit}</p>
                </div>
              ))}
            </div>

            {/* Today CTA — active plans only */}
            {plan.status === "active" && (
              <Link to={`/plans/${planId}/today`}
                className="block bg-stone-900 hover:bg-amber-400 hover:text-stone-900 text-white rounded-2xl p-5 shadow-md transition-all duration-200 group fu d1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 group-hover:text-stone-700 mb-1">Today</p>
                    <p className="serif text-2xl text-amber-400 group-hover:text-stone-900">Day {currentDay}</p>
                    <p className="text-sm text-stone-400 group-hover:text-stone-600 mt-1">
                      {savedMap[currentDay]
                        ? "Day saved ✓ — tap to review"
                        : "Tap to start tracking"}
                    </p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-stone-600 group-hover:text-stone-900 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            )}

            {/* Day grid */}
            <div className="fu d2">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">All Days</p>
                <div className="flex gap-2 text-[9px] text-stone-400 font-medium flex-wrap justify-end">
                  {[
                    { cls: "bg-amber-400",    label: "Today"  },
                    { cls: "bg-emerald-100",  label: "Saved"  },
                    { cls: "bg-red-100",      label: "Over"   },
                    { cls: "bg-stone-100",    label: "Missed" },
                  ].map(l => (
                    <span key={l.label} className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-sm inline-block ${l.cls}`} />
                      {l.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: plan.duration }, (_, i) => {
                  const day    = i + 1;
                  const status = dayStatus(day);
                  const entry  = savedMap[day];
                  return (
                    <Link key={day}
                      to={day === currentDay && plan.status === "active"
                        ? `/plans/${planId}/today`
                        : `/plans/${planId}/track`}
                      className={`relative rounded-xl p-2 text-center transition-all duration-150 hover:scale-105 hover:shadow-md cursor-pointer ${dayCls[status]}`}>
                      <p className="text-[10px] leading-none mb-0.5 h-3">{dayIcon[status]}</p>
                      <p className="text-sm font-bold leading-none">{day}</p>
                      {/* Exercised dot */}
                      {entry?.exercised && (
                        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-400" title="Exercised" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Template meals */}
            <div className="fu d3">
              <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-4">
                Daily Template · {plan.template_menus.length} meals
              </p>
              <div className="flex flex-col gap-2 mb-3">
                {plan.template_menus.map(food => (
                  <div key={food._id} className="flex items-center justify-between bg-white border border-stone-100 rounded-xl px-4 py-3 shadow-sm">
                    <div className="min-w-0">
                      <p className="font-semibold text-stone-800 text-sm truncate">{food.name}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{food.canteen} · {food.macros.calories} kcal</p>
                    </div>
                    <span className="text-sm font-bold text-stone-500 shrink-0 ml-3">฿{food.price}</span>
                  </div>
                ))}
              </div>
              <div className="bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 flex justify-between items-center text-sm">
                <span className="text-stone-500 font-medium">Template total</span>
                <div className="flex gap-4 font-semibold text-stone-700">
                  <span>{fmt(templateCal)} kcal</span>
                  <span>฿{templateCost}</span>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </>
  );
}
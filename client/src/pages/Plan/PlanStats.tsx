// client/src/pages/Plan/PlanStats.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchPlanById } from "../../api/planApi";
import { getPlanStats } from "../../api/dailyprogressApi";
import type { Plan } from "../../types/plan";

const fmt = (n: number) => Math.round(n).toLocaleString();

interface ChartDay {
  day_number:        number;
  date:              string;
  calories_exceeded: number;
  budget_exceeded:   number;
  exercised:         boolean;
  total_protein:     number;
  total_carbs:       number;
  total_fat:         number;
  total_sugar:       number;
}

export default function PlanStats() {
  const { planId } = useParams<{ planId: string }>();
  const navigate   = useNavigate();

  const [plan,    setPlan]    = useState<Plan | null>(null);
  const [stats,   setStats]   = useState<ChartDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

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
      } catch (e: any) { setError(e.message || "Failed to load stats"); }
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
      <p className="text-stone-500 text-sm">{error || "Not found"}</p>
      <button onClick={() => navigate(-1)} className="text-amber-500 text-sm hover:underline">← Back</button>
    </div>
  );

  // Build a lookup: day_number → ChartDay for saved days
  const savedMap = stats.reduce<Record<number, ChartDay>>((acc, d) => {
    acc[d.day_number] = d;
    return acc;
  }, {});

  // All plan days — blank if not yet saved
  const allDays = Array.from({ length: plan.duration }, (_, i) => {
    const day   = i + 1;
    const entry = savedMap[day] ?? null;
    return { day, entry };
  });

  // Summary stats
  const savedDays     = stats.length;
  const daysOver      = stats.filter(d => d.calories_exceeded > 0).length;
  const daysUnder     = savedDays - daysOver;
  const daysExercised = stats.filter(d => d.exercised).length;
  const compliance    = savedDays > 0 ? Math.round((daysUnder / savedDays) * 100) : 0;
  const totalExceeded = stats.reduce((s, d) => s + d.calories_exceeded, 0);
  const avgExceeded   = savedDays > 0 ? totalExceeded / savedDays : 0;

  // Chart scale — max exceeded calories (or a minimum of 500 for scale)
  const maxExceeded   = Math.max(...stats.map(d => d.calories_exceeded), 500);

  // Avg macro exceeded per saved day (0 on days within target)
  const avgMacroEx = (key: "total_protein" | "total_carbs" | "total_fat" | "total_sugar", target: number) =>
    savedDays > 0
      ? stats.reduce((s, d) => s + Math.max(0, d[key] - target), 0) / savedDays
      : 0;
  const avgProteinEx = avgMacroEx("total_protein", plan?.macro_targets.protein      ?? 0);
  const avgCarbsEx   = avgMacroEx("total_carbs",   plan?.macro_targets.carbohydrate ?? 0);
  const avgFatEx     = avgMacroEx("total_fat",      plan?.macro_targets.fat          ?? 0);
  const avgSugarEx   = avgMacroEx("total_sugar",    plan?.macro_targets.sugar        ?? 0);

  // Budget stats
  const hasBudget     = plan.priority === "budget" && plan.budget_limit != null;
  const totalBudgetEx = stats.reduce((s, d) => s + d.budget_exceeded, 0);
  const maxBudgetEx   = Math.max(...stats.map(d => d.budget_exceeded), plan.budget_limit ?? 100);

  // Macro chart scale — tallest stacked bar across all saved days
  const maxMacroTotal = Math.max(
    ...stats.map(d => d.total_protein + d.total_carbs + d.total_fat + d.total_sugar),
    1,
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
        .ps { font-family:'DM Sans',sans-serif; }
        .serif { font-family:'DM Serif Display',serif; }
        @keyframes fu{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .fu{animation:fu 0.35s ease both}
        .d1{animation-delay:.07s} .d2{animation-delay:.14s} .d3{animation-delay:.21s} .d4{animation-delay:.28s}
      `}</style>

      <div className="ps min-h-screen bg-stone-50 pb-16">

        {/* Header */}
        <header className="bg-white border-b border-stone-200 sticky top-0 z-20 shadow-sm px-5 py-4 flex items-center justify-between">
          <Link to={`/plans/${planId}/track`}
            className="flex items-center gap-2 text-stone-400 hover:text-stone-800 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium hidden sm:block">Plan Overview</span>
          </Link>
          <h1 className="font-bold text-stone-800 text-sm">Statistics</h1>
          <div className="w-20" />
        </header>

        <div className="max-w-2xl mx-auto px-5 py-8 space-y-8">

          {/* Title */}
          <div className="fu">
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-1">{plan.name}</p>
            <h1 className="serif text-3xl text-stone-900">Your Progress</h1>
            <p className="text-stone-400 text-sm mt-1 capitalize">{plan.fitness_goal} · {plan.duration} days</p>
          </div>

          {/* KPI cards — row 1: general */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 fu d1">
            {[
              { label: "Days Saved",   value: `${savedDays}/${plan.duration}`, color: "#86efac" },
              { label: "Compliance",   value: `${compliance}%`,                 color: compliance >= 70 ? "#86efac" : "#fca5a5" },
              { label: "Exercised",    value: `${daysExercised} days`,          color: "#93c5fd" },
              { label: "Avg Cal Exceeded", value: avgExceeded > 0 ? `${fmt(avgExceeded)} kcal` : "None", color: avgExceeded > 0 ? "#fca5a5" : "#86efac" },
            ].map(k => (
              <div key={k.label} className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm text-center">
                <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-1">{k.label}</p>
                <p className="font-bold text-lg leading-tight" style={{ color: k.color }}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* KPI cards — row 2: avg macro exceeded */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 fu d1">
            {[
              { label: "Avg Protein Ex", value: avgProteinEx, unit: "g", color: "#60a5fa" },
              { label: "Avg Carbs Ex",   value: avgCarbsEx,   unit: "g", color: "#f59e0b" },
              { label: "Avg Fat Ex",     value: avgFatEx,     unit: "g", color: "#f97316" },
              { label: "Avg Sugar Ex",   value: avgSugarEx,   unit: "g", color: "#a78bfa" },
            ].map(k => (
              <div key={k.label} className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm text-center">
                <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-1">{k.label}</p>
                <p className="font-bold text-lg leading-tight" style={{ color: k.value > 0 ? "#fca5a5" : k.color }}>
                  {k.value > 0 ? `+${(Math.round(k.value * 10) / 10)}${k.unit}` : "None"}
                </p>
              </div>
            ))}
          </div>

          {/* Calories exceeded bar chart */}
          <div className="bg-white border border-stone-100 rounded-3xl p-6 shadow-sm fu d2">
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-1">Calories Exceeded Per Day</p>
            <div className="flex items-center gap-4 mb-5 text-xs text-stone-400 flex-wrap">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" />Within target</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block" />Over target</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-stone-200 inline-block" />Not saved</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />Exercised</span>
            </div>

            <div className="relative">
              <div className="flex items-end gap-1 h-40">
                {allDays.map(({ day, entry }) => {
                  const isEmpty    = !entry;
                  const exceeded   = entry?.calories_exceeded ?? 0;
                  const isOver     = exceeded > 0;
                  const pct        = isEmpty ? 0 : isOver
                    ? (exceeded / maxExceeded) * 100
                    : 15; // small positive bar for within-target days

                  return (
                    <div key={day} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[9px] px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                        {isEmpty
                          ? `Day ${day}: —`
                          : isOver
                            ? `Day ${day}: +${fmt(exceeded)} kcal`
                            : `Day ${day}: ✓ on target`}
                      </div>
                      {/* Bar */}
                      <div className="w-full rounded-t-sm transition-all duration-500 relative"
                        style={{
                          height:     `${isEmpty ? 4 : Math.max(pct, 8)}%`,
                          background: isEmpty ? "#e7e5e4" : isOver ? "#f87171" : "#fbbf24",
                          minHeight:  2,
                        }}>
                        {/* Exercised dot */}
                        {entry?.exercised && (
                          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-400 border border-white" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Zero line label */}
              <div className="flex justify-between text-[9px] text-stone-300 mt-2">
                {allDays.map(({ day }) => (
                  <div key={day} className="flex-1 text-center">
                    {day % 7 === 1 || day === 1 ? day : ""}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Budget exceeded chart — budget plans only */}
          {hasBudget && (
            <div className="bg-white border border-stone-100 rounded-3xl p-6 shadow-sm fu d3">
              <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-1">Budget Exceeded Per Day</p>
              <p className="text-xs text-stone-400 mb-5">
                Budget: ฿{plan.budget_limit}/day · Total over: ฿{totalBudgetEx.toFixed(0)}
              </p>

              <div className="flex items-end gap-1 h-32">
                {allDays.map(({ day, entry }) => {
                  const isEmpty  = !entry;
                  const exceeded = entry?.budget_exceeded ?? 0;
                  const isOver   = exceeded > 0;
                  const pct      = isEmpty ? 0 : isOver
                    ? (exceeded / maxBudgetEx) * 100
                    : 15;
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[9px] px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                        {isEmpty ? `Day ${day}: —` : isOver ? `Day ${day}: +฿${exceeded.toFixed(0)}` : `Day ${day}: ✓`}
                      </div>
                      <div className="w-full rounded-t-sm transition-all duration-500"
                        style={{
                          height:    `${isEmpty ? 4 : Math.max(pct, 8)}%`,
                          background: isEmpty ? "#e7e5e4" : isOver ? "#f87171" : "#34d399",
                          minHeight: 2,
                        }} />
                    </div>
                  );
                })}
              </div>
              <div className="flex mt-2">
                {allDays.map(({ day }) => (
                  <div key={day} className="flex-1 text-center text-[9px] text-stone-300">
                    {day % 7 === 1 || day === 1 ? day : ""}
                  </div>
                ))}
              </div>
              <div className="flex items-center mt-3 gap-4 text-xs text-stone-400">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" />Within budget</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block" />Over budget</span>
              </div>
            </div>
          )}

          {/* Macronutrient stacked bar chart */}
          <div className="bg-white border border-stone-100 rounded-3xl p-6 shadow-sm fu d3">
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-1">Macronutrients Per Day</p>
            <p className="text-xs text-stone-400 mb-4">Protein · Carbs · Fat · Sugar (g) — stacked per saved day</p>

            {/* Legend */}
            <div className="flex items-center gap-4 mb-5 text-xs text-stone-400 flex-wrap">
              {([
                { label: "Protein", color: "#60a5fa" },
                { label: "Carbs",   color: "#f59e0b" },
                { label: "Fat",     color: "#f97316" },
                { label: "Sugar",   color: "#a78bfa" },
              ] as const).map(m => (
                <span key={m.label} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{ background: m.color }} />
                  {m.label}
                </span>
              ))}
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-stone-200 inline-block" />Not saved</span>
            </div>

            <div className="relative">
              <div className="flex items-end gap-1 h-40">
                {allDays.map(({ day, entry }) => {
                  if (!entry) {
                    return (
                      <div key={day} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[9px] px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                          Day {day}: —
                        </div>
                        <div className="w-full rounded-t-sm" style={{ height: 4, background: "#e7e5e4", minHeight: 2 }} />
                      </div>
                    );
                  }
                  const total   = entry.total_protein + entry.total_carbs + entry.total_fat + entry.total_sugar;
                  const barPct  = (total / maxMacroTotal) * 100;
                  const segs = [
                    { key: "protein", val: entry.total_protein, color: "#60a5fa" },
                    { key: "carbs",   val: entry.total_carbs,   color: "#f59e0b" },
                    { key: "fat",     val: entry.total_fat,     color: "#f97316" },
                    { key: "sugar",   val: entry.total_sugar,   color: "#a78bfa" },
                  ];
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[9px] px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 text-left space-y-0.5">
                        <p className="font-bold">Day {day}</p>
                        <p>Protein: {Math.round(entry.total_protein)}g</p>
                        <p>Carbs: {Math.round(entry.total_carbs)}g</p>
                        <p>Fat: {Math.round(entry.total_fat)}g</p>
                        <p>Sugar: {Math.round(entry.total_sugar)}g</p>
                      </div>
                      {/* Stacked bar */}
                      <div className="w-full flex flex-col-reverse overflow-hidden rounded-t-sm transition-all duration-500"
                        style={{ height: `${Math.max(barPct, 4)}%` }}>
                        {segs.map(seg => (
                          <div key={seg.key}
                            style={{
                              flex: seg.val,
                              background: seg.color,
                              minHeight: seg.val > 0 ? 2 : 0,
                            }} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Day labels */}
              <div className="flex justify-between text-[9px] text-stone-300 mt-2">
                {allDays.map(({ day }) => (
                  <div key={day} className="flex-1 text-center">
                    {day % 7 === 1 || day === 1 ? day : ""}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Per-day breakdown table */}
          <div className="bg-white border border-stone-100 rounded-3xl p-6 shadow-sm fu d4">
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-4">Day-by-Day Breakdown</p>
            <div className="overflow-y-auto max-h-80">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] text-stone-400 uppercase tracking-widest border-b border-stone-100">
                    <th className="pb-2 font-medium">Day</th>
                    <th className="pb-2 font-medium text-right">Cal Exceeded</th>
                    {hasBudget && <th className="pb-2 font-medium text-right">฿ Exceeded</th>}
                    <th className="pb-2 font-medium text-right">Exercise</th>
                    <th className="pb-2 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allDays.map(({ day, entry }) => (
                    <tr key={day} className="border-b border-stone-50 last:border-0 hover:bg-stone-50 transition">
                      <td className="py-2.5 font-semibold text-stone-700">Day {day}</td>

                      <td className="py-2.5 text-right">
                        {entry
                          ? entry.calories_exceeded > 0
                            ? <span className="text-xs font-bold text-red-500">+{fmt(entry.calories_exceeded)} kcal</span>
                            : <span className="text-xs font-bold text-emerald-600">On target</span>
                          : <span className="text-stone-300 text-xs">—</span>}
                      </td>

                      {hasBudget && (
                        <td className="py-2.5 text-right">
                          {entry
                            ? entry.budget_exceeded > 0
                              ? <span className="text-xs font-bold text-red-500">+฿{entry.budget_exceeded.toFixed(0)}</span>
                              : <span className="text-xs font-bold text-emerald-600">Within</span>
                            : <span className="text-stone-300 text-xs">—</span>}
                        </td>
                      )}

                      <td className="py-2.5 text-right">
                        {entry?.exercised
                          ? <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">✓ done</span>
                          : <span className="text-stone-300 text-xs">—</span>}
                      </td>

                      <td className="py-2.5 text-right">
                        {entry
                          ? <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">saved</span>
                          : <span className="text-[10px] bg-stone-100 text-stone-400 px-2 py-0.5 rounded-full font-bold">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
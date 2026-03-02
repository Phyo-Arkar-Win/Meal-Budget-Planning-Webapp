// client/src/pages/Plan/steps/Step2Settings.tsx
import type { MacroPreview, Priority } from "../../../types/plan";

const fmt = (n: number) => Math.round(n).toLocaleString();

interface Props {
  fitnessGoal:    string;
  activityLevel:  string;
  macros:         MacroPreview | null;
  priority:       Priority;
  budgetLimit:    string;
  duration:       string;
  setPriority:    (v: Priority) => void;
  setBudgetLimit: (v: string) => void;
  setDuration:    (v: string) => void;
}

export default function Step2Settings({
  fitnessGoal, activityLevel, macros,
  priority, budgetLimit, duration,
  setPriority, setBudgetLimit, setDuration,
}: Props) {

  const inputCls = "w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition";

  return (
    <div className="slide-in">
      <h2 className="serif text-3xl text-stone-900 mb-1">Plan settings</h2>
      <p className="text-stone-400 text-sm mb-8">
        Set your priority, budget, and how long you want to track.
      </p>

      {/* Priority cards */}
      <div className="mb-6">
        <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-3">Priority</label>
        <div className="grid grid-cols-2 gap-3">
          {(["budget", "nutrient"] as Priority[]).map(p => (
            <button key={p} type="button" onClick={() => setPriority(p)}
              className="rounded-2xl border-2 p-4 text-left transition-all duration-200 cursor-pointer"
              style={{
                borderColor: priority === p ? "#1c1917" : "#e7e5e4",
                background:  priority === p ? "#1c1917" : "#fafaf9",
              }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-lg">{p === "budget" ? "💰" : "🥗"}</span>
                <span className="font-semibold text-sm capitalize"
                  style={{ color: priority === p ? "#f59e0b" : "#1c1917" }}>
                  {p}
                </span>
              </div>
              <p className="text-xs leading-relaxed"
                style={{ color: priority === p ? "#a8a29e" : "#78716c" }}>
                {p === "budget"
                  ? "Stay within a daily spending limit. Macros are a guide."
                  : "Focus purely on hitting your macros. Budget is unlimited."}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Budget limit — only for budget priority */}
      {priority === "budget" && (
        <div className="mb-6">
          <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2">
            Daily Budget (฿)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-semibold text-sm">฿</span>
            <input type="number" min={1} step={0.5} placeholder="e.g. 150"
              value={budgetLimit} onChange={e => setBudgetLimit(e.target.value)}
              className={inputCls + " pl-8"} />
          </div>
        </div>
      )}

      {/* Duration */}
      <div className="mb-6">
        <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2">
          Duration (days)
        </label>
        <div className="flex gap-2 flex-wrap mb-3">
          {[7, 14, 21, 30].map(d => (
            <button key={d} type="button"
              className={`pill-btn${Number(duration) === d ? " active" : ""}`}
              onClick={() => setDuration(String(d))}>
              {d} days
            </button>
          ))}
        </div>
        <input type="number" min={1} max={365} placeholder="Or type a custom number"
          value={duration} onChange={e => setDuration(e.target.value)}
          className={inputCls} />
      </div>

      {/* Summary chip */}
      {macros && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm">
          <p className="font-semibold text-stone-700 mb-1">Plan summary</p>
          <p className="text-stone-500 leading-relaxed">
            <span className="text-stone-700 font-medium">{fitnessGoal}</span> goal ·{" "}
            <span className="text-stone-700 font-medium">{activityLevel}</span> ·{" "}
            {priority === "budget"
              ? <>Budget ฿<span className="text-stone-700 font-medium">{budgetLimit || "—"}</span>/day · </>
              : "Unlimited budget · "}
            <span className="text-stone-700 font-medium">{duration || "—"}</span> days ·{" "}
            <span className="text-stone-700 font-medium">{fmt(macros.daily_cal)} kcal</span>/day
          </p>
        </div>
      )}
    </div>
  );
}
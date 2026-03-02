// client/src/pages/Plan/steps/Step4Review.tsx
import type { Food, MacroPreview, Priority } from "../../../types/plan";

const fmt    = (n: number) => Math.round(n).toLocaleString();
const fmtDec = (n: number) => n.toFixed(1);

interface Props {
  fitnessGoal:   string;
  activityLevel: string;
  priority:      Priority;
  budgetLimit:   string;
  duration:      string;
  macros:        MacroPreview | null;
  selectedFoods: Food[];
  error:         string;
}

export default function Step4Review({
  fitnessGoal, activityLevel, priority, budgetLimit, duration,
  macros, selectedFoods, error,
}: Props) {

  const totals = selectedFoods.reduce(
    (acc, f) => ({ calories: acc.calories + f.macros.calories, price: acc.price + f.price }),
    { calories: 0, price: 0 }
  );

  return (
    <div className="slide-in">
      <h2 className="serif text-3xl text-stone-900 mb-1">Review your plan</h2>
      <p className="text-stone-400 text-sm mb-8">Double-check everything before creating.</p>

      {error && (
        <div className="mb-5 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl p-3">{error}</div>
      )}

      {/* Goal & settings */}
      <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm mb-4">
        <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-4">Goal & Settings</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: "Fitness Goal",  value: fitnessGoal },
            { label: "Activity",      value: activityLevel },
            { label: "Priority",      value: priority.charAt(0).toUpperCase() + priority.slice(1) },
            { label: "Duration",      value: `${duration} days` },
            { label: "Daily Budget",  value: priority === "budget" ? `฿${budgetLimit}` : "Unlimited" },
            { label: "Daily Calories", value: macros ? `${fmt(macros.daily_cal)} kcal` : "—" },
          ].map(r => (
            <div key={r.label}>
              <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-0.5">{r.label}</p>
              <p className="text-sm font-semibold text-stone-800">{r.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Macros */}
      {macros && (
        <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm mb-4">
          <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-4">Daily Macro Targets</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Protein",  value: `${fmtDec(macros.protein)}g`,      color: "#86efac" },
              { label: "Carbs",    value: `${fmtDec(macros.carbohydrate)}g`, color: "#93c5fd" },
              { label: "Fat",      value: `${fmtDec(macros.fat)}g`,          color: "#fca5a5" },
              { label: "Sugar",    value: `${fmtDec(macros.sugar)}g`,        color: "#d8b4fe" },
            ].map(m => (
              <div key={m.label} className="macro-chip">
                <span className="text-sm font-bold" style={{ color: m.color }}>{m.value}</span>
                <span className="text-[10px] text-stone-500 font-medium mt-1">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Food template */}
      <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
            Daily Meals ({selectedFoods.length})
          </p>
          <p className="text-xs text-stone-500">
            Total: <span className="font-semibold text-stone-800">{fmt(totals.calories)} kcal</span>
            {priority === "budget" && (
              <> · <span className="font-semibold text-stone-800">฿{totals.price.toFixed(2)}</span></>
            )}
          </p>
        </div>
        <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto">
          {selectedFoods.map((food, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm py-1.5 border-b border-stone-50 last:border-0">
              <span className="text-stone-700 truncate mr-4">{food.name}</span>
              <span className="text-stone-400 shrink-0">{food.macros.calories} kcal · ฿{food.price}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
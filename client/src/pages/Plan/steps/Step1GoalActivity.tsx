// client/src/pages/Plan/steps/Step1GoalActivity.tsx
import { useEffect } from "react";
import { previewPlanMacros } from "../../../api/planApi";
import type { MacroPreview } from "../../../types/plan";

const FITNESS_GOALS   = ["Maintenance", "Lose Weight", "Build Muscle"];
const ACTIVITY_LEVELS = ["Sedentary", "Lightly Active", "Moderately Active", "Very Active", "Extra Active"];

const fmt    = (n: number) => Math.round(n).toLocaleString();
const fmtDec = (n: number) => n.toFixed(1);

interface Props {
  fitnessGoal:      string;
  activityLevel:    string;
  macros:           MacroPreview | null;
  macroLoading:     boolean;
  setFitnessGoal:   (v: string) => void;
  setActivityLevel: (v: string) => void;
  setMacros:        (v: MacroPreview | null) => void;
  setMacroLoading:  (v: boolean) => void;
}

export default function Step1GoalActivity({
  fitnessGoal, activityLevel, macros, macroLoading,
  setFitnessGoal, setActivityLevel, setMacros, setMacroLoading,
}: Props) {

  useEffect(() => {
    const preview = async () => {
      setMacroLoading(true);
      try {
        const data = await previewPlanMacros(fitnessGoal, activityLevel);
        setMacros(data);
      } catch {
        setMacros(null);
      } finally {
        setMacroLoading(false);
      }
    };
    preview();
  }, [fitnessGoal, activityLevel]);

  return (
    <div className="slide-in">
      <h2 className="serif text-3xl text-stone-900 mb-1">Set your goal</h2>
      <p className="text-stone-400 text-sm mb-8">
        Choose the fitness goal and activity level for this plan. Macros are calculated for you.
      </p>

      <div className="mb-6">
        <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-3">
          Fitness Goal
        </label>
        <div className="flex flex-wrap gap-2">
          {FITNESS_GOALS.map(g => (
            <button key={g} type="button"
              className={`pill-btn${fitnessGoal === g ? " active" : ""}`}
              onClick={() => setFitnessGoal(g)}>
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-3">
          Activity Level
        </label>
        <div className="flex flex-wrap gap-2">
          {ACTIVITY_LEVELS.map(a => (
            <button key={a} type="button"
              className={`pill-btn${activityLevel === a ? " active" : ""}`}
              onClick={() => setActivityLevel(a)}>
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Live macro preview */}
      <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">Your Daily Targets</p>
          {macroLoading && <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />}
        </div>

        {macros ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Calories", value: fmt(macros.daily_cal),       unit: "kcal", color: "#f59e0b" },
              { label: "Protein",  value: fmtDec(macros.protein),      unit: "g",    color: "#86efac" },
              { label: "Carbs",    value: fmtDec(macros.carbohydrate), unit: "g",    color: "#93c5fd" },
              { label: "Fat",      value: fmtDec(macros.fat),          unit: "g",    color: "#fca5a5" },
            ].map(m => (
              <div key={m.label} className="macro-chip">
                <span className="text-lg font-bold" style={{ color: m.color }}>{m.value}</span>
                <span className="text-[10px] text-stone-400 mt-0.5">{m.unit}</span>
                <span className="text-[10px] text-stone-500 font-medium mt-1">{m.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-20 flex items-center justify-center text-stone-300 text-sm">
            {macroLoading ? "Calculating…" : "Select goal and activity to see targets"}
          </div>
        )}
      </div>
    </div>
  );
}
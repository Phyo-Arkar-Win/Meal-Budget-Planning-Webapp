// client/src/pages/Plan/CreatePlan.tsx
// Orchestrator only — all step UI lives in ./steps/Step*.tsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fetchUserProfile } from "../../api/userApi";
import { createPlan } from "../../api/planApi";
import type { Food, MacroPreview, Priority } from "../../types/plan";

import { Step1GoalActivity, Step2Settings, Step3AddFoods, Step4Review } from './steps';

const TOTAL_STEPS  = 4;
const STEP_LABELS  = ["Goal & Activity", "Plan Settings", "Add Foods", "Review"];

export default function CreatePlan() {
  const navigate = useNavigate();

  // Step state
  const [step, setStep] = useState(1);

  // Step 1
  const [fitnessGoal,   setFitnessGoal]   = useState("Maintenance");
  const [activityLevel, setActivityLevel] = useState("Sedentary");
  const [macros,        setMacros]        = useState<MacroPreview | null>(null);
  const [macroLoading,  setMacroLoading]  = useState(false);

  // Step 2
  const [priority,    setPriority]    = useState<Priority>("budget");
  const [budgetLimit, setBudgetLimit] = useState("");
  const [duration,    setDuration]    = useState("7");

  // Step 3
  const [selectedFoods, setSelectedFoods] = useState<Food[]>([]);

  // Step 4
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");

  // Load user defaults on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    const load = async () => {
      try {
        const user = await fetchUserProfile(token);
        if (user.fitness_goal)   setFitnessGoal(user.fitness_goal);
        if (user.activity_level) setActivityLevel(user.activity_level);
      } catch {}
    };
    load();
  }, [navigate]);

  // Step validation
  const canProceed = () => {
    if (step === 1) return !!macros;
    if (step === 2) {
      if (!duration || Number(duration) < 1) return false;
      if (priority === "budget" && (!budgetLimit || Number(budgetLimit) <= 0)) return false;
      return true;
    }
    if (step === 3) return selectedFoods.length > 0;
    return true;
  };

  const addFood    = (food: Food) => setSelectedFoods(prev => [...prev, food]);
  const removeFood = (idx: number) => setSelectedFoods(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    setError(""); setSubmitting(true);
    try {
      await createPlan({
        fitness_goal:   fitnessGoal,
        activity_level: activityLevel,
        priority,
        budget_limit:   priority === "budget" ? Number(budgetLimit) : null,
        duration:       Number(duration),
        template_menus: selectedFoods.map(f => f._id),
      });
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Failed to create plan.");
      setSubmitting(false);
    }
  };

  // ── Shared CSS injected once ────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        .cp-root { font-family: 'DM Sans', sans-serif; }
        .serif   { font-family: 'DM Serif Display', serif; }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .slide-in { animation: slideIn 0.3s ease both; }

        .pill-btn {
          padding: 8px 18px;
          border-radius: 99px;
          font-size: 13px;
          font-weight: 600;
          border: 1.5px solid #e7e5e4;
          background: #fafaf9;
          color: #78716c;
          cursor: pointer;
          transition: all 0.18s;
          font-family: 'DM Sans', sans-serif;
        }
        .pill-btn:hover  { border-color: #d6d3d1; background: #f5f5f4; }
        .pill-btn.active { background: #1c1917; color: #f59e0b; border-color: #1c1917; }

        .macro-chip {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: #f5f5f4;
          border-radius: 10px;
          padding: 8px 12px;
          min-width: 70px;
        }
      `}</style>

      <div className="cp-root min-h-screen bg-stone-50 flex">

        {/* ── LEFT PANEL ── */}
        <div className="hidden md:flex flex-col w-72 bg-stone-900 text-white p-8 relative shrink-0">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />

          <Link to="/" className="flex items-center gap-2 text-stone-400 hover:text-white transition group w-fit mb-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm">Dashboard</span>
          </Link>

          <div className="flex-1">
            <h1 className="serif text-4xl text-amber-400 leading-tight mb-3">New Plan</h1>
            <p className="text-stone-400 text-sm leading-relaxed mb-10">
              Build a personalised meal plan with your own calorie targets, budget, and food choices.
            </p>

            {/* Step list */}
            <div className="flex flex-col gap-3">
              {STEP_LABELS.map((label, i) => {
                const s    = i + 1;
                const done = step > s;
                const cur  = step === s;
                return (
                  <div key={s} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300"
                      style={{
                        background: done ? "#f59e0b" : cur ? "#fff" : "#3d3836",
                        color:      done ? "#1c1917" : cur ? "#1c1917" : "#78716c",
                      }}>
                      {done
                        ? <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        : s}
                    </div>
                    <span className="text-sm transition-colors duration-300"
                      style={{ color: cur ? "#fff" : done ? "#f59e0b" : "#78716c" }}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Macro sidebar card */}
          {macros && (
            <div className="mt-auto pt-6 border-t border-stone-800">
              <p className="text-xs text-stone-500 uppercase tracking-widest mb-3">Daily Targets</p>
              {[
                { label: "Calories",  value: `${Math.round(macros.daily_cal).toLocaleString()} kcal`, color: "#f59e0b" },
                { label: "Protein",   value: `${macros.protein.toFixed(1)}g`,      color: "#86efac" },
                { label: "Carbs",     value: `${macros.carbohydrate.toFixed(1)}g`, color: "#93c5fd" },
                { label: "Fat",       value: `${macros.fat.toFixed(1)}g`,          color: "#fca5a5" },
              ].map(m => (
                <div key={m.label} className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-stone-400">{m.label}</span>
                  <span className="text-xs font-semibold" style={{ color: m.color }}>{m.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-5 py-10 md:px-10">

            {/* Mobile back */}
            <div className="md:hidden mb-6">
              <Link to="/" className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition w-fit text-sm font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </Link>
            </div>

            {/* Step bar */}
            <div className="flex items-center gap-1.5 mb-8">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(s => (
                <div key={s} className="flex items-center gap-1.5 flex-1">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all duration-300 shrink-0"
                    style={{
                      background: step > s ? "#f59e0b" : step === s ? "#1c1917" : "#e7e5e4",
                      color:      step > s ? "#1c1917" : step === s ? "#f59e0b" : "#a8a29e",
                    }}>
                    {step > s
                      ? <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      : s}
                  </div>
                  {s < TOTAL_STEPS && (
                    <div className="flex-1 h-0.5 rounded-full transition-all duration-500"
                      style={{ background: step > s ? "#f59e0b" : "#e7e5e4" }} />
                  )}
                </div>
              ))}
            </div>

            {/* Step content */}
            {step === 1 && (
              <Step1GoalActivity
                fitnessGoal={fitnessGoal} activityLevel={activityLevel}
                macros={macros} macroLoading={macroLoading}
                setFitnessGoal={setFitnessGoal} setActivityLevel={setActivityLevel}
                setMacros={setMacros} setMacroLoading={setMacroLoading}
              />
            )}
            {step === 2 && (
              <Step2Settings
                fitnessGoal={fitnessGoal} activityLevel={activityLevel} macros={macros}
                priority={priority} budgetLimit={budgetLimit} duration={duration}
                setPriority={setPriority} setBudgetLimit={setBudgetLimit} setDuration={setDuration}
              />
            )}
            {step === 3 && (
              <Step3AddFoods
                selectedFoods={selectedFoods} macros={macros}
                priority={priority} budgetLimit={budgetLimit}
                onAdd={addFood} onRemove={removeFood}
              />
            )}
            {step === 4 && (
              <Step4Review
                fitnessGoal={fitnessGoal} activityLevel={activityLevel}
                priority={priority} budgetLimit={budgetLimit} duration={duration}
                macros={macros} selectedFoods={selectedFoods} error={error}
              />
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3 mt-8">
              {step > 1 && (
                <button type="button" onClick={() => { setStep(s => s - 1); setError(""); }}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-3.5 rounded-xl transition text-sm flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
              )}

              {step < TOTAL_STEPS ? (
                <button type="button"
                  onClick={() => { if (canProceed()) setStep(s => s + 1); }}
                  disabled={!canProceed()}
                  className="flex-[2] bg-stone-900 hover:bg-amber-400 hover:text-stone-900 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2">
                  Continue
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={submitting}
                  className="flex-[2] bg-amber-400 hover:bg-amber-500 text-stone-900 font-bold py-3.5 rounded-xl transition-all duration-200 disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                  {submitting
                    ? <div className="w-4 h-4 border-2 border-stone-700 border-t-transparent rounded-full animate-spin" />
                    : <>Create Plan <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></>}
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
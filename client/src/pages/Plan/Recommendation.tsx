// client/src/pages/Plan/Recommendation.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchPlanById } from "../../api/planApi";
import { saveProgress, getExercises } from "../../api/dailyprogressApi";
import type { Plan } from "../../types/plan";
import type { Exercise, DailyProgress } from "../../types/progress";

const API_URL = import.meta.env.VITE_API_URL;
const fmt = (n: number) => Math.round(n).toLocaleString();

// Format minutes → "Xh Ym" when ≥ 60, otherwise "Xm"
const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

const getProgressById = async (progressId: string): Promise<DailyProgress> => {
  const res  = await fetch(`${API_URL}/api/progress/entry/${progressId}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch progress");
  return data;
};

export default function Recommendation() {
  const { planId, progressId } = useParams<{ planId: string; progressId: string }>();
  const navigate = useNavigate();

  const [plan,      setPlan]      = useState<Plan | null>(null);
  const [progress,  setProgress]  = useState<DailyProgress | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");

  const [selectedExercise,  setSelectedExercise]  = useState<Exercise | null>(null);
  const [actuallyExercised, setActuallyExercised] = useState(false);

  useEffect(() => {
    if (!planId || !progressId) return;
    (async () => {
      setLoading(true);
      try {
        const [p, prog, exs] = await Promise.all([
          fetchPlanById(planId),
          getProgressById(progressId),
          getExercises(),
        ]);
        setPlan(p);
        setProgress(prog);
        setExercises(exs);

        if (prog.recommendation_data?.exercise_selected) {
          const match = exs.find(e => e._id === prog.recommendation_data.exercise_selected);
          if (match) setSelectedExercise(match);
          setActuallyExercised(prog.recommendation_data.actually_exercised ?? false);
        }
      } catch (e: any) { setError(e.message || "Failed to load"); }
      finally { setLoading(false); }
    })();
  }, [planId, progressId]);

  const caloriesExceeded = progress?.recommendation_data?.calories_exceeded ?? 0;
  const isSaved          = progress?.status === "saved";

  const minutesNeeded = selectedExercise && caloriesExceeded > 0
    ? Math.ceil((caloriesExceeded / selectedExercise.cal_per_hour) * 60)
    : selectedExercise ? 0 : null;

  const handleSaveDay = async () => {
    if (!progressId || saving) return;
    setSaving(true);
    setError("");
    try {
      await saveProgress(progressId, {
        exercise_selected:     selectedExercise?._id,
        exercise_time_minutes: minutesNeeded ?? undefined,
        actually_exercised:    actuallyExercised,
      });
      navigate(`/plans/${planId}/track`);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !plan || !progress) return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-3">
      <p className="text-stone-500 text-sm">{error || "Not found"}</p>
      <button onClick={() => navigate(`/plans/${planId}/track`)} className="text-amber-500 text-sm hover:underline">← Plan Overview</button>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
        .rec { font-family:'DM Sans',sans-serif; }
        .serif { font-family:'DM Serif Display',serif; }
        @keyframes fu{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .fu{animation:fu 0.35s ease both}
        .d1{animation-delay:.07s} .d2{animation-delay:.14s} .d3{animation-delay:.21s}
      `}</style>

      <div className="rec min-h-screen bg-stone-50">

        {/* Header */}
        <header className="bg-white border-b border-stone-200 sticky top-0 z-20 shadow-sm px-5 py-4 flex items-center justify-between">
          <Link to={`/plans/${planId}/today`}
            className="flex items-center gap-2 text-stone-400 hover:text-stone-800 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium hidden sm:block">Back to Tracking</span>
          </Link>
          <div className="text-center">
            <p className="font-bold text-stone-800 text-sm">{plan.name}</p>
            <p className="text-xs text-stone-400">Day {progress.day_number} · Exercise</p>
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${
            isSaved ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
          }`}>
            {isSaved ? "Saved ✓" : "Review"}
          </span>
        </header>

        <div className="max-w-lg mx-auto px-5 py-8 space-y-6">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
          )}

          {/* Calories exceeded banner */}
          {caloriesExceeded > 0 ? (
            <div className="bg-red-600 text-white rounded-3xl p-6 fu">
              <p className="text-[11px] font-bold uppercase tracking-widest text-red-200 mb-1">Calories over target</p>
              <p className="serif text-5xl text-red-100">{fmt(caloriesExceeded)}</p>
              <p className="text-sm text-red-200 mt-1">kcal above your {fmt(plan.macro_targets.daily_cal)} kcal target</p>
            </div>
          ) : (
            <div className="bg-emerald-600 text-white rounded-3xl p-6 fu">
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-200 mb-1">Within target 🎉</p>
              <p className="serif text-3xl text-emerald-100">Great job today!</p>
              <p className="text-sm text-emerald-200 mt-1">You stayed within your {fmt(plan.macro_targets.daily_cal)} kcal goal</p>
            </div>
          )}

          {/* Exercise dropdown + result */}
          <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm fu d1">
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-3">
              {caloriesExceeded > 0 ? "Choose Exercise to Burn It Off" : "Log Exercise (Optional)"}
            </p>

            <select
              value={selectedExercise?._id ?? ""}
              onChange={e => {
                const ex = exercises.find(x => x._id === e.target.value) ?? null;
                setSelectedExercise(ex);
              }}
              disabled={isSaved}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 transition appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-default">
              <option value="">— Select an exercise —</option>
              {exercises.map(ex => (
                <option key={ex._id} value={ex._id}>
                  {ex.name} ({fmt(ex.cal_per_hour)} kcal/hr)
                </option>
              ))}
            </select>

            {/* Result card */}
            {selectedExercise && (
              <div className={`mt-4 rounded-2xl px-5 py-5 text-center transition-colors duration-300 ${
                caloriesExceeded === 0 ? "bg-emerald-50 border border-emerald-200" : "bg-stone-900"
              }`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${
                  caloriesExceeded === 0 ? "text-emerald-600" : "text-white/50"
                }`}>
                  {caloriesExceeded === 0 ? "Optional duration" : "Recommended duration"}
                </p>

                {caloriesExceeded === 0 ? (
                  <p className="serif text-4xl text-emerald-600">No exercise needed</p>
                ) : (
                  <>
                    {/* Duration — large display, breaks into h + m if ≥ 60 */}
                    {minutesNeeded !== null && minutesNeeded >= 60 ? (
                      <div className="flex items-end justify-center gap-2">
                        <div className="text-center">
                          <p className="serif text-6xl font-bold text-amber-400 leading-none">
                            {Math.floor(minutesNeeded / 60)}
                          </p>
                          <p className="text-white/40 text-xs mt-1">hr</p>
                        </div>
                        {minutesNeeded % 60 > 0 && (
                          <>
                            <p className="serif text-4xl text-amber-300/60 pb-2">:</p>
                            <div className="text-center">
                              <p className="serif text-6xl font-bold text-amber-300 leading-none">
                                {String(minutesNeeded % 60).padStart(2, "0")}
                              </p>
                              <p className="text-white/40 text-xs mt-1">min</p>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <p className="serif text-6xl font-bold text-amber-400">{minutesNeeded}</p>
                    )}

                    <p className="text-white/60 text-sm mt-3">
                      {formatDuration(minutesNeeded ?? 0)} of {selectedExercise.name}
                    </p>
                    <p className="text-white/30 text-xs mt-1">
                      to burn {fmt(caloriesExceeded)} kcal at {fmt(selectedExercise.cal_per_hour)} kcal/hr
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Did you do it? */}
            {selectedExercise && !isSaved && (
              <button onClick={() => setActuallyExercised(p => !p)}
                className={`mt-3 w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                  actuallyExercised
                    ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                    : "bg-white border-stone-200 text-stone-500 hover:border-stone-300"
                }`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  actuallyExercised ? "bg-emerald-500 border-emerald-500" : "border-stone-300"
                }`}>
                  {actuallyExercised && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-semibold">
                  {actuallyExercised ? "I completed the exercise ✓" : "Mark as completed"}
                </span>
              </button>
            )}

            {/* Saved summary */}
            {isSaved && selectedExercise && (
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-stone-600">
                <p className="font-semibold text-stone-800">{selectedExercise.name}</p>
                <p className="text-xs text-stone-400 mt-0.5">
                  {formatDuration(minutesNeeded ?? 0)} recommended ·{" "}
                  {actuallyExercised
                    ? <span className="text-emerald-600 font-semibold">Completed ✓</span>
                    : <span className="text-stone-400">Not completed</span>}
                </p>
              </div>
            )}
          </div>

          {/* Save / back button */}
          <div className="pb-8 fu d2">
            {isSaved ? (
              <Link to={`/plans/${planId}/track`}
                className="block w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm text-center shadow-lg transition">
                Back to Plan Overview
              </Link>
            ) : (
              <button onClick={handleSaveDay} disabled={saving}
                className="w-full py-4 rounded-2xl bg-stone-900 hover:bg-amber-400 hover:text-stone-900 text-white font-bold text-sm shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50">
                {saving
                  ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : "Save Day ✓"}
              </button>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
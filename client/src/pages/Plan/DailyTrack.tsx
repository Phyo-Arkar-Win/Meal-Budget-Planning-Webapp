// client/src/pages/Plan/DailyTrack.tsx
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchPlanById } from "../../api/planApi";
import { getTodayProgress, updateTracking, completeTracking } from "../../api/dailyprogressApi";
import { getFoods } from "../../api/foodApi";
import type { Plan } from "../../types/plan";
import type { Food } from "../../types/food";
import type { DailyProgress, ExcessFood } from "../../types/progress";

const fmt = (n: number) => Math.round(n).toLocaleString();

export default function DailyTrack() {
  const { planId } = useParams<{ planId: string }>();
  const navigate   = useNavigate();

  const [plan,     setPlan]     = useState<Plan | null>(null);
  const [progress, setProgress] = useState<DailyProgress | null>(null);
  const [dbFoods,  setDbFoods]  = useState<Food[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  // Tick state keyed by INDEX — handles duplicate foods correctly
  const [tickedIndices, setTickedIndices] = useState<Set<number>>(new Set());
  const [excessList,    setExcessList]    = useState<ExcessFood[]>([]);

  // Picker modal
  const [showPicker,  setShowPicker]  = useState(false);
  const [pickerTab,   setPickerTab]   = useState<"db" | "manual">("db");
  const [dbSearch,    setDbSearch]    = useState("");
  const [manualForm,  setManualForm]  = useState({
    name: "", price: "", calories: "", carbs: "", protein: "", fat: "", sugar: "",
  });
  const [manualError, setManualError] = useState("");

  useEffect(() => {
    if (!planId) return;
    (async () => {
      setLoading(true);
      try {
        const [p, prog, foods] = await Promise.all([
          fetchPlanById(planId),
          getTodayProgress(planId),
          getFoods(),
        ]);
        setPlan(p);
        setProgress(prog);
        setDbFoods(foods);
        setExcessList(prog.excess_daily_foods ?? []);

        // Rebuild tickedIndices from saved eaten_template_menus
        // Consume matches one-at-a-time so duplicate foods restore independently
        const savedIds  = [...(prog.eaten_template_menus as string[])];
        const indices   = new Set<number>();
        const remaining = [...savedIds];
        p.template_menus.forEach((food: any, idx: number) => {
          const fid      = food._id?.toString() ?? food.toString();
          const matchIdx = remaining.findIndex(id => id === fid || id?.toString() === fid);
          if (matchIdx !== -1) {
            indices.add(idx);
            remaining.splice(matchIdx, 1);
          }
        });
        setTickedIndices(indices);
      } catch (e: any) { setError(e.message || "Failed to load"); }
      finally { setLoading(false); }
    })();
  }, [planId]);

  const status     = progress?.status ?? "tracking";
  const isTracking = status === "tracking";

  // Convert tickedIndices → Food _id array for backend
  const tickedFoodIds = useMemo((): string[] => {
    if (!plan) return [];
    return plan.template_menus
      .map((f, idx) => ({ id: f._id?.toString() ?? f.toString(), idx }))
      .filter(({ idx }) => tickedIndices.has(idx))
      .map(({ id }) => id);
  }, [plan, tickedIndices]);

  // ── Calorie & spend totals ────────────────────────────────────────────────
  // When tracking: calculate live from local tick state
  // When recommendation/saved: read from server data so display is always accurate
  const { totalCal, totalSpend } = useMemo(() => {
    if (!plan) return { totalCal: 0, totalSpend: 0 };

    if (isTracking) {
      // Live local calculation
      const templateCal   = plan.template_menus.filter((_, i) => tickedIndices.has(i)).reduce((s, f) => s + f.macros.calories, 0);
      const templateSpend = plan.template_menus.filter((_, i) => tickedIndices.has(i)).reduce((s, f) => s + f.price, 0);
      const excessCal     = excessList.reduce((s, e) => s + e.calories, 0);
      const excessSpend   = excessList.reduce((s, e) => s + e.price, 0);
      return { totalCal: templateCal + excessCal, totalSpend: templateSpend + excessSpend };
    } else {
      // After completing/saving — derive from what was actually saved on the server.
      // eaten_template_menus may be populated Food objects or plain _id strings.
      const savedFoods   = (progress?.eaten_template_menus ?? []) as any[];
      const templateCal  = savedFoods.reduce((s: number, f: any) => s + (f?.macros?.calories ?? 0), 0);
      const templateSpend= savedFoods.reduce((s: number, f: any) => s + (f?.price ?? 0), 0);
      const savedExcess  = progress?.excess_daily_foods ?? [];
      const excessCal    = savedExcess.reduce((s, e) => s + e.calories, 0);
      const excessSpend  = savedExcess.reduce((s, e) => s + e.price, 0);
      return { totalCal: templateCal + excessCal, totalSpend: templateSpend + excessSpend };
    }
  }, [plan, isTracking, tickedIndices, excessList, progress]);

  const calTarget = plan?.macro_targets.daily_cal ?? 2000;
  const calPct    = Math.min(100, (totalCal / calTarget) * 100);
  const isOver    = totalCal > calTarget;

  const filteredDbFoods = useMemo(
    () => dbFoods.filter(f => f.name.toLowerCase().includes(dbSearch.toLowerCase())),
    [dbFoods, dbSearch]
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleToggle = (idx: number) => {
    if (!isTracking) return;
    setTickedIndices(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const handleSaveProgress = async () => {
    if (!progress || saving || !isTracking) return;
    setSaving(true);
    setError("");
    try {
      const updated = await updateTracking(progress._id, {
        eaten_template_menus: tickedFoodIds,
        excess_daily_foods:   excessList,
      });
      setProgress(updated);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleCompleteDay = async () => {
    if (!progress || saving || !isTracking) return;
    setSaving(true);
    setError("");
    try {
      await updateTracking(progress._id, {
        eaten_template_menus: tickedFoodIds,
        excess_daily_foods:   excessList,
      });
      const result = await completeTracking(progress._id);
      setProgress(result.data);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleAddFromDb = (food: Food) => {
    setExcessList(prev => {
      if (prev.some(e => e.name === food.name)) return prev;
      return [...prev, {
        name: food.name, price: food.price,
        calories: food.macros.calories, carbs: food.macros.carbs,
        protein: food.macros.protein, fat: food.macros.fat, sugar: food.macros.sugar,
      }];
    });
    setShowPicker(false);
    setDbSearch("");
  };

  const handleAddManual = () => {
    setManualError("");
    const { name, calories } = manualForm;
    if (!name.trim())                      { setManualError("Name is required");     return; }
    if (!calories || Number(calories) < 0) { setManualError("Enter valid calories"); return; }
    setExcessList(prev => [...prev, {
      name:     manualForm.name.trim(),
      price:    Number(manualForm.price)    || 0,
      calories: Number(manualForm.calories) || 0,
      carbs:    Number(manualForm.carbs)    || 0,
      protein:  Number(manualForm.protein)  || 0,
      fat:      Number(manualForm.fat)      || 0,
      sugar:    Number(manualForm.sugar)    || 0,
    }]);
    setManualForm({ name: "", price: "", calories: "", carbs: "", protein: "", fat: "", sugar: "" });
    setShowPicker(false);
  };

  const handleRemoveExcess = (idx: number) =>
    setExcessList(prev => prev.filter((_, i) => i !== idx));

  // ── Guards ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !plan || !progress) return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-3">
      <p className="text-stone-500 text-sm">{error || "Failed to load"}</p>
      <button onClick={() => navigate(`/plans/${planId}/track`)} className="text-amber-500 text-sm hover:underline">← Plan Overview</button>
    </div>
  );

  const progressId = progress._id;

  // What to show in the "eaten" list for recommendation/saved states
  // Use the server's eaten_template_menus (may be populated objects or IDs)
  const displayMenus: { name: string; calories: number; price: number; eaten: boolean }[] =
    plan.template_menus.map((food, idx) => ({
      name:     food.name,
      calories: food.macros.calories,
      price:    food.price,
      eaten:    isTracking
        ? tickedIndices.has(idx)
        : (() => {
            // Check if this food was saved — consume matches like the restore logic
            const saved = (progress.eaten_template_menus as any[]).map(
              (f: any) => f?._id?.toString() ?? f?.toString()
            );
            return saved.includes(food._id?.toString());
          })(),
    }));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
        .dt { font-family:'DM Sans',sans-serif; }
        .serif { font-family:'DM Serif Display',serif; }
        @keyframes fu{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .fu{animation:fu 0.35s ease both}
        .d1{animation-delay:.07s} .d2{animation-delay:.14s} .d3{animation-delay:.21s}
      `}</style>

      {/* ── Food picker modal ── */}
      {showPicker && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-stone-800">Add Extra Food</h3>
              <button onClick={() => { setShowPicker(false); setManualError(""); setDbSearch(""); }}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200 transition text-xl leading-none">×</button>
            </div>
            <div className="flex border-b border-stone-100 shrink-0">
              {(["db", "manual"] as const).map(tab => (
                <button key={tab} onClick={() => setPickerTab(tab)}
                  className={`flex-1 py-3 text-sm font-semibold transition ${pickerTab === tab ? "text-amber-600 border-b-2 border-amber-400" : "text-stone-400 hover:text-stone-600"}`}>
                  {tab === "db" ? "From Database" : "Enter Manually"}
                </button>
              ))}
            </div>
            {pickerTab === "db" ? (
              <>
                <div className="px-5 py-3 border-b border-stone-100 shrink-0">
                  <input autoFocus type="text" placeholder="Search foods…"
                    value={dbSearch} onChange={e => setDbSearch(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition" />
                </div>
                <div className="overflow-y-auto flex-1">
                  {filteredDbFoods.map(food => (
                    <button key={food._id} onClick={() => handleAddFromDb(food)}
                      className="w-full flex items-center justify-between px-5 py-3.5 border-b border-stone-50 hover:bg-stone-50 transition text-left">
                      <div>
                        <p className="font-semibold text-stone-800 text-sm">{food.name}</p>
                        <p className="text-xs text-stone-400 mt-0.5">{food.canteen} · {food.macros.calories} kcal · ฿{food.price}</p>
                      </div>
                      <span className="text-amber-500 font-bold text-xl shrink-0 ml-3">+</span>
                    </button>
                  ))}
                  {filteredDbFoods.length === 0 && <p className="text-center py-8 text-stone-400 text-sm">No foods found</p>}
                </div>
              </>
            ) : (
              <div className="overflow-y-auto flex-1 px-5 py-4">
                <div className="flex flex-col gap-3">
                  {([
                    { key: "name",     label: "Food name *",      type: "text",   placeholder: "e.g. Bubble tea" },
                    { key: "calories", label: "Calories (kcal) *", type: "number", placeholder: "e.g. 250" },
                    { key: "price",    label: "Price (฿)",         type: "number", placeholder: "e.g. 35" },
                    { key: "carbs",    label: "Carbs (g)",         type: "number", placeholder: "0" },
                    { key: "protein",  label: "Protein (g)",       type: "number", placeholder: "0" },
                    { key: "fat",      label: "Fat (g)",           type: "number", placeholder: "0" },
                    { key: "sugar",    label: "Sugar (g)",         type: "number", placeholder: "0" },
                  ] as const).map(field => (
                    <div key={field.key}>
                      <label className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-1 block">{field.label}</label>
                      <input type={field.type} placeholder={field.placeholder}
                        value={manualForm[field.key]}
                        onChange={e => setManualForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition" />
                    </div>
                  ))}
                  {manualError && <p className="text-red-500 text-xs">{manualError}</p>}
                  <button onClick={handleAddManual}
                    className="w-full bg-stone-900 hover:bg-amber-400 hover:text-stone-900 text-white font-bold py-3 rounded-xl transition text-sm mt-1">
                    Add Food
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Page ── */}
      <div className="dt min-h-screen bg-stone-50">

        <header className="bg-white border-b border-stone-200 sticky top-0 z-20 shadow-sm px-5 py-4 flex items-center justify-between">
          <Link to={`/plans/${planId}/track`}
            className="flex items-center gap-2 text-stone-400 hover:text-stone-800 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium hidden sm:block">Plan Overview</span>
          </Link>
          <div className="text-center">
            <p className="font-bold text-stone-800 text-sm">{plan.name}</p>
            <p className="text-xs text-stone-400">Day {progress.day_number} · Today</p>
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${
            status === "tracking"       ? "bg-amber-100 text-amber-700"   :
            status === "recommendation" ? "bg-blue-100 text-blue-700"     :
                                          "bg-emerald-100 text-emerald-700"
          }`}>
            {status === "tracking" ? "Tracking" : status === "recommendation" ? "Review" : "Saved ✓"}
          </span>
        </header>

        <div className="max-w-lg mx-auto px-5 py-8 space-y-6">

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

          {/* RECOMMENDATION BANNER */}
          {status === "recommendation" && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 fu flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Day completed</p>
                <p className="text-sm font-semibold text-stone-800">
                  {(progress.recommendation_data?.calories_exceeded ?? 0) > 0
                    ? `${fmt(progress.recommendation_data.calories_exceeded)} kcal over target`
                    : "Within calorie target 🎉"}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">Choose an exercise or save the day as-is</p>
              </div>
              <Link to={`/plans/${planId}/recommendation/${progressId}`}
                className="shrink-0 bg-stone-900 hover:bg-amber-400 hover:text-stone-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition whitespace-nowrap">
                Exercise →
              </Link>
            </div>
          )}

          {/* SAVED BANNER */}
          {status === "saved" && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 fu">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Day saved ✓</p>
              <p className="text-sm text-stone-600">This day has been finalized. Shown below for reference.</p>
            </div>
          )}

          {/* Calorie card */}
          <div className={`rounded-3xl p-6 text-white shadow-md fu transition-colors duration-500 ${
            status === "saved"          ? "bg-emerald-700"  :
            isOver                      ? "bg-red-600"      : "bg-stone-900"
          }`}>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-1">
              {status === "saved"          ? "Final calories"  :
               isOver                      ? "Over target by"  : "Calories today"}
            </p>
            {isOver && status !== "saved"
              ? <p className="serif text-4xl text-red-200">{fmt(totalCal - calTarget)} <span className="text-xl font-sans font-normal">kcal</span></p>
              : <p className="serif text-4xl text-amber-400">{fmt(totalCal)} <span className="text-xl font-sans font-normal text-white/50">kcal</span></p>
            }
            <p className="text-xs text-white/40 mt-1">Target: {fmt(calTarget)} kcal</p>
            <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${calPct}%`, background: status === "saved" ? "#6ee7b7" : isOver ? "#fca5a5" : "#f59e0b" }} />
            </div>
            <div className="flex justify-between text-xs text-white/25 mt-1">
              <span>0</span><span>{fmt(calTarget)} kcal</span>
            </div>
          </div>

          {/* Budget row */}
          {plan.priority === "budget" && plan.budget_limit && (
            <div className={`rounded-2xl px-5 py-4 flex items-center justify-between fu d1 ${
              totalSpend > plan.budget_limit ? "bg-red-50 border border-red-200" : "bg-white border border-stone-100 shadow-sm"
            }`}>
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Budget</p>
                <p className={`text-lg font-bold ${totalSpend > plan.budget_limit ? "text-red-600" : "text-stone-800"}`}>
                  ฿{totalSpend.toFixed(0)} <span className="text-sm font-normal text-stone-400">/ ฿{plan.budget_limit}</span>
                </p>
              </div>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                totalSpend > plan.budget_limit ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"
              }`}>
                {totalSpend > plan.budget_limit ? "Over budget" : `฿${(plan.budget_limit - totalSpend).toFixed(0)} left`}
              </span>
            </div>
          )}

          {/* Template meals */}
          <div className="fu d1">
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-3">
              Template Meals · {displayMenus.filter(m => m.eaten).length}/{plan.template_menus.length} eaten
            </p>
            <div className="flex flex-col gap-2">
              {displayMenus.map((food, idx) => (
                <button key={idx} type="button"
                  onClick={() => handleToggle(idx)}
                  disabled={!isTracking}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all duration-200 text-left ${
                    food.eaten ? "bg-emerald-50 border-emerald-200" : "bg-white border-stone-100 shadow-sm"
                  } ${isTracking ? "hover:border-amber-300 cursor-pointer" : "cursor-default opacity-80"}`}>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    food.eaten ? "bg-emerald-500 border-emerald-500" : "border-stone-300"
                  }`}>
                    {food.eaten && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm truncate ${food.eaten ? "text-emerald-800 line-through decoration-emerald-400" : "text-stone-800"}`}>
                      {food.name}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">{food.calories} kcal · ฿{food.price}</p>
                  </div>
                  {food.eaten && <span className="text-emerald-500 text-xs font-bold shrink-0">eaten</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Extra foods */}
          <div className="fu d2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                Extra Foods · {(isTracking ? excessList : progress.excess_daily_foods ?? []).length} added
              </p>
              {isTracking && (
                <button onClick={() => setShowPicker(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add food
                </button>
              )}
            </div>
            {(() => {
              const list = isTracking ? excessList : (progress.excess_daily_foods ?? []);
              return list.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {list.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-stone-800 text-sm truncate">{item.name}</p>
                        <p className="text-xs text-stone-400 mt-0.5">{item.calories} kcal · ฿{item.price}</p>
                      </div>
                      {isTracking && (
                        <button onClick={() => handleRemoveExcess(idx)}
                          className="w-7 h-7 rounded-full bg-red-100 hover:bg-red-200 text-red-500 flex items-center justify-center font-bold transition shrink-0">
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5 border-2 border-dashed rounded-2xl text-stone-400 text-sm border-stone-100">
                  {isTracking ? "No extra foods yet" : "No extra foods logged"}
                </div>
              );
            })()}
          </div>

          {/* Action buttons */}
          <div className="space-y-3 fu d3 pb-8">
            {isTracking && (
              <>
                <button onClick={handleSaveProgress} disabled={saving}
                  className="w-full py-3.5 rounded-2xl border-2 border-stone-200 font-bold text-sm text-stone-600 hover:border-amber-300 hover:text-amber-600 transition flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? <div className="w-4 h-4 border-2 border-stone-400/40 border-t-stone-400 rounded-full animate-spin" /> : "Save progress"}
                </button>
                <button onClick={handleCompleteDay} disabled={saving}
                  className="w-full py-4 rounded-2xl bg-stone-900 hover:bg-amber-400 hover:text-stone-900 text-white font-bold text-sm shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "Complete Day →"}
                </button>
              </>
            )}

            {status === "recommendation" && (
              <>
                <Link to={`/plans/${planId}/recommendation/${progressId}`}
                  className="block w-full py-4 rounded-2xl bg-stone-900 hover:bg-amber-400 hover:text-stone-900 text-white font-bold text-sm text-center shadow-lg transition">
                  Choose Exercise & Save Day →
                </Link>
                <Link to={`/plans/${planId}/track`}
                  className="block w-full py-3.5 rounded-2xl border-2 border-stone-200 font-bold text-sm text-stone-600 text-center hover:border-stone-300 transition">
                  Back to Plan Overview
                </Link>
              </>
            )}

            {status === "saved" && (
              <Link to={`/plans/${planId}/track`}
                className="block w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm text-center shadow-lg transition">
                Back to Plan Overview
              </Link>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
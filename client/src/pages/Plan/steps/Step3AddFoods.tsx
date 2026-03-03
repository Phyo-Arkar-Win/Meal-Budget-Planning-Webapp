// client/src/pages/Plan/steps/Step3AddFoods.tsx
import { useState, useMemo, useEffect } from "react";
import { getFoods } from "../../../api/foodApi";
import type { Food, MacroPreview, Priority } from "../../../types/plan";

const PAGE_SIZE = 6; // cards per page — 2 cols × 3 rows on desktop

interface Props {
  selectedFoods: Food[];
  macros:        MacroPreview | null;
  priority:      Priority;
  budgetLimit:   string;
  onAdd:         (food: Food) => void;
  onRemove:      (index: number) => void;
}

export default function Step3AddFoods({
  selectedFoods, macros, priority, budgetLimit, onAdd, onRemove,
}: Props) {

  const [allFoods,      setAllFoods]      = useState<Food[]>([]);
  const [loadingFoods,  setLoadingFoods]  = useState(true);
  const [searchTerm,    setSearchTerm]    = useState("");
  const [activeFilterModal, setActiveFilterModal] = useState<"macro" | "price" | "canteen" | null>(null);
  const [macroTarget,   setMacroTarget]   = useState({ type: "protein", amount: "" });
  const [priceTarget,   setPriceTarget]   = useState({ mode: "", sort: "", amount: "" });
  const [canteenFilter, setCanteenFilter] = useState("All");
  const [page,          setPage]          = useState(1);

  useEffect(() => {
    const load = async () => {
      setLoadingFoods(true);
      try { setAllFoods(await getFoods()); }
      catch { setAllFoods([]); }
      finally { setLoadingFoods(false); }
    };
    load();
  }, []);

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [searchTerm, canteenFilter, macroTarget, priceTarget]);

  // Mirror FoodDatabase filter/sort logic exactly
  const filteredFoods = useMemo(() => {
    let result = [...allFoods];
    if (searchTerm)
      result = result.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (canteenFilter !== "All")
      result = result.filter(f => f.canteen === canteenFilter);
    if (macroTarget.amount !== "") {
      const t = Number(macroTarget.amount);
      result.sort((a, b) => Math.abs(getMacroValue(a, macroTarget.type) - t) - Math.abs(getMacroValue(b, macroTarget.type) - t));
    }
    if (priceTarget.mode === "closest" && priceTarget.amount !== "") {
      const t = Number(priceTarget.amount);
      result.sort((a, b) => Math.abs(a.price - t) - Math.abs(b.price - t));
    } else if (priceTarget.mode === "sort") {
      if (priceTarget.sort === "asc")  result.sort((a, b) => a.price - b.price);
      if (priceTarget.sort === "desc") result.sort((a, b) => b.price - a.price);
    }
    return result;
  }, [allFoods, searchTerm, canteenFilter, macroTarget, priceTarget]);

  // Pagination
  const totalPages   = Math.max(1, Math.ceil(filteredFoods.length / PAGE_SIZE));
  const pagedFoods   = filteredFoods.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const uniqueCanteens = ["All", ...Array.from(new Set(allFoods.map(f => f.canteen)))];

  // Running totals
  const totals = selectedFoods.reduce(
    (acc, f) => ({ calories: acc.calories + f.macros.calories, price: acc.price + f.price }),
    { calories: 0, price: 0 }
  );

  // Fix #7 — budget limit: would adding this food exceed the limit?
  const budgetNum = priority === "budget" && budgetLimit ? Number(budgetLimit) : Infinity;
  const wouldExceedBudget = (food: Food) =>
    priority === "budget" && budgetLimit
      ? totals.price + food.price > budgetNum
      : false;

  const foodCountMap = selectedFoods.reduce<Record<string, number>>((acc, f) => {
    acc[f._id] = (acc[f._id] || 0) + 1;
    return acc;
  }, {});

  const chipCls = (active: boolean) =>
    `shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition shadow-sm border ${
      active ? "bg-amber-50 border-amber-400 text-amber-600"
             : "bg-white border-stone-200 text-stone-600 hover:border-amber-400 hover:text-amber-500"
    }`;

  // Pagination page numbers with ellipsis
  const pageNumbers = buildPageNumbers(page, totalPages);

  return (
    <div className="slide-in">
      <h2 className="serif text-3xl text-stone-900 mb-1">Add your meals</h2>
      <p className="text-stone-400 text-sm mb-5">
        Build your daily meal template. You can add the same item multiple times.
      </p>

      {/* Fix #4 — Only calories bar + budget bar (no other macros) */}
      {macros && (
        <div className="bg-white border border-stone-100 rounded-2xl p-4 mb-5 shadow-sm">
          {/* Calorie row */}
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">
              {selectedFoods.length} item{selectedFoods.length !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-stone-500">
              <span className={`font-semibold ${totals.calories > macros.daily_cal ? "text-red-500" : "text-stone-800"}`}>
                {Math.round(totals.calories).toLocaleString()}
              </span>
              {" / "}{Math.round(macros.daily_cal).toLocaleString()} kcal
            </p>
          </div>
          <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden mb-3">
            <div className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (totals.calories / macros.daily_cal) * 100)}%`,
                background: totals.calories > macros.daily_cal ? "#ef4444" : "#f59e0b",
              }} />
          </div>

          {/* Fix #5 — Budget bar (only if budget priority) */}
          {priority === "budget" && budgetLimit && (
            <>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Budget</p>
                <p className="text-xs text-stone-500">
                  <span className={`font-semibold ${totals.price > Number(budgetLimit) ? "text-red-500" : "text-stone-800"}`}>
                    ฿{totals.price.toFixed(2)}
                  </span>
                  {" / "}฿{Number(budgetLimit).toFixed(2)}
                </p>
              </div>
              <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (totals.price / Number(budgetLimit)) * 100)}%`,
                    background: totals.price > Number(budgetLimit) ? "#ef4444" : "#34d399",
                  }} />
              </div>
            </>
          )}
        </div>
      )}

      {/* Search bar */}
      <div className="relative mb-5">
        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" placeholder="Search foods or ingredients..."
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-stone-200 rounded-2xl shadow-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition text-stone-800" />
      </div>

      {/* Filter chips */}
      <div className="flex gap-3 overflow-x-auto pb-3 -mx-5 px-5 md:mx-0 md:px-0">
        <button onClick={() => setActiveFilterModal(activeFilterModal === "macro" ? null : "macro")}
          className={chipCls(activeFilterModal === "macro" || macroTarget.amount !== "")}>Macros</button>
        <button onClick={() => setActiveFilterModal(activeFilterModal === "price" ? null : "price")}
          className={chipCls(activeFilterModal === "price" || priceTarget.amount !== "")}>Price</button>
        <button onClick={() => setActiveFilterModal(activeFilterModal === "canteen" ? null : "canteen")}
          className={chipCls(activeFilterModal === "canteen" || canteenFilter !== "All")}>Canteen</button>
      </div>

      {/* Macro filter */}
      {activeFilterModal === "macro" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-3 mb-2">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">Closest Macro Match</span>
            <button onClick={() => { setMacroTarget({ type: "protein", amount: "" }); setActiveFilterModal(null); }}
              className="text-[10px] text-amber-700 hover:underline uppercase font-bold">Clear</button>
          </div>
          <div className="flex gap-2">
            <select value={macroTarget.type} onChange={e => setMacroTarget({ ...macroTarget, type: e.target.value })}
              className="flex-1 px-3 py-2 rounded-xl border border-amber-200 focus:outline-none focus:border-amber-400 text-sm">
              <option value="protein">Protein (g)</option>
              <option value="calories">Calories (kcal)</option>
              <option value="carbs">Carbs (g)</option>
              <option value="fat">Fat (g)</option>
              <option value="sugar">Sugar (g)</option>
            </select>
            <input type="number" placeholder="Target" value={macroTarget.amount}
              onChange={e => setMacroTarget({ ...macroTarget, amount: e.target.value })}
              className="w-24 px-3 py-2 rounded-xl border border-amber-200 focus:outline-none focus:border-amber-400 text-sm" />
          </div>
        </div>
      )}

      {/* Price filter */}
      {activeFilterModal === "price" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-3 mb-2">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">Price Filter</span>
            <button onClick={() => { setPriceTarget({ mode: "", sort: "", amount: "" }); setActiveFilterModal(null); }}
              className="text-[10px] text-amber-700 hover:underline uppercase font-bold">Clear</button>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <button onClick={() => setPriceTarget({ mode: "sort", sort: "asc",  amount: "" })}
                className={`flex-1 py-2 text-sm font-semibold rounded-xl border ${priceTarget.mode === "sort" && priceTarget.sort === "asc"  ? "bg-amber-400 border-amber-500 text-stone-900" : "bg-white border-amber-200 text-stone-600"}`}>Lowest First</button>
              <button onClick={() => setPriceTarget({ mode: "sort", sort: "desc", amount: "" })}
                className={`flex-1 py-2 text-sm font-semibold rounded-xl border ${priceTarget.mode === "sort" && priceTarget.sort === "desc" ? "bg-amber-400 border-amber-500 text-stone-900" : "bg-white border-amber-200 text-stone-600"}`}>Highest First</button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-amber-800">Or Closest to: ฿</span>
              <input type="number" placeholder="40"
                value={priceTarget.mode === "closest" ? priceTarget.amount : ""}
                onChange={e => setPriceTarget({ mode: "closest", sort: "asc", amount: e.target.value })}
                className="flex-1 px-3 py-2 rounded-xl border border-amber-200 focus:outline-none focus:border-amber-400 text-sm" />
            </div>
          </div>
        </div>
      )}

      {/* Canteen filter */}
      {activeFilterModal === "canteen" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-3 mb-2">
          <span className="text-xs font-bold text-amber-700 uppercase tracking-widest block mb-3">Select Canteen</span>
          <select value={canteenFilter} onChange={e => setCanteenFilter(e.target.value)}
            className="w-full px-3 py-3 rounded-xl border border-amber-200 focus:outline-none focus:border-amber-400 text-sm font-medium">
            {uniqueCanteens.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      {/* Fix #3 — Food grid with pagination (no long scroll) */}
      {loadingFoods ? (
        <div className="flex justify-center py-16 mt-4">
          <div className="w-7 h-7 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
            {pagedFoods.length > 0 ? pagedFoods.map(food => {
              const exceeded = wouldExceedBudget(food);
              const count    = foodCountMap[food._id] || 0;
              return (
                // Fix #7 — grey out + tooltip when food would exceed budget
                <div key={food._id}
                  className={`bg-white border rounded-3xl p-3 shadow-sm flex flex-col transition-all duration-200 ${
                    exceeded
                      ? "opacity-40 border-stone-100 cursor-not-allowed"
                      : "border-stone-100 hover:shadow-md group"
                  }`}
                  title={exceeded ? `Adding this would exceed your ฿${budgetLimit} budget` : undefined}>

                  {/* Image */}
                  <div className="w-full h-32 bg-stone-100 rounded-2xl mb-3 relative overflow-hidden flex items-center justify-center">
                    {food.picture ? (
                      <img src={food.picture} alt={food.name} className="w-full h-full object-cover" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg"
                        className={`w-9 h-9 text-stone-300 transition-transform duration-500 ${!exceeded ? "group-hover:scale-110" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-lg text-xs font-bold text-stone-800 shadow-sm">
                      ฿{food.price}
                    </div>
                    {count > 0 && (
                      <div className="absolute top-2 left-2 bg-amber-400 text-stone-900 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow">
                        {count}
                      </div>
                    )}
                    {/* Fix #7 — "Over budget" badge */}
                    {exceeded && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-red-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                          Over budget
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="px-1 flex-1 flex flex-col">
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-0.5">{food.canteen}</span>
                    <h3 className="font-bold text-stone-800 mb-2 line-clamp-1 text-sm">{food.name}</h3>

                    <div className="mt-auto pt-2 border-t border-stone-100">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-stone-800">{food.macros.calories}</span>
                          <span className="text-[10px] text-stone-400 uppercase">kcal</span>
                        </div>
                        <div className="flex gap-1 text-[9px] text-stone-500 font-medium">
                          <span>P:{food.macros.protein}g</span>
                          <span>C:{food.macros.carbs}g</span>
                          <span>F:{food.macros.fat}g</span>
                        </div>
                      </div>
                      <button type="button"
                        disabled={exceeded}
                        onClick={() => !exceeded && onAdd(food)}
                        className={`w-full py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                          exceeded
                            ? "bg-stone-100 text-stone-300 cursor-not-allowed"
                            : "bg-stone-900 hover:bg-amber-400 text-white hover:text-stone-900"
                        }`}>
                        {exceeded ? "Over budget" : "+ Add to Plan"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="col-span-full py-10 text-center text-stone-400 font-medium">
                No foods match your filters. Try adjusting them!
              </div>
            )}
          </div>

          {/* Fix #3 — Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-6">
              {/* Prev */}
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-500 hover:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {pageNumbers.map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-stone-400 text-sm">…</span>
                ) : (
                  <button key={p} onClick={() => setPage(Number(p))}
                    className={`w-8 h-8 rounded-lg text-sm font-semibold transition ${
                      page === p
                        ? "bg-stone-900 text-amber-400"
                        : "text-stone-600 hover:bg-stone-100"
                    }`}>
                    {p}
                  </button>
                )
              )}

              {/* Next */}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-500 hover:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* Page info */}
          {totalPages > 1 && (
            <p className="text-center text-xs text-stone-400 mt-2">
              {filteredFoods.length} foods · page {page} of {totalPages}
            </p>
          )}
        </>
      )}

      {/* Selected foods list */}
      {selectedFoods.length > 0 && (
        <div className="mt-8">
          <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-3">
            Your daily template ({selectedFoods.length} items)
          </p>
          <div className="flex flex-col gap-2">
            {selectedFoods.map((food, idx) => (
              <div key={idx} className="flex items-center justify-between bg-stone-50 border border-stone-100 rounded-xl px-4 py-3">
                <div className="min-w-0 mr-3">
                  <p className="font-semibold text-stone-800 text-sm truncate">{food.name}</p>
                  <p className="text-xs text-stone-400 mt-0.5">฿{food.price} · {food.macros.calories} kcal</p>
                </div>
                <button type="button" onClick={() => onRemove(idx)}
                  className="w-6 h-6 rounded-full bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center text-sm font-bold shrink-0 transition">
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getMacroValue(food: Food, type: string): number {
  switch (type) {
    case "calories": return food.macros.calories;
    case "protein":  return food.macros.protein;
    case "carbs":    return food.macros.carbs;
    case "fat":      return food.macros.fat;
    case "sugar":    return food.macros.sugar;
    default:         return 0;
  }
}

// Build page number array with ellipsis: [1, 2, "…", 8, 9] etc.
function buildPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (current > 3)            pages.push("…");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++)
    pages.push(p);
  if (current < total - 2)    pages.push("…");
  pages.push(total);
  return pages;
}
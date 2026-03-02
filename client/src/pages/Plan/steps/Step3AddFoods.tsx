// client/src/pages/Plan/steps/Step3AddFoods.tsx
// Mirrors FoodDatabase.tsx — same search bar, same 3 filter chips (Macros / Price / Canteen),
// same filter modals, same food grid cards — but each card has "+ Add to Plan" instead of a Link.
import { useState, useMemo, useEffect } from "react";
import { searchFoods } from "../../../api/foodApi";
import type { Food, MacroPreview, Priority } from "../../../types/plan";

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

  // Load all foods once on mount
  useEffect(() => {
    const load = async () => {
      setLoadingFoods(true);
      try {
        const foods = await searchFoods(); // no args = fetch all
        setAllFoods(foods);
      } catch {
        setAllFoods([]);
      } finally {
        setLoadingFoods(false);
      }
    };
    load();
  }, []);

  // Mirror FoodDatabase.tsx filter/sort logic exactly
  const displayedFoods = useMemo(() => {
    let result = [...allFoods];

    if (searchTerm) {
      result = result.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (canteenFilter !== "All") {
      result = result.filter(f => f.canteen === canteenFilter);
    }

    if (macroTarget.amount !== "") {
      const target = Number(macroTarget.amount);
      result.sort((a, b) => {
        const aVal = getMacroValue(a, macroTarget.type);
        const bVal = getMacroValue(b, macroTarget.type);
        return Math.abs(aVal - target) - Math.abs(bVal - target);
      });
    }

    if (priceTarget.mode === "closest" && priceTarget.amount !== "") {
      const target = Number(priceTarget.amount);
      result.sort((a, b) => Math.abs(a.price - target) - Math.abs(b.price - target));
    } else if (priceTarget.mode === "sort") {
      if (priceTarget.sort === "asc")  result.sort((a, b) => a.price - b.price);
      if (priceTarget.sort === "desc") result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [allFoods, searchTerm, canteenFilter, macroTarget, priceTarget]);

  const uniqueCanteens = ["All", ...Array.from(new Set(allFoods.map(f => f.canteen)))];

  // Count how many of each food is selected (allows same food multiple times)
  const foodCountMap = selectedFoods.reduce<Record<string, number>>((acc, f) => {
    acc[f._id] = (acc[f._id] || 0) + 1;
    return acc;
  }, {});

  // Running totals
  const totals = selectedFoods.reduce(
    (acc, f) => ({ calories: acc.calories + f.macros.calories, price: acc.price + f.price }),
    { calories: 0, price: 0 }
  );

  const chipCls = (active: boolean) =>
    `shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition shadow-sm border ${
      active
        ? "bg-amber-50 border-amber-400 text-amber-600"
        : "bg-white border-stone-200 text-stone-600 hover:border-amber-400 hover:text-amber-500"
    }`;

  return (
    <div className="slide-in">
      <h2 className="serif text-3xl text-stone-900 mb-1">Add your meals</h2>
      <p className="text-stone-400 text-sm mb-5">
        Search the food database and build your daily meal template. You can add the same item multiple times.
      </p>

      {/* Running totals bar — shown once something is selected */}
      {selectedFoods.length > 0 && macros && (
        <div className="bg-white border border-stone-100 rounded-2xl p-4 mb-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">
              {selectedFoods.length} item{selectedFoods.length !== 1 ? "s" : ""} selected
            </p>
            <p className="text-xs text-stone-500">
              <span className="font-semibold text-stone-800">{Math.round(totals.calories).toLocaleString()}</span>
              {" / "}{Math.round(macros.daily_cal).toLocaleString()} kcal
            </p>
          </div>
          <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden mb-2">
            <div className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (totals.calories / macros.daily_cal) * 100)}%`,
                background: totals.calories > macros.daily_cal ? "#ef4444" : "#f59e0b",
              }} />
          </div>
          {priority === "budget" && budgetLimit && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-stone-400">Budget</p>
              <p className="text-xs text-stone-500">
                <span className="font-semibold text-stone-800">฿{totals.price.toFixed(2)}</span>
                {" / "}฿{Number(budgetLimit).toFixed(2)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Search bar (same as FoodDatabase) ── */}
      <div className="relative mb-5">
        <svg xmlns="http://www.w3.org/2000/svg"
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" placeholder="Search foods or ingredients..."
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-stone-200 rounded-2xl shadow-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition text-stone-800" />
      </div>

      {/* ── Filter chips (same as FoodDatabase) ── */}
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-5 px-5 md:mx-0 md:px-0">
        <button onClick={() => setActiveFilterModal(activeFilterModal === "macro" ? null : "macro")}
          className={chipCls(activeFilterModal === "macro" || macroTarget.amount !== "")}>
          Macros
        </button>
        <button onClick={() => setActiveFilterModal(activeFilterModal === "price" ? null : "price")}
          className={chipCls(activeFilterModal === "price" || priceTarget.amount !== "")}>
          Price
        </button>
        <button onClick={() => setActiveFilterModal(activeFilterModal === "canteen" ? null : "canteen")}
          className={chipCls(activeFilterModal === "canteen" || canteenFilter !== "All")}>
          Canteen
        </button>
      </div>

      {/* ── Macro filter modal (same as FoodDatabase) ── */}
      {activeFilterModal === "macro" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">Closest Macro Match</span>
            <button onClick={() => { setMacroTarget({ type: "protein", amount: "" }); setActiveFilterModal(null); }}
              className="text-[10px] text-amber-700 hover:underline uppercase font-bold">Clear</button>
          </div>
          <div className="flex gap-2">
            <select value={macroTarget.type}
              onChange={e => setMacroTarget({ ...macroTarget, type: e.target.value })}
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

      {/* ── Price filter modal (same as FoodDatabase) ── */}
      {activeFilterModal === "price" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">Price Filter</span>
            <button onClick={() => { setPriceTarget({ mode: "", sort: "", amount: "" }); setActiveFilterModal(null); }}
              className="text-[10px] text-amber-700 hover:underline uppercase font-bold">Clear</button>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <button onClick={() => setPriceTarget({ mode: "sort", sort: "asc", amount: "" })}
                className={`flex-1 py-2 text-sm font-semibold rounded-xl border ${priceTarget.mode === "sort" && priceTarget.sort === "asc" ? "bg-amber-400 border-amber-500 text-stone-900" : "bg-white border-amber-200 text-stone-600"}`}>
                Lowest First
              </button>
              <button onClick={() => setPriceTarget({ mode: "sort", sort: "desc", amount: "" })}
                className={`flex-1 py-2 text-sm font-semibold rounded-xl border ${priceTarget.mode === "sort" && priceTarget.sort === "desc" ? "bg-amber-400 border-amber-500 text-stone-900" : "bg-white border-amber-200 text-stone-600"}`}>
                Highest First
              </button>
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

      {/* ── Canteen filter modal (same as FoodDatabase) ── */}
      {activeFilterModal === "canteen" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">Select Canteen</span>
          </div>
          <select value={canteenFilter} onChange={e => setCanteenFilter(e.target.value)}
            className="w-full px-3 py-3 rounded-xl border border-amber-200 focus:outline-none focus:border-amber-400 text-sm font-medium">
            {uniqueCanteens.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      {/* ── Food grid (same cards as FoodDatabase, but with Add button) ── */}
      {loadingFoods ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedFoods.length > 0 ? displayedFoods.map(food => (
            <div key={food._id}
              className="bg-white border border-stone-100 rounded-3xl p-3 shadow-sm hover:shadow-md transition group flex flex-col">

              {/* Image — same as FoodDatabase */}
              <div className="w-full h-36 bg-stone-100 rounded-2xl mb-4 relative overflow-hidden flex items-center justify-center">
                {food.picture ? (
                  <img src={food.picture} alt={food.name} className="w-full h-full object-cover" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg"
                    className="w-10 h-10 text-stone-300 group-hover:scale-110 transition-transform duration-500"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
                {/* Price badge — same as FoodDatabase */}
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold text-stone-800 shadow-sm">
                  ฿{food.price}
                </div>
                {/* Count badge — added on top of image when selected */}
                {foodCountMap[food._id] > 0 && (
                  <div className="absolute top-2 left-2 bg-amber-400 text-stone-900 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow">
                    {foodCountMap[food._id]}
                  </div>
                )}
              </div>

              <div className="px-1 flex-1 flex flex-col">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">
                  {food.canteen}
                </span>
                <h3 className="font-bold text-stone-800 mb-3 line-clamp-1">{food.name}</h3>

                {/* Macros + Add button — replaces the Link from FoodDatabase */}
                <div className="mt-auto pt-3 border-t border-stone-100">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-stone-800">{food.macros.calories}</span>
                      <span className="text-[10px] text-stone-400 uppercase">kcal</span>
                    </div>
                    <div className="flex gap-1.5 text-[9px] text-stone-500 font-medium">
                      <span>Protein:{food.macros.protein}</span>
                      <span>Carb:{food.macros.carbs}</span>
                      <span>Fat:{food.macros.fat}</span>
                      <span>Sugar:{food.macros.sugar}</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => onAdd(food)}
                    className="w-full py-2 rounded-xl bg-stone-900 hover:bg-amber-400 text-white hover:text-stone-900 text-xs font-bold transition-all duration-200">
                    + Add to Plan
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-10 text-center text-stone-400 font-medium">
              No foods match your filters. Try adjusting them!
            </div>
          )}
        </div>
      )}

      {/* Selected foods list */}
      {selectedFoods.length > 0 && (
        <div className="mt-8">
          <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-3">
            Your daily template ({selectedFoods.length} items)
          </p>
          <div className="flex flex-col gap-2">
            {selectedFoods.map((food, idx) => (
              <div key={idx}
                className="flex items-center justify-between bg-stone-50 border border-stone-100 rounded-xl px-4 py-3">
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
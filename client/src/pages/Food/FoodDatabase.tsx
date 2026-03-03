// client/src/pages/Food/FoodDatabase.tsx
import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { getFoods } from "../../api/foodApi";
import type { Food } from "../../types/food";

const PAGE_SIZE = 6;

// Build page numbers with ellipsis — mirrors Step3AddFoods logic
function buildPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (current > 3)           pages.push("…");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++)
    pages.push(p);
  if (current < total - 2)   pages.push("…");
  pages.push(total);
  return pages;
}

const FoodDatabase = () => {
  const [foods,   setFoods]   = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const [searchTerm,        setSearchTerm]        = useState("");
  const [activeFilterModal, setActiveFilterModal] = useState<"macro" | "price" | "canteen" | null>(null);
  const [macroTarget,       setMacroTarget]       = useState({ type: "protein", amount: "" });
  const [priceTarget,       setPriceTarget]       = useState({ mode: "", sort: "", amount: "" });
  const [canteenFilter,     setCanteenFilter]     = useState("All");
  const [page,              setPage]              = useState(1);

  useEffect(() => {
    getFoods()
      .then(setFoods)
      .catch(() => setError("Failed to load foods."))
      .finally(() => setLoading(false));
  }, []);

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [searchTerm, canteenFilter, macroTarget, priceTarget]);

  const uniqueCanteens = ["All", ...Array.from(new Set(foods.map(f => f.canteen)))];

  const filteredFoods = useMemo(() => {
    let result = [...foods];

    if (searchTerm)
      result = result.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (canteenFilter !== "All")
      result = result.filter(f => f.canteen === canteenFilter);

    if (macroTarget.amount !== "") {
      const target = Number(macroTarget.amount);
      result.sort((a, b) => {
        const aVal = a.macros[macroTarget.type as keyof typeof a.macros];
        const bVal = b.macros[macroTarget.type as keyof typeof b.macros];
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
  }, [foods, searchTerm, macroTarget, priceTarget, canteenFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredFoods.length / PAGE_SIZE));
  const pagedFoods = filteredFoods.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageNumbers = buildPageNumbers(page, totalPages);

  return (
    <div className="min-h-screen bg-stone-50 flex font-sans">

      {/* ── LEFT PANEL (PC ONLY) ── */}
      <div className="hidden md:flex flex-col w-1/3 max-w-sm bg-stone-900 text-white p-10 relative border-r border-stone-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <Link to="/" className="text-stone-400 hover:text-white flex items-center gap-2 transition w-fit group">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-sm tracking-wide">Back to Dashboard</span>
        </Link>

        <div className="mt-32">
          <h1 className="font-serif text-5xl text-amber-400 mb-6 leading-tight">Food<br />Database</h1>
          <p className="text-stone-400 leading-relaxed text-sm">
            Search, filter, and discover meals from your campus canteens to perfectly hit your macro targets.
          </p>
        </div>

        <Link to="/food/add" className="mt-auto bg-amber-400 text-stone-900 py-4 rounded-xl font-bold text-lg hover:bg-amber-300 transition flex justify-center items-center gap-2 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add New Food
        </Link>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">

        {/* Mobile Header */}
        <div className="md:hidden bg-stone-900 px-6 py-6 text-white flex items-center justify-between shadow-md z-10">
          <Link to="/" className="text-stone-400 hover:text-white transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-xl font-serif tracking-wide text-amber-400">Food Database</h1>
          <div className="w-6" />
        </div>

        <div className="p-5 md:p-8 flex-1 overflow-y-auto">

          {/* Search Bar */}
          <div className="relative mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search foods or ingredients..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-stone-200 rounded-2xl shadow-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition text-stone-800"
            />
          </div>

          {/* Filter Chips Row */}
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-5 px-5 md:mx-0 md:px-0">
            {(["macro", "price", "canteen"] as const).map(modal => (
              <button
                key={modal}
                onClick={() => setActiveFilterModal(activeFilterModal === modal ? null : modal)}
                className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition shadow-sm border ${
                  activeFilterModal === modal ||
                  (modal === "macro"   && macroTarget.amount !== "") ||
                  (modal === "price"   && priceTarget.amount !== "") ||
                  (modal === "canteen" && canteenFilter !== "All")
                    ? "bg-amber-50 border-amber-400 text-amber-600"
                    : "bg-white border-stone-200 text-stone-600 hover:border-amber-400 hover:text-amber-500"
                }`}
              >
                {modal.charAt(0).toUpperCase() + modal.slice(1)}
              </button>
            ))}

            <Link
              to="/food/add"
              className="md:hidden shrink-0 ml-auto flex items-center gap-1.5 px-5 py-2.5 bg-amber-400 border border-amber-500 rounded-full text-xs font-bold uppercase tracking-widest text-stone-900 shadow-sm hover:bg-amber-300 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </Link>
          </div>

          {/* ── Active Filter Menus ── */}
          {activeFilterModal === "macro" && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">Closest Macro Match</span>
                <button onClick={() => { setMacroTarget({ type: "protein", amount: "" }); setActiveFilterModal(null); }} className="text-[10px] text-amber-700 hover:underline uppercase font-bold">Clear</button>
              </div>
              <div className="flex gap-2">
                <select value={macroTarget.type} onChange={e => setMacroTarget({ ...macroTarget, type: e.target.value })} className="flex-1 px-3 py-2 rounded-xl border border-amber-200 focus:outline-none focus:border-amber-400 text-sm">
                  <option value="protein">Protein (g)</option>
                  <option value="calories">Calories (kcal)</option>
                  <option value="carbs">Carbs (g)</option>
                  <option value="fat">Fat (g)</option>
                  <option value="sugar">Sugar (g)</option>
                </select>
                <input type="number" placeholder="Target" value={macroTarget.amount} onChange={e => setMacroTarget({ ...macroTarget, amount: e.target.value })} className="w-24 px-3 py-2 rounded-xl border border-amber-200 focus:outline-none focus:border-amber-400 text-sm" />
              </div>
            </div>
          )}

          {activeFilterModal === "price" && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">Price Filter</span>
                <button onClick={() => { setPriceTarget({ mode: "", sort: "", amount: "" }); setActiveFilterModal(null); }} className="text-[10px] text-amber-700 hover:underline uppercase font-bold">Clear</button>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <button onClick={() => setPriceTarget({ mode: "sort", sort: "asc",  amount: "" })} className={`flex-1 py-2 text-sm font-semibold rounded-xl border ${priceTarget.mode === "sort" && priceTarget.sort === "asc"  ? "bg-amber-400 border-amber-500 text-stone-900" : "bg-white border-amber-200 text-stone-600"}`}>Lowest First</button>
                  <button onClick={() => setPriceTarget({ mode: "sort", sort: "desc", amount: "" })} className={`flex-1 py-2 text-sm font-semibold rounded-xl border ${priceTarget.mode === "sort" && priceTarget.sort === "desc" ? "bg-amber-400 border-amber-500 text-stone-900" : "bg-white border-amber-200 text-stone-600"}`}>Highest First</button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-amber-800">Or Closest to: ฿</span>
                  <input type="number" placeholder="40" value={priceTarget.mode === "closest" ? priceTarget.amount : ""} onChange={e => setPriceTarget({ mode: "closest", sort: "asc", amount: e.target.value })} className="flex-1 px-3 py-2 rounded-xl border border-amber-200 focus:outline-none focus:border-amber-400 text-sm" />
                </div>
              </div>
            </div>
          )}

          {activeFilterModal === "canteen" && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">Select Canteen</span>
              </div>
              <select value={canteenFilter} onChange={e => setCanteenFilter(e.target.value)} className="w-full px-3 py-3 rounded-xl border border-amber-200 focus:outline-none focus:border-amber-400 text-sm font-medium">
                {uniqueCanteens.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {/* ── Food Grid ── */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-7 h-7 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="py-10 text-center text-red-400 font-medium">{error}</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {pagedFoods.length > 0 ? pagedFoods.map(food => (
                  <Link
                    to={`/food/${food._id}`}
                    key={food._id}
                    className="bg-white border border-stone-100 rounded-3xl p-3 shadow-sm hover:shadow-md transition group cursor-pointer flex flex-col"
                  >
                    <div className="w-full h-36 bg-stone-100 rounded-2xl mb-4 relative overflow-hidden flex items-center justify-center">
                      {food.picture ? (
                        <img src={food.picture} alt={food.name} className="w-full h-full object-cover" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-stone-300 group-hover:scale-110 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold text-stone-800 shadow-sm">
                        ฿{food.price}
                      </div>
                    </div>

                    <div className="px-1 flex-1 flex flex-col">
                      <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">{food.canteen}</span>
                      <h3 className="font-bold text-stone-800 mb-3 line-clamp-1">{food.name}</h3>
                      <div className="mt-auto flex justify-between items-center pt-3 border-t border-stone-100">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-stone-800">{food.macros.calories}</span>
                          <span className="text-[10px] text-stone-400 uppercase">kcal</span>
                        </div>
                        <div className="flex gap-1.5 text-[9px] text-stone-500 font-medium">
                          <span>P:{food.macros.protein}g</span>
                          <span>C:{food.macros.carbs}g</span>
                          <span>F:{food.macros.fat}g</span>
                          <span>S:{food.macros.sugar}g</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )) : (
                  <div className="col-span-full py-10 text-center text-stone-400 font-medium">
                    No foods match your filters. Try adjusting them!
                  </div>
                )}
              </div>

              {/* ── Pagination ── */}
              {totalPages > 1 && (
                <>
                  <div className="flex items-center justify-center gap-1.5 mt-8">
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

                  <p className="text-center text-xs text-stone-400 mt-2">
                    {filteredFoods.length} foods · page {page} of {totalPages}
                  </p>
                </>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default FoodDatabase;
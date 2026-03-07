// client/src/pages/Food/FoodDatabase.tsx
import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { getFoods } from "../../api/foodApi";
import type { Food } from "../../types/food";

const PAGE_SIZE = 6;

function buildPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++)
    pages.push(p);
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}

// Macro colour pills
const MACRO_COLORS: Record<string, string> = {
  protein: "#5B8FE8",
  carbs:   "#E8A020",
  fat:     "#E87B5B",
  sugar:   "#B87BDC",
};

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

  const totalPages  = Math.max(1, Math.ceil(filteredFoods.length / PAGE_SIZE));
  const pagedFoods  = filteredFoods.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageNumbers = buildPageNumbers(page, totalPages);

  const isFilterActive = (modal: "macro" | "price" | "canteen") =>
    (modal === "macro"   && macroTarget.amount !== "") ||
    (modal === "price"   && priceTarget.amount !== "") ||
    (modal === "canteen" && canteenFilter !== "All");

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        .food-card { transition: transform 0.22s ease, box-shadow 0.22s ease; }
        .food-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.10) !important; }
        .food-card:hover .card-img-placeholder svg { transform: scale(1.12); }
        .card-img-placeholder svg { transition: transform 0.4s ease; }
        .filter-chip { transition: all 0.18s ease; }
        .filter-chip:hover { border-color: #E8A020 !important; color: #C47A10 !important; }
        input:focus, select:focus, textarea:focus { outline: none; }
        .page-btn { transition: all 0.15s ease; }
        .page-btn:hover:not(:disabled) { background: #F5F0E8 !important; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .card-anim { animation: fadeUp 0.35s ease both; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { animation: spin 0.7s linear infinite; }
      `}</style>

      {/* ── SIDEBAR ── */}
      <aside style={s.sidebar}>
        <div style={s.sidebarGlow} />

        <Link to="/" style={s.backLink}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>

        <div style={s.sidebarBody}>
          <div style={s.sidebarTag}>Campus Eats</div>
          <h1 style={s.sidebarTitle}>Food<br />Database</h1>
          <p style={s.sidebarDesc}>
            Search, filter, and discover meals from your campus canteens to perfectly hit your macro targets.
          </p>

          {/* Quick stats */}
          <div style={s.statsRow}>
            <div style={s.statBox}>
              <span style={s.statNum}>{foods.length}</span>
              <span style={s.statLabel}>Total Meals</span>
            </div>
            <div style={s.statBox}>
              <span style={s.statNum}>{uniqueCanteens.length - 1}</span>
              <span style={s.statLabel}>Canteens</span>
            </div>
          </div>
        </div>

        <Link to="/food/add" style={s.addBtn}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add New Food
        </Link>
      </aside>

      {/* ── MAIN ── */}
      <main style={s.main}>

        {/* Mobile header */}
        <div style={s.mobileHeader}>
          <Link to="/" style={{ color: "#A89880", display: "flex" }}>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <span style={{ fontFamily: "'Lora', serif", fontSize: 18, color: "#E8A020", fontWeight: 700 }}>Food Database</span>
          <Link to="/food/add" style={s.mobileAddBtn}>+ Add</Link>
        </div>

        <div style={s.content}>

          {/* Search */}
          <div style={s.searchWrap}>
            <svg style={s.searchIcon} width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search foods or ingredients..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={s.searchInput}
              onFocus={e => { e.currentTarget.style.borderColor = "#E8A020"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(232,160,32,0.12)"; }}
              onBlur={e =>  { e.currentTarget.style.borderColor = "#E8E0D4"; e.currentTarget.style.boxShadow = "none"; }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} style={s.clearSearch}>✕</button>
            )}
          </div>

          {/* Filter row */}
          <div style={s.filterRow}>
            <span style={s.filterLabel}>Filter by:</span>
            {(["macro", "price", "canteen"] as const).map(modal => {
              const active = activeFilterModal === modal || isFilterActive(modal);
              return (
                <button
                  key={modal}
                  className="filter-chip"
                  onClick={() => setActiveFilterModal(activeFilterModal === modal ? null : modal)}
                  style={{
                    ...s.filterChip,
                    background:   active ? "#FDF3DC" : "#FFFFFF",
                    borderColor:  active ? "#E8A020" : "#DDD5C7",
                    color:        active ? "#B07010" : "#6B5E52",
                    fontWeight:   active ? 700 : 500,
                  }}
                >
                  {isFilterActive(modal) && <span style={s.activeDot} />}
                  {modal.charAt(0).toUpperCase() + modal.slice(1)}
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginLeft: 4, opacity: 0.6 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={activeFilterModal === modal ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                  </svg>
                </button>
              );
            })}

            {/* Active filter count badge */}
            {(macroTarget.amount !== "" || priceTarget.amount !== "" || canteenFilter !== "All") && (
              <button
                onClick={() => { setMacroTarget({ type: "protein", amount: "" }); setPriceTarget({ mode: "", sort: "", amount: "" }); setCanteenFilter("All"); }}
                style={s.clearAllBtn}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Filter panels */}
          {activeFilterModal === "macro" && (
            <div style={s.filterPanel}>
              <div style={s.filterPanelHeader}>
                <span style={s.filterPanelTitle}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: 6 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Closest Macro Match
                </span>
                <button onClick={() => { setMacroTarget({ type: "protein", amount: "" }); setActiveFilterModal(null); }} style={s.clearBtn}>Clear</button>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <select value={macroTarget.type} onChange={e => setMacroTarget({ ...macroTarget, type: e.target.value })} style={s.filterSelect}>
                  <option value="protein">Protein (g)</option>
                  <option value="calories">Calories (kcal)</option>
                  <option value="carbs">Carbs (g)</option>
                  <option value="fat">Fat (g)</option>
                  <option value="sugar">Sugar (g)</option>
                </select>
                <input type="number" placeholder="Target amount" value={macroTarget.amount} onChange={e => setMacroTarget({ ...macroTarget, amount: e.target.value })} style={{ ...s.filterInput, width: 130 }} />
              </div>
            </div>
          )}

          {activeFilterModal === "price" && (
            <div style={s.filterPanel}>
              <div style={s.filterPanelHeader}>
                <span style={s.filterPanelTitle}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: 6 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Price Filter
                </span>
                <button onClick={() => { setPriceTarget({ mode: "", sort: "", amount: "" }); setActiveFilterModal(null); }} style={s.clearBtn}>Clear</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setPriceTarget({ mode: "sort", sort: "asc", amount: "" })}
                    style={{ ...s.sortBtn, ...(priceTarget.mode === "sort" && priceTarget.sort === "asc" ? s.sortBtnActive : {}) }}>
                    ↑ Lowest First
                  </button>
                  <button onClick={() => setPriceTarget({ mode: "sort", sort: "desc", amount: "" })}
                    style={{ ...s.sortBtn, ...(priceTarget.mode === "sort" && priceTarget.sort === "desc" ? s.sortBtnActive : {}) }}>
                    ↓ Highest First
                  </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 13, color: "#8A7060", fontWeight: 500, whiteSpace: "nowrap" }}>Closest to ฿</span>
                  <input type="number" placeholder="40" value={priceTarget.mode === "closest" ? priceTarget.amount : ""} onChange={e => setPriceTarget({ mode: "closest", sort: "asc", amount: e.target.value })} style={s.filterInput} />
                </div>
              </div>
            </div>
          )}

          {activeFilterModal === "canteen" && (
            <div style={s.filterPanel}>
              <div style={s.filterPanelHeader}>
                <span style={s.filterPanelTitle}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: 6 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Select Canteen
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {uniqueCanteens.map(c => (
                  <button key={c} onClick={() => setCanteenFilter(c)} style={{
                    ...s.canteenChip,
                    background:  canteenFilter === c ? "#1A1612" : "#FFFFFF",
                    color:       canteenFilter === c ? "#E8A020" : "#6B5E52",
                    borderColor: canteenFilter === c ? "#1A1612" : "#DDD5C7",
                    fontWeight:  canteenFilter === c ? 700 : 400,
                  }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results summary */}
          {!loading && !error && (
            <div style={s.resultsSummary}>
              <span style={{ color: "#8A7060", fontSize: 13 }}>
                {filteredFoods.length === foods.length
                  ? `${foods.length} meals available`
                  : `${filteredFoods.length} of ${foods.length} meals`}
              </span>
              {canteenFilter !== "All" && (
                <span style={s.activeFilterBadge}>{canteenFilter}</span>
              )}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
              <div className="spinner" style={{ width: 32, height: 32, border: "3px solid #E8A020", borderTopColor: "transparent", borderRadius: "50%" }} />
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#E05252", fontSize: 14 }}>{error}</div>
          ) : (
            <>
              <div style={s.grid}>
                {pagedFoods.length > 0 ? pagedFoods.map((food, i) => (
                  <Link
                    to={`/food/${food._id}`}
                    key={food._id}
                    className="food-card card-anim"
                    style={{ ...s.card, animationDelay: `${i * 0.05}s`, textDecoration: "none" }}
                  >
                    {/* Image area */}
                    <div style={s.cardImg}>
                      {food.picture ? (
                        <img src={food.picture} alt={food.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div className="card-img-placeholder" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
                          <svg width="36" height="36" fill="none" stroke="#C8BFB2" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div style={s.pricePill}>฿{food.price}</div>
                    </div>

                    {/* Body */}
                    <div style={s.cardBody}>
                      <span style={s.canteenLabel}>{food.canteen}</span>
                      <h3 style={s.cardTitle}>{food.name}</h3>

                      {/* Calorie bar */}
                      <div style={s.calRow}>
                        <span style={s.calNum}>{food.macros.calories}</span>
                        <span style={s.calUnit}>kcal</span>
                        <div style={s.calBarTrack}>
                          <div style={{ ...s.calBarFill, width: `${Math.min(100, (food.macros.calories / 800) * 100)}%` }} />
                        </div>
                      </div>

                      {/* Macro pills */}
                      <div style={s.macroPills}>
                        {(["protein", "carbs", "fat", "sugar"] as const).map(m => (
                          <span key={m} style={{ ...s.macroPill, background: MACRO_COLORS[m] + "18", color: MACRO_COLORS[m], borderColor: MACRO_COLORS[m] + "40" }}>
                            {m.charAt(0).toUpperCase()}: {food.macros[m]}g
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                )) : (
                  <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px 0", color: "#A89880", fontSize: 14 }}>
                    No foods match your filters. Try adjusting them!
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={s.paginationWrap}>
                  <div style={s.pagination}>
                    <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      style={{ ...s.pageBtn, opacity: page === 1 ? 0.3 : 1, cursor: page === 1 ? "not-allowed" : "pointer" }}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {pageNumbers.map((p, i) =>
                      p === "…" ? (
                        <span key={`e-${i}`} style={{ width: 36, textAlign: "center", color: "#B0A090", fontSize: 14 }}>…</span>
                      ) : (
                        <button key={p} className="page-btn" onClick={() => setPage(Number(p))}
                          style={{
                            ...s.pageBtn,
                            background:  page === p ? "#1A1612" : "transparent",
                            color:       page === p ? "#E8A020" : "#6B5E52",
                            fontWeight:  page === p ? 700 : 400,
                            borderColor: page === p ? "#1A1612" : "transparent",
                          }}>
                          {p}
                        </button>
                      )
                    )}

                    <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      style={{ ...s.pageBtn, opacity: page === totalPages ? 0.3 : 1, cursor: page === totalPages ? "not-allowed" : "pointer" }}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  <p style={{ textAlign: "center", fontSize: 12, color: "#B0A090", marginTop: 8 }}>
                    {filteredFoods.length} foods · page {page} of {totalPages}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

// ── STYLES ────────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    background: "#F5F0E8",
  },

  // Sidebar
  sidebar: {
    width: 280,
    background: "#1A1612",
    display: "flex",
    flexDirection: "column",
    position: "sticky",
    top: 0,
    height: "100vh",
    padding: "28px 24px",
    flexShrink: 0,
    overflow: "hidden",
  },
  sidebarGlow: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    background: "rgba(232,160,32,0.08)",
    borderRadius: "50%",
    filter: "blur(40px)",
    pointerEvents: "none",
  },
  backLink: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#8A7B6E",
    fontSize: 13,
    fontWeight: 500,
    textDecoration: "none",
    letterSpacing: "0.03em",
    transition: "color 0.2s",
    zIndex: 1,
  },
  sidebarBody: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    zIndex: 1,
  },
  sidebarTag: {
    display: "inline-block",
    background: "rgba(232,160,32,0.15)",
    color: "#E8A020",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    padding: "5px 10px",
    borderRadius: 6,
    marginBottom: 18,
    width: "fit-content",
  },
  sidebarTitle: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: 42,
    color: "#E8A020",
    lineHeight: 1.1,
    marginBottom: 16,
    fontWeight: 700,
  },
  sidebarDesc: {
    fontSize: 13,
    color: "#7A6A5E",
    lineHeight: 1.65,
    marginBottom: 32,
  },
  statsRow: {
    display: "flex",
    gap: 12,
  },
  statBox: {
    flex: 1,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: "14px 12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  statNum: {
    fontFamily: "'Lora', serif",
    fontSize: 26,
    color: "#E8A020",
    fontWeight: 700,
    lineHeight: 1,
  },
  statLabel: {
    fontSize: 10,
    color: "#6A5A50",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  addBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    background: "#E8A020",
    color: "#1A1612",
    borderRadius: 14,
    padding: "15px 20px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    fontWeight: 700,
    textDecoration: "none",
    zIndex: 1,
    boxShadow: "0 4px 20px rgba(232,160,32,0.3)",
    letterSpacing: "0.02em",
  },

  // Mobile
  mobileHeader: {
    display: "none",
    background: "#1A1612",
    padding: "16px 20px",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mobileAddBtn: {
    background: "#E8A020",
    color: "#1A1612",
    fontSize: 12,
    fontWeight: 700,
    padding: "6px 14px",
    borderRadius: 8,
    textDecoration: "none",
  },

  // Main
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "32px 36px",
  },

  // Search
  searchWrap: {
    position: "relative",
    marginBottom: 20,
  },
  searchIcon: {
    position: "absolute",
    left: 16,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#B0A090",
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    padding: "14px 44px",
    background: "#FFFFFF",
    border: "1.5px solid #E8E0D4",
    borderRadius: 14,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "#3D3228",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  clearSearch: {
    position: "absolute",
    right: 14,
    top: "50%",
    transform: "translateY(-50%)",
    background: "#EDE5D8",
    border: "none",
    borderRadius: "50%",
    width: 22,
    height: 22,
    fontSize: 10,
    color: "#8A7B6E",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  // Filters
  filterRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "#A89880",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    marginRight: 4,
  },
  filterChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "8px 16px",
    borderRadius: 100,
    border: "1.5px solid",
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    cursor: "pointer",
    background: "none",
    fontFamily: "'DM Sans', sans-serif",
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#E8A020",
    display: "inline-block",
    marginRight: 2,
  },
  clearAllBtn: {
    marginLeft: "auto",
    background: "none",
    border: "none",
    fontSize: 12,
    color: "#C07010",
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "underline",
    fontFamily: "'DM Sans', sans-serif",
  },
  filterPanel: {
    background: "#FFFBF2",
    border: "1px solid #EDD9A0",
    borderRadius: 16,
    padding: "18px 20px",
    marginBottom: 20,
  },
  filterPanelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  filterPanelTitle: {
    display: "flex",
    alignItems: "center",
    fontSize: 12,
    fontWeight: 700,
    color: "#A07020",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  clearBtn: {
    background: "none",
    border: "none",
    fontSize: 11,
    color: "#C07010",
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    fontFamily: "'DM Sans', sans-serif",
  },
  filterSelect: {
    flex: 1,
    padding: "10px 14px",
    border: "1.5px solid #EDD9A0",
    borderRadius: 10,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "#3D3228",
    background: "#FFFFFF",
    outline: "none",
  },
  filterInput: {
    flex: 1,
    padding: "10px 14px",
    border: "1.5px solid #EDD9A0",
    borderRadius: 10,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "#3D3228",
    background: "#FFFFFF",
    outline: "none",
  },
  sortBtn: {
    flex: 1,
    padding: "10px",
    border: "1.5px solid #EDD9A0",
    borderRadius: 10,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    color: "#6B5E52",
    background: "#FFFFFF",
    cursor: "pointer",
  },
  sortBtnActive: {
    background: "#E8A020",
    borderColor: "#E8A020",
    color: "#1A1612",
    fontWeight: 700,
  },
  canteenChip: {
    padding: "8px 16px",
    border: "1.5px solid",
    borderRadius: 100,
    fontSize: 12,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },

  // Results summary
  resultsSummary: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  activeFilterBadge: {
    background: "#1A1612",
    color: "#E8A020",
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: 100,
    letterSpacing: "0.05em",
  },

  // Grid
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 20,
  },

  // Card
  card: {
    background: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    border: "1px solid #EDE5D8",
    color: "inherit",
  },
  cardImg: {
    width: "100%",
    height: 160,
    background: "#F0EBE2",
    position: "relative",
    overflow: "hidden",
    flexShrink: 0,
  },
  pricePill: {
    position: "absolute",
    top: 12,
    right: 12,
    background: "rgba(26,22,18,0.85)",
    backdropFilter: "blur(6px)",
    color: "#E8A020",
    fontSize: 13,
    fontWeight: 700,
    padding: "4px 10px",
    borderRadius: 8,
    fontFamily: "'Lora', serif",
    letterSpacing: "0.02em",
  },
  cardBody: {
    padding: "16px 18px 18px",
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  canteenLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#E8A020",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: 5,
  },
  cardTitle: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: 16,
    fontWeight: 600,
    color: "#2A201A",
    marginBottom: 14,
    lineHeight: 1.3,
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
  },
  calRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  calNum: {
    fontFamily: "'Lora', serif",
    fontSize: 18,
    fontWeight: 700,
    color: "#2A201A",
    lineHeight: 1,
  },
  calUnit: {
    fontSize: 10,
    fontWeight: 700,
    color: "#B0A090",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginRight: 4,
  },
  calBarTrack: {
    flex: 1,
    height: 4,
    background: "#EDE5D8",
    borderRadius: 100,
    overflow: "hidden",
  },
  calBarFill: {
    height: "100%",
    background: "linear-gradient(90deg, #E8A020, #F5C355)",
    borderRadius: 100,
    transition: "width 0.4s ease",
  },
  macroPills: {
    display: "flex",
    flexWrap: "wrap",
    gap: 5,
    marginTop: "auto",
  },
  macroPill: {
    fontSize: 10,
    fontWeight: 600,
    padding: "3px 8px",
    borderRadius: 6,
    border: "1px solid",
    letterSpacing: "0.03em",
  },

  // Pagination
  paginationWrap: {
    marginTop: 32,
    paddingBottom: 16,
  },
  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: "1.5px solid transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    background: "transparent",
    color: "#6B5E52",
  },
};

export default FoodDatabase;

// client/src/pages/Food/AddFood.tsx
import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { addfood } from "../../api/foodApi";

const CANTEENS = [
  "Arts Faculty Food Court",
  "Engineering Canteen",
  "Science Canteen",
  "Central Cafeteria",
  "North Campus Food Court",
];

const MACRO_COLORS: Record<string, string> = {
  protein: "#5B8FE8",
  carbs:   "#E8A020",
  fat:     "#E87B5B",
  sugar:   "#B87BDC",
};

const AddFood = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging,   setIsDragging]   = useState(false);

  const [form, setForm] = useState({ name: "", canteen: "", price: "" });
  const [macros, setMacros] = useState({ calories: "", protein: "", carbs: "", fat: "", sugar: "" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.canteen || !form.price) {
      setError("Please fill in all required fields."); return;
    }
    setLoading(true);
    try {
      await addfood(
        {
          name:    form.name,
          price:   Number(form.price),
          canteen: form.canteen,
          macros: {
            calories: Number(macros.calories),
            carbs:    Number(macros.carbs),
            protein:  Number(macros.protein),
            fat:      Number(macros.fat),
            sugar:    Number(macros.sugar),
          },
        },
        selectedFile,
      );
      navigate("/food");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save food item.");
    } finally {
      setLoading(false);
    }
  };

  const calculatedCal = Math.round(
    (Number(macros.protein) || 0) * 4 +
    (Number(macros.carbs)   || 0) * 4 +
    (Number(macros.fat)     || 0) * 9,
  );

  const displayCal = macros.calories !== ""
    ? Number(macros.calories).toLocaleString()
    : calculatedCal > 0 ? `~${calculatedCal}` : "0";

  // live macro bar percentages
  const macroTotal = (Number(macros.protein)||0) + (Number(macros.carbs)||0) + (Number(macros.fat)||0) + (Number(macros.sugar)||0);
  const pct = (v: string) => macroTotal > 0 ? ((Number(v)||0) / macroTotal) * 100 : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .af-root { font-family: 'DM Sans', sans-serif; }

        .af-inp, .af-sel {
          width: 100%; padding: 13px 16px;
          background: #FAF7F2; border: 1.5px solid #E8E0D4;
          border-radius: 12px; font-size: 14px;
          font-family: 'DM Sans', sans-serif; color: #1A1612;
          transition: border-color .2s, box-shadow .2s, background .2s; outline: none;
        }
        .af-inp:focus, .af-sel:focus {
          border-color: #E8A020; box-shadow: 0 0 0 3px rgba(232,160,32,.12);
          background: #fff;
        }
        .af-inp::placeholder { color: #B0A090; }
        .af-sel { appearance: none; cursor: pointer; }
        .af-sel option[value=""] { color: #B0A090; }

        .af-num::-webkit-inner-spin-button,
        .af-num::-webkit-outer-spin-button { -webkit-appearance: none; }
        .af-num { -moz-appearance: textfield; }

        .af-label {
          display: block; font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: .1em;
          color: #A89880; margin-bottom: 8px;
        }

        .drop-zone {
          border: 2px dashed #DDD5C7; border-radius: 16px;
          background: #FAF7F2; transition: all .2s; cursor: pointer;
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 10px; min-height: 200px;
          position: relative; overflow: hidden;
        }
        .drop-zone:hover, .drop-zone.dragging {
          border-color: #E8A020; background: #FFFBF2;
        }

        .sel-wrap { position: relative; }
        .sel-arrow { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); pointer-events: none; color: #B0A090; }

        .nav-link-sidebar { transition: color .18s, background .18s; }
        .nav-link-sidebar:hover { color: #fff !important; background: rgba(255,255,255,.07) !important; }

        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .fu { animation: fadeUp .4s ease both; }
        .d1 { animation-delay:.05s } .d2 { animation-delay:.10s }
        .d3 { animation-delay:.15s } .d4 { animation-delay:.20s }
        .d5 { animation-delay:.25s }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { animation: spin .7s linear infinite; }
      `}</style>

      <div className="af-root" style={{ display: "flex", minHeight: "100vh", background: "#F5F0E8" }}>

        {/* ── SIDEBAR ── */}
        <aside style={sb.root}>
          <div style={sb.glow} />

          {/* Back link */}
          <Link to="/food" className="fu" style={sb.backLink}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Food Database
          </Link>

          {/* Icon + title */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", zIndex: 1 }} className="fu d1">
            <div style={{ width: 52, height: 52, borderRadius: 16, background: "#E8A020", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22, boxShadow: "0 4px 20px rgba(232,160,32,.35)" }}>
              <svg width="24" height="24" fill="none" stroke="#1A1612" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#E8A020", background: "rgba(232,160,32,0.12)", padding: "5px 10px", borderRadius: 6, display: "inline-block", width: "fit-content", marginBottom: 16 }}>Campus Eats</div>
            <h1 style={{ fontFamily: "'Lora', serif", fontSize: 38, color: "#E8A020", lineHeight: 1.1, fontWeight: 700, marginBottom: 16 }}>Add New<br />Food</h1>
            <p style={{ fontSize: 13, color: "#7A6A5E", lineHeight: 1.65, marginBottom: 28 }}>
              Contribute a new meal to the campus food database. Your addition helps everyone plan smarter.
            </p>

            <ul style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { icon: "📸", text: "Upload a photo to help others identify the dish" },
                { icon: "🥗", text: "Add accurate macro data for better planning" },
                { icon: "📍", text: "Tag the canteen so it's easy to find" },
              ].map(tip => (
                <li key={tip.icon} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "#6A5A50", lineHeight: 1.55 }}>
                  <span style={{ fontSize: 15, marginTop: 1 }}>{tip.icon}</span>
                  {tip.text}
                </li>
              ))}
            </ul>
          </div>

          {/* Calorie guide */}
          <div style={{ paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.06)", position: "relative", zIndex: 1 }} className="fu d2">
            <p style={{ fontSize: 10, color: "#4A3D32", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, marginBottom: 12 }}>Calorie Guide</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "1g Protein", val: "4 kcal", color: MACRO_COLORS.protein },
                { label: "1g Carbs",   val: "4 kcal", color: MACRO_COLORS.carbs   },
                { label: "1g Fat",     val: "9 kcal", color: MACRO_COLORS.fat     },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.color, flexShrink: 0 }} />
                    <span style={{ color: "#5A4D42" }}>{r.label}</span>
                  </div>
                  <span style={{ color: "#D0C4B4", fontWeight: 600 }}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── MAIN FORM ── */}
        <main style={{ flex: 1, overflowY: "auto" }}>

          {/* Mobile header */}
          <div style={{ background: "#1A1612", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link to="/food" style={{ color: "#5A4D42", display: "flex" }}>
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <span style={{ fontFamily: "'Lora', serif", fontSize: 18, color: "#E8A020", fontWeight: 700 }}>Add New Food</span>
            <div style={{ width: 22 }} />
          </div>

          <div style={{ maxWidth: 640, margin: "0 auto", padding: "36px 28px 56px" }}>

            {error && (
              <div style={{ marginBottom: 20, fontSize: 14, color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "14px 16px", fontWeight: 500 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* ── IMAGE UPLOAD ── */}
              <div className="fu d1">
                <label className="af-label">Food Photo <span style={{ textTransform: "none", color: "#B0A090", fontWeight: 400, letterSpacing: 0 }}>(optional)</span></label>
                <div
                  className={["drop-zone", isDragging ? "dragging" : ""].join(" ").trim()}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  style={{ minHeight: imagePreview ? "auto" : 200 }}
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" style={{ width: "100%", borderRadius: 14, objectFit: "cover", maxHeight: 280 }} />
                      <div
                        style={{ position: "absolute", inset: 0, background: "rgba(26,22,18,0.55)", opacity: 0, transition: "opacity .2s", borderRadius: 14, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}
                        onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                        onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
                      >
                        <svg width="28" height="28" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>Change photo</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ width: 52, height: 52, borderRadius: 14, background: "#EDE5D8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="26" height="26" fill="none" stroke="#B0A090" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#6B5E52" }}>Click or drag to upload a photo</p>
                      <p style={{ fontSize: 12, color: "#B0A090" }}>JPG, PNG or WebP — up to 5 MB</p>
                    </>
                  )}
                  <input type="file" accept="image/*" ref={fileInputRef} style={{ display: "none" }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }} />
                </div>
              </div>

              {/* ── FOOD DETAILS ── */}
              <div className="fu d2" style={card.base}>
                <div style={card.header}>
                  <h2 style={card.title}>Food Details</h2>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div>
                    <label className="af-label">Food Name <span style={{ color: "#E87B5B" }}>*</span></label>
                    <input className="af-inp" type="text" placeholder="e.g. Spicy Basil Pork with Rice"
                      value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>

                  <div>
                    <label className="af-label">Canteen Location <span style={{ color: "#E87B5B" }}>*</span></label>
                    <div className="sel-wrap">
                      <select className="af-sel af-inp" value={form.canteen}
                        onChange={e => setForm({ ...form, canteen: e.target.value })} required>
                        <option value="">Select a canteen…</option>
                        {CANTEENS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <svg className="sel-arrow" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {/* Canteen pill preview */}
                    {form.canteen && (
                      <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, background: "#FDF3DC", border: "1px solid #E8C87A", borderRadius: 100, padding: "4px 12px" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#E8A020", display: "inline-block" }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#B07010", letterSpacing: "0.06em", textTransform: "uppercase" }}>{form.canteen}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="af-label">Price (฿) <span style={{ color: "#E87B5B" }}>*</span></label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontFamily: "'Lora', serif", fontSize: 16, color: "#E8A020", fontWeight: 700, pointerEvents: "none" }}>฿</span>
                      <input className="af-inp af-num" type="number" placeholder="0.00" min={0} step={0.5}
                        value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                        required style={{ paddingLeft: 36 }} />
                    </div>
                    {form.price && (
                      <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(26,22,18,0.06)", borderRadius: 8, padding: "4px 10px" }}>
                        <span style={{ fontFamily: "'Lora', serif", fontSize: 14, color: "#1A1612", fontWeight: 700 }}>฿{form.price}</span>
                        <span style={{ fontSize: 11, color: "#A89880" }}>per serving</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── NUTRITIONAL DATA ── */}
              <div className="fu d3" style={{ ...card.base, borderLeft: "3px solid #E8A020" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                  <h2 style={card.title}>Nutritional Data</h2>
                  <span style={{ fontSize: 11, color: "#A89880", fontWeight: 500 }}>per serving</span>
                </div>

                {/* Calorie hero */}
                <div style={{ background: "#FAF7F2", borderRadius: 16, padding: "22px 20px", textAlign: "center", marginBottom: 20, border: "1px solid #EDE5D8" }}>
                  <p style={{ fontSize: 10, color: "#E8A020", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, marginBottom: 8 }}>Total Calories</p>
                  <p style={{ fontFamily: "'Lora', serif", fontSize: 56, color: "#E8A020", lineHeight: 1, fontWeight: 700 }}>{displayCal}</p>
                  <p style={{ fontSize: 12, color: "#A89880", fontWeight: 500, marginTop: 6 }}>kcal</p>
                  {calculatedCal > 0 && macros.calories === "" && (
                    <p style={{ fontSize: 11, color: "#B0A090", marginTop: 4 }}>Estimated from macros</p>
                  )}
                </div>

                {/* Live macro bar */}
                {macroTotal > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ height: 8, borderRadius: 100, overflow: "hidden", display: "flex", background: "#EDE5D8" }}>
                      {(["protein","carbs","fat","sugar"] as const).map(k => (
                        <div key={k} style={{ height: "100%", width: `${pct(macros[k])}%`, background: MACRO_COLORS[k], transition: "width .3s ease" }} />
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
                      {(["protein","carbs","fat","sugar"] as const).map(k => (
                        <div key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#8A7B6E" }}>
                          <div style={{ width: 7, height: 7, borderRadius: "50%", background: MACRO_COLORS[k], flexShrink: 0 }} />
                          {k.charAt(0).toUpperCase()+k.slice(1)}{macros[k] ? ` ${macros[k]}g` : ""}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Calorie override */}
                <div style={{ marginBottom: 18 }}>
                  <label className="af-label">Calories (kcal) — override</label>
                  <input className="af-inp af-num" type="number" placeholder="Leave blank to auto-calculate from macros"
                    min={0} value={macros.calories} onChange={e => setMacros({ ...macros, calories: e.target.value })} />
                </div>

                {/* Macro grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {(["protein","carbs","fat","sugar"] as const).map(k => (
                    <div key={k}>
                      <label className="af-label" style={{ color: MACRO_COLORS[k] }}>
                        {k.charAt(0).toUpperCase()+k.slice(1)} (g)
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          className="af-inp af-num"
                          type="number" placeholder="0" min={0} step={0.1}
                          value={macros[k]}
                          onChange={e => setMacros({ ...macros, [k]: e.target.value })}
                          style={{ borderLeftColor: MACRO_COLORS[k], borderLeftWidth: 3 }}
                        />
                        {macros[k] && (
                          <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", display: "inline-flex", alignItems: "center", gap: 3, background: MACRO_COLORS[k]+"18", border: `1px solid ${MACRO_COLORS[k]}40`, borderRadius: 6, padding: "2px 7px" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: MACRO_COLORS[k] }}>{macros[k]}g</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── SUBMIT ── */}
              <div className="fu d4">
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%", background: "#1A1612", color: "#E8A020",
                    border: "none", borderRadius: 14, padding: "15px 20px",
                    fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700,
                    letterSpacing: "0.06em", cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                    transition: "background .2s, transform .15s",
                  }}
                  onMouseEnter={e => { if (!loading) (e.currentTarget.style.background = "#E8A020"); if (!loading) (e.currentTarget.style.color = "#1A1612"); }}
                  onMouseLeave={e => { (e.currentTarget.style.background = "#1A1612"); (e.currentTarget.style.color = "#E8A020"); }}
                >
                  {loading ? (
                    <div className="spinner" style={{ width: 18, height: 18, border: "2.5px solid rgba(232,160,32,.3)", borderTopColor: "#E8A020", borderRadius: "50%" }} />
                  ) : (
                    <>
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Save Menu Item
                    </>
                  )}
                </button>
                <p style={{ textAlign: "center", fontSize: 12, color: "#B0A090", marginTop: 10, fontWeight: 500 }}>
                  * Required fields must be filled before saving
                </p>
              </div>

            </form>
          </div>
        </main>
      </div>
    </>
  );
};

// ── Sidebar styles ────────────────────────────────────────
const sb: Record<string, React.CSSProperties> = {
  root: {
    width: 268, flexShrink: 0, background: "#1A1612",
    display: "flex", flexDirection: "column",
    position: "sticky", top: 0, height: "100vh",
    padding: "28px 22px", overflow: "hidden",
  },
  glow: {
    position: "absolute", top: -60, right: -60,
    width: 200, height: 200,
    background: "rgba(232,160,32,0.07)",
    borderRadius: "50%", filter: "blur(40px)", pointerEvents: "none",
  },
  backLink: {
    display: "flex", alignItems: "center", gap: 8,
    color: "#7A6A5E", fontSize: 13, fontWeight: 500,
    letterSpacing: "0.03em", textDecoration: "none",
    marginBottom: 32, position: "relative", zIndex: 1,
    transition: "color .18s",
  },
};

// ── Card styles ───────────────────────────────────────────
const card: Record<string, React.CSSProperties> = {
  base: {
    background: "#FFFFFF", border: "1px solid #EDE5D8",
    borderRadius: 20, padding: "24px 22px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
  },
  header: { marginBottom: 22 },
  title:  { fontFamily: "'Lora', Georgia, serif", fontSize: 22, color: "#1A1612", fontWeight: 700 },
};

export default AddFood;

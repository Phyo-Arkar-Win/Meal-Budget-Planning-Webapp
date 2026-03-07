// client/src/pages/Food/FoodDetail.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

/* ── Temporary mock — replace with your real hook / props ── */
const mockFood = {
  name: "Pad Thai",
  canteen: "Arts Faculty Food Court",
  averageRating: 4.2,
  reviewCount: 12,
  category: "Food",
  price: 150,
  image: "",
  calories: 520,
  protein: 60,
  carbs: 70,
  fat: 3,
  sugar: 2,
};

const FoodDetail = () => {
  const navigate = useNavigate();
  const food = mockFood; // swap with useFood(id) etc.

  const [userRating, setUserRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const macroTotal = food.protein + food.carbs + food.fat + food.sugar;
  const pct = (v: number) => macroTotal ? `${((v / macroTotal) * 100).toFixed(1)}%` : "0%";

  const renderStars = (rating: number) =>
    [1, 2, 3, 4, 5].map((n) => (
      <svg key={n} width={14} height={14} viewBox="0 0 24 24"
        fill={n <= Math.round(rating) ? "#f59e0b" : "none"}
        stroke={n <= Math.round(rating) ? "#f59e0b" : "#d6d3d1"}
        strokeWidth={1.8} style={{ flexShrink: 0 }}
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .fd-root {
          display: flex;
          min-height: 100vh;
          background: #fdf8f0;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── SIDEBAR ── */
        .fd-sidebar {
          width: 280px;
          min-width: 280px;
          background: #1c1917;
          color: #fff;
          display: flex;
          flex-direction: column;
          padding: 24px 20px;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
        }
        .fd-back {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #a8a29e;
          cursor: pointer;
          background: none;
          border: none;
          font-family: 'DM Sans', sans-serif;
          padding: 0;
          margin-bottom: 24px;
          transition: color 0.2s;
        }
        .fd-back:hover { color: #fff; }
        .fd-img {
          width: 100%;
          aspect-ratio: 1;
          background: #292524;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          overflow: hidden;
        }
        .fd-img img { width: 100%; height: 100%; object-fit: cover; border-radius: 16px; }
        .fd-food-name {
          font-family: 'DM Serif Display', serif;
          font-size: 28px;
          color: #f59e0b;
          margin-bottom: 4px;
          line-height: 1.2;
        }
        .fd-tagline { font-size: 12px; color: #78716c; margin-bottom: 20px; }
        .fd-meta-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        .fd-meta-table tr td {
          padding: 6px 0;
          font-size: 12px;
          border-bottom: 1px solid #292524;
        }
        .fd-meta-table tr:last-child td { border-bottom: none; }
        .fd-meta-label {
          color: #78716c;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 10px;
          font-weight: 600;
          width: 50%;
        }
        .fd-meta-value { color: #e7e5e4; text-align: right; font-weight: 500; }
        .fd-price-badge {
          background: #f59e0b;
          border-radius: 14px;
          padding: 14px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
        }
        .fd-price-label { font-size: 11px; font-weight: 700; color: #1c1917; text-transform: uppercase; letter-spacing: 0.08em; }
        .fd-price-amount { font-family: 'DM Serif Display', serif; font-size: 26px; color: #1c1917; }

        /* ── MAIN ── */
        .fd-main {
          flex: 1;
          padding: 32px 40px;
          overflow-y: auto;
        }
        .fd-venue-tag {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #fef3c7;
          border: 1px solid #fde68a;
          border-radius: 999px;
          padding: 5px 14px 5px 10px;
          font-size: 11px;
          font-weight: 700;
          color: #92400e;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          margin-bottom: 10px;
        }
        .fd-venue-dot { width: 7px; height: 7px; background: #f59e0b; border-radius: 50%; display: inline-block; }
        .fd-rating-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 28px;
          font-size: 13px;
          color: #78716c;
        }
        .fd-section-title {
          font-size: 10px;
          font-weight: 700;
          color: #a8a29e;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 14px;
        }
        .fd-nutrition-card {
          background: #fff;
          border-radius: 20px;
          padding: 28px 32px;
          margin-bottom: 16px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .fd-calories-num {
          font-family: 'DM Serif Display', serif;
          font-size: 56px;
          color: #f59e0b;
          text-align: center;
          line-height: 1;
        }
        .fd-calories-label {
          text-align: center;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #a8a29e;
          text-transform: uppercase;
          margin-bottom: 24px;
        }
        .fd-divider { height: 1px; background: #f5f5f4; margin: 0 -32px 24px; }
        .fd-macros-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        .fd-macro-cell {
          background: #fafaf9;
          border-radius: 14px;
          padding: 14px 12px;
          text-align: center;
        }
        .fd-macro-val { font-size: 22px; font-weight: 600; color: #1c1917; line-height: 1.1; }
        .fd-macro-val span { font-size: 13px; font-weight: 400; color: #a8a29e; }
        .fd-macro-name {
          font-size: 10px;
          font-weight: 700;
          color: #a8a29e;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-top: 4px;
        }
        .fd-breakdown-card {
          background: #fff;
          border-radius: 20px;
          padding: 22px 28px;
          margin-bottom: 28px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .fd-breakdown-title {
          font-size: 10px;
          font-weight: 700;
          color: #a8a29e;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 14px;
        }
        .fd-bar-track {
          height: 10px;
          border-radius: 999px;
          overflow: hidden;
          display: flex;
          margin-bottom: 14px;
        }
        .fd-bar-segment { height: 100%; transition: width 0.4s; }
        .fd-bar-legend { display: flex; gap: 16px; flex-wrap: wrap; font-size: 12px; color: #78716c; }
        .fd-legend-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 5px; vertical-align: middle; }
        .fd-reviews-card {
          background: #fff;
          border: 1.5px solid #fde68a;
          border-radius: 20px;
          padding: 24px 28px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .fd-reviews-heading { font-family: 'DM Serif Display', serif; font-size: 22px; color: #1c1917; margin-bottom: 16px; }
        .fd-star-btn { background: none; border: none; padding: 0; cursor: pointer; line-height: 0; }
        .fd-textarea {
          width: 100%;
          min-height: 110px;
          background: #fafaf9;
          border: 1.5px solid #e7e5e4;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          color: #1c1917;
          resize: vertical;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          margin-bottom: 14px;
          display: block;
        }
        .fd-textarea:focus { border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.12); background: #fff; }
        .fd-textarea::placeholder { color: #a8a29e; }
        .fd-submit-btn {
          background: #1c1917;
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 11px 24px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          float: right;
        }
        .fd-submit-btn:hover { background: #f59e0b; color: #1c1917; }

        @media (max-width: 768px) {
          .fd-root { flex-direction: column; }
          .fd-sidebar { width: 100%; min-width: unset; height: auto; position: relative; }
          .fd-main { padding: 24px 20px; }
          .fd-macros-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div className="fd-root">

        {/* ── SIDEBAR ── */}
        <aside className="fd-sidebar">
          <button className="fd-back" onClick={() => navigate(-1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Database
          </button>

          <div className="fd-img">
            {food.image
              ? <img src={food.image} alt={food.name} />
              : <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#44403c" strokeWidth={1.5}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
            }
          </div>

          <div className="fd-food-name">{food.name}</div>
          <div className="fd-tagline">Tap a macro to learn more about your meal.</div>

          <table className="fd-meta-table">
            <tbody>
              <tr>
                <td className="fd-meta-label">Venue</td>
                <td className="fd-meta-value">{food.canteen}</td>
              </tr>
              <tr>
                <td className="fd-meta-label">Rating</td>
                <td className="fd-meta-value">
                  {food.averageRating > 0
                    ? `${food.averageRating.toFixed(1)} · ${food.reviewCount} review${food.reviewCount !== 1 ? "s" : ""}`
                    : `— · ${food.reviewCount} reviews`}
                </td>
              </tr>
              <tr>
                <td className="fd-meta-label">Category</td>
                <td className="fd-meta-value">{food.category ?? "Food"}</td>
              </tr>
            </tbody>
          </table>

          <div className="fd-price-badge">
            <span className="fd-price-label">Price</span>
            <span className="fd-price-amount">฿{food.price}</span>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="fd-main">

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div className="fd-venue-tag">
              <span className="fd-venue-dot" />
              {food.canteen.toUpperCase()}
            </div>
            <div className="fd-rating-row">
              <div style={{ display: "flex", gap: 3 }}>{renderStars(food.averageRating)}</div>
              <span>
                {food.averageRating > 0 ? food.averageRating.toFixed(1) : "—"}
                {" · "}
                {food.reviewCount} review{food.reviewCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Nutritional Profile */}
          <div className="fd-section-title">Nutritional Profile</div>
          <div className="fd-nutrition-card">
            <div className="fd-calories-num">{food.calories}</div>
            <div className="fd-calories-label">Calories Per Serving</div>
            <div className="fd-divider" />
            <div className="fd-macros-grid">
              {[
                { label: "Protein", value: food.protein, color: "#3b82f6" },
                { label: "Carbs",   value: food.carbs,   color: "#f59e0b" },
                { label: "Fat",     value: food.fat,     color: "#ef4444" },
                { label: "Sugar",   value: food.sugar,   color: "#a78bfa" },
              ].map(({ label, value, color }) => (
                <div className="fd-macro-cell" key={label}>
                  <div className="fd-macro-val" style={{ color }}>{value}<span>g</span></div>
                  <div className="fd-macro-name">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Macro Breakdown */}
          <div className="fd-breakdown-card">
            <div className="fd-breakdown-title">Macro Breakdown</div>
            <div className="fd-bar-track">
              <div className="fd-bar-segment" style={{ width: pct(food.protein), background: "#3b82f6" }} />
              <div className="fd-bar-segment" style={{ width: pct(food.carbs),   background: "#f59e0b" }} />
              <div className="fd-bar-segment" style={{ width: pct(food.fat),     background: "#ef4444" }} />
              <div className="fd-bar-segment" style={{ width: pct(food.sugar),   background: "#a78bfa" }} />
            </div>
            <div className="fd-bar-legend">
              {[
                { label: "Protein", value: food.protein, color: "#3b82f6" },
                { label: "Carbs",   value: food.carbs,   color: "#f59e0b" },
                { label: "Fat",     value: food.fat,     color: "#ef4444" },
                { label: "Sugar",   value: food.sugar,   color: "#a78bfa" },
              ].map(({ label, value, color }) => (
                <span key={label}>
                  <span className="fd-legend-dot" style={{ background: color }} />
                  {label} {value}g
                </span>
              ))}
            </div>
          </div>

          {/* Community Reviews */}
          <div className="fd-section-title">Community Reviews</div>
          <div className="fd-reviews-card">
            <div className="fd-reviews-heading">Rate this meal</div>

            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  className="fd-star-btn"
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setUserRating(n)}
                >
                  <svg width={28} height={28} viewBox="0 0 24 24"
                    fill={n <= (hoverRating || userRating) ? "#f59e0b" : "none"}
                    stroke={n <= (hoverRating || userRating) ? "#f59e0b" : "#d6d3d1"}
                    strokeWidth={1.8}
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
              ))}
            </div>

            <textarea
              className="fd-textarea"
              placeholder="What did you think of the macros? Was it worth the price?"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
            <button className="fd-submit-btn">Submit Review</button>
            <div style={{ clear: "both" }} />
          </div>

        </main>
      </div>
    </>
  );
};

export default FoodDetail;

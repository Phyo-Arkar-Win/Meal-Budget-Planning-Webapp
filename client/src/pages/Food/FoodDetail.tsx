// client/src/pages/Food/FoodDetail.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFoodById } from "../../api/foodApi";
import { addReview, getFoodReviews } from "../../api/reviewApi";
import type { Food } from "../../types/food";
import type { Review } from "../../types/food";

const FoodDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [food, setFood] = useState<Food | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [newReview, setNewReview] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const fetchReviews = async () => {
    if (!id) return;
    try {
      const data = await getFoodReviews(id);
      setReviews(data);
    } catch {
      // silently fail — reviews just won't show
    }
  };

  useEffect(() => {
    if (!id) return;
    Promise.all([getFoodById(id), getFoodReviews(id)])
      .then(([foodData, reviewData]) => {
        setFood(foodData);
        setReviews(reviewData);
      })
      .catch((err) => {
        if (err?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmitReview = async () => {
    if (!newReview.trim()) return;
    setReviewError("");
    setSubmitting(true);
    try {
      await addReview({ foodId: id!, rating: newRating, comment: newReview });
      setNewReview("");
      setNewRating(5);
      await fetchReviews();
      // Refresh food to get updated averageRating
      if (id) setFood(await getFoodById(id));
    } catch (err: any) {
      setReviewError(err.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${i < rating ? "text-amber-400" : "text-stone-300"}`} viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (notFound || !food) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
      <h2 className="text-2xl font-serif text-stone-800 mb-4">Food Not Found</h2>
      <button onClick={() => navigate("/food")} className="text-amber-500 hover:underline">Return to Database</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 flex font-sans">

      {/* ── LEFT PANEL (PC ONLY) ── */}
      <div className="hidden md:flex flex-col w-1/3 max-w-sm bg-stone-900 text-white p-10 relative border-r border-stone-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <button onClick={() => navigate(-1)} className="text-stone-400 hover:text-white flex items-center gap-2 transition w-fit group">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-sm tracking-wide">Back to Database</span>
        </button>

        <div className="mt-20 flex-1">
          <div className="w-full aspect-4/3 bg-stone-800 rounded-3xl mb-8 flex items-center justify-center border border-stone-700 overflow-hidden shrink-0">
            {food.picture ? (
              <img src={food.picture} alt={food.name} className="w-full h-full object-cover" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          <h1 className="font-serif text-4xl text-amber-400 mb-4 leading-tight">{food.name}</h1>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto relative bg-white md:bg-stone-50">

        {/* Mobile Header */}
        <div className="md:hidden relative w-full h-72 bg-stone-200 overflow-hidden shrink-0 rounded-b-[2.5rem] shadow-sm">
          <div className="absolute top-6 left-6 z-10">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-stone-900 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          {food.picture ? (
            <img src={food.picture} alt={food.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        <div className="p-6 md:p-12 max-w-3xl mx-auto w-full">

          {/* Title & Basic Info */}
          <div className="mb-8">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest rounded-full mb-3">{food.canteen}</span>
                <h1 className="text-3xl font-serif text-stone-900 md:hidden mb-2">{food.name}</h1>
                <div className="flex items-center gap-2">
                  <div className="flex">{renderStars(Math.round(food.averageRating))}</div>
                  <span className="text-sm font-bold text-stone-700">
                    {food.averageRating > 0 ? food.averageRating.toFixed(1) : "—"}{" "}
                    <span className="text-stone-400 font-normal">({reviews.length} reviews)</span>
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-3xl font-bold text-stone-900">฿{food.price}</span>
              </div>
            </div>
          </div>

          {/* Macros Section */}
          <div className="bg-stone-50 md:bg-white border border-stone-200 rounded-3xl p-6 mb-10 shadow-sm">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-6 border-b border-stone-200 pb-3">Nutritional Profile</h3>
            <div className="flex items-center justify-center mb-8">
              <div className="text-center">
                <span className="block text-5xl font-serif text-amber-500 mb-1">{food.macros.calories}</span>
                <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Calories</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {(["protein", "carbs", "fat", "sugar"] as const).map(m => (
                <div key={m} className="bg-white md:bg-stone-50 rounded-2xl p-4 text-center shadow-sm border border-stone-100">
                  <span className="block text-xl font-bold text-stone-800 mb-1">{food.macros[m]}g</span>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{m}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews Section */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-serif text-stone-900">Community Reviews</h3>
            </div>

            {/* Write a Review */}
            <div className="bg-white border border-amber-200 rounded-2xl p-5 mb-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
              <h4 className="text-sm font-bold text-stone-800 mb-3">Rate this meal</h4>
              <div className="flex gap-1 mb-4 cursor-pointer">
                {[1, 2, 3, 4, 5].map(star => (
                  <svg key={star} onClick={() => setNewRating(star)} xmlns="http://www.w3.org/2000/svg" className={`w-7 h-7 hover:scale-110 transition ${star <= newRating ? "text-amber-400" : "text-stone-200"}`} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              {reviewError && <p className="text-red-500 text-xs mb-2">{reviewError}</p>}
              <textarea
                placeholder="What did you think of the macros? Was it worth the price?"
                value={newReview}
                onChange={e => setNewReview(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm focus:outline-none focus:border-amber-400 focus:bg-white transition mb-3"
                rows={3}
              />
              <button
                onClick={handleSubmitReview}
                disabled={submitting || !newReview.trim()}
                className="bg-stone-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-amber-400 hover:text-stone-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting…" : "Submit Review"}
              </button>
            </div>

            {/* Review List */}
            <div className="space-y-4">
              {reviews.length > 0 ? reviews.map(review => (
                <div key={review._id} className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-stone-200 rounded-full flex items-center justify-center text-stone-500 font-bold text-xs">
                        {review.userId?.username?.charAt(0).toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <span className="block text-sm font-bold text-stone-800">{review.userId?.username ?? "Anonymous"}</span>
                        <div className="flex">{renderStars(review.rating)}</div>
                      </div>
                    </div>
                  </div>
                  <p className="text-stone-600 text-sm mt-3">{review.comment}</p>
                </div>
              )) : (
                <p className="text-stone-400 text-sm italic py-4 text-center">No reviews yet. Be the first!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodDetail;
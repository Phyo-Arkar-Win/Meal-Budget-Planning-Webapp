// client/src/api/reviewApi.ts
import type { Review, CreateReviewPayload } from "../types/food";

const API_URL = import.meta.env.VITE_API_URL;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

const jsonAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

export const getFoodReviews = async (foodId: string): Promise<Review[]> => {
  const res  = await fetch(`${API_URL}/api/reviews?foodId=${foodId}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch reviews");
  return data;
};

export const addReview = async (payload: CreateReviewPayload): Promise<{ message: string }> => {
  const res  = await fetch(`${API_URL}/api/reviews`, {
    method:  "POST",
    headers: jsonAuthHeaders(),
    body:    JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to submit review");
  return data;
};
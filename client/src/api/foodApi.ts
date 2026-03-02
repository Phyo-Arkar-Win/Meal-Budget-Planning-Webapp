// client/src/api/foodApi.ts
import type { Food } from "../types/plan";

const API_URL = import.meta.env.VITE_API_URL;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

const jsonAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

// ── Search / fetch all foods ──────────────────────────────────────────────────
// search and canteen are optional — calling with no args fetches all foods
export const searchFoods = async (
  search?: string,
  canteen?: string
): Promise<Food[]> => {
  const params = new URLSearchParams();
  if (search)  params.append("search",  search);
  if (canteen) params.append("canteen", canteen);

  const res = await fetch(`${API_URL}/api/foods?${params.toString()}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch foods");
  return data;
};

// ── Create a new food (used by AddFood.tsx) ───────────────────────────────────
export interface CreateFoodPayload {
  name:     string;
  price:    number;
  canteen:  string;
  picture?: string;  // Cloudinary URL — optional until image upload is wired up
  macros: {
    calories: number;
    carbs:    number;
    protein:  number;
    fat:      number;
    sugar:    number;
  };
}

export const createFood = async (payload: CreateFoodPayload): Promise<Food> => {
  const res = await fetch(`${API_URL}/api/foods`, {
    method: "POST",
    headers: jsonAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create food");
  return data;
};
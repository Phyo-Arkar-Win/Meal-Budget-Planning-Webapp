// client/src/api/foodApi.ts
import type { Food } from "../types/plan";

const API_URL = import.meta.env.VITE_API_URL;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

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
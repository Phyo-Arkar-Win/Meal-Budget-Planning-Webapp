import type { Food } from "../types/plan";
import type { AddFoodPayload } from "../types/food";

const API_URL = import.meta.env.VITE_API_URL;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});


export const getFoods = async (search?: string, canteen?: string): Promise<Food[]> => {
  const params = new URLSearchParams();
  if (search)  params.append("search",  search);
  if (canteen) params.append("canteen", canteen);

  const res  = await fetch(`${API_URL}/api/foods?${params.toString()}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch foods");
  return data;
};

export const getFoodById = async (id: string): Promise<Food> => {
  const res  = await fetch(`${API_URL}/api/foods/${id}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.message || "Food not found"), { status: res.status });
  return data;
};

// Sends multipart/form-data so multer can forward the image to Cloudinary.
// macros is JSON-stringified since FormData values must be strings.
export const addfood = async (payload: AddFoodPayload, imageFile?: File | null): Promise<Food> => {
  const form = new FormData();
  form.append("name",    payload.name);
  form.append("price",   String(payload.price));
  form.append("canteen", payload.canteen);
  form.append("macros",  JSON.stringify(payload.macros)); // parsed back in controller
  if (imageFile) form.append("picture", imageFile);

  // No Content-Type header — browser sets it automatically with the correct boundary for FormData
  const res  = await fetch(`${API_URL}/api/foods`, {
    method:  "POST",
    headers: authHeaders(),
    body:    form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create food");
  return data;
};
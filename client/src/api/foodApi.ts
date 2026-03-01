// client/src/api/foodApi.ts
const API_URL = import.meta.env.VITE_API_URL;

export const fetchAllFoods = async (token: string, filters?: any) => {
  // In the future, you will pass your filters to the backend query string here
  const res = await fetch(`${API_URL}/api/food`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch foods");
  const data = await res.json();
  return data.data; // Assumes your backend returns { data: [...] }
};
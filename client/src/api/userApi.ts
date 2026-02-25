// client/src/api/userApi.ts

const API_URL = import.meta.env.VITE_API_URL;

export const fetchUserProfile = async (token: string) => {
  const res = await fetch(`${API_URL}/api/user/profile`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // Sending token to your 'protect' middleware
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch profile");
  }

  return data.data; // Returning the user object from your controller
};
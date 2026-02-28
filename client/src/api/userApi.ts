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

export const updateUserProfile = async (token: string, profileData: any) => {
  const res = await fetch(`${API_URL}/api/user/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(profileData),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to update profile");
  }
  return data.data;
};

export const calculateMacros = async (token: string, calcData: any) => {
  const res = await fetch(`${API_URL}/api/user/calculate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(calcData),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to recalculate macros");
  }
  return data.data;
};
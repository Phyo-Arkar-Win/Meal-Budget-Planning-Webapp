// client/src/api/userApi.ts
const API_URL = import.meta.env.VITE_API_URL;

export const fetchUserProfile = async (token: string) => {
  const res = await fetch(`${API_URL}/api/user/profile`, {
    method: "GET",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch profile");
  return data.data;
};

export const updateUserProfile = async (token: string, profileData: FormData) => {
  const res = await fetch(`${API_URL}/api/user/profile`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: profileData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update profile");
  return data.data;
};

export const calculateMacros = async (token: string, calcData: any) => {
  const res = await fetch(`${API_URL}/api/user/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(calcData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to recalculate macros");
  return data.data;
};

// Change password from EditProfile — requires knowing current password
export const changePassword = async (
  token: string,
  currentPassword: string,
  newPassword: string
) => {
  const res = await fetch(`${API_URL}/api/auth/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to change password");
  return data;
};
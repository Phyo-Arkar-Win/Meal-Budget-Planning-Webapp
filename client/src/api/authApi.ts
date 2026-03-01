// client/src/api/authApi.ts
import type { LoginCredentials, SignupCredentials, CompleteProfileData } from "../types/auth";

const API_URL = import.meta.env.VITE_API_URL;

export const loginUser = async (credentials: LoginCredentials) => {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  let data = null;
  if (res.headers.get("content-type")?.includes("application/json")) data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Login failed");
  return data;
};

export const signupUser = async (userData: SignupCredentials) => {
  const res = await fetch(`${API_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...userData,
      age: Number(userData.age),
      weight: Number(userData.weight),
      height: Number(userData.height),
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Signup failed");
  return data;
};

export const googleLoginUser = async (idToken: string) => {
  const res = await fetch(`${API_URL}/api/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: idToken }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Google login failed");
  return data; // { token, isNewUser }
};

// Called from /complete-profile — sends gender/age/weight/height AND the new password
// Your backend's PUT /api/user/profile should accept a "password" field and hash it
export const completeUserProfile = async (
  token: string,
  profileData: CompleteProfileData & { password?: string }
) => {
  const res = await fetch(`${API_URL}/api/user/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      gender:   profileData.gender,
      age:      Number(profileData.age),
      weight:   Number(profileData.weight),
      height:   Number(profileData.height),
      password: profileData.password, // sent only for Google new users
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to complete profile");
  return data;
};
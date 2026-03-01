// client/src/api/authApi.ts
import type { LoginCredentials, SignupCredentials, CompleteProfileData } from "../types/auth";

const API_URL = import.meta.env.VITE_API_URL;

// ── Manual Login ─────────────────────────────────────────────────────────────
export const loginUser = async (credentials: LoginCredentials) => {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  let data = null;
  if (res.headers.get("content-type")?.includes("application/json")) {
    data = await res.json();
  }

  if (!res.ok) throw new Error(data?.message || "Login failed");
  return data;
};

// ── Manual Signup ─────────────────────────────────────────────────────────────
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
  return data; // { message, token }
};

// ── Google Login / Signup ─────────────────────────────────────────────────────
// Sends the Google ID token to your backend for verification.
// Returns { token, isNewUser } — if isNewUser is true, redirect to /complete-profile
export const googleLoginUser = async (idToken: string) => {
  const res = await fetch(`${API_URL}/api/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: idToken }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Google login failed");
  return data; // { token: string, isNewUser: boolean }
};

// ── Complete Profile (after Google signup) ────────────────────────────────────
// Called from /complete-profile page to fill in gender/age/weight/height
export const completeUserProfile = async (token: string, profileData: CompleteProfileData) => {
  const res = await fetch(`${API_URL}/api/user/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      gender: profileData.gender,
      age: Number(profileData.age),
      weight: Number(profileData.weight),
      height: Number(profileData.height),
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to complete profile");
  return data;
};
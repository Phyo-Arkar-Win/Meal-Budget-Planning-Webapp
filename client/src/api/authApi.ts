// client/src/api/authApi.ts
import type { LoginCredentials, SignupCredentials } from "../types/auth";

const API_URL = import.meta.env.VITE_API_URL;

export const loginUser = async (credentials: LoginCredentials) => {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  let data = null;
  if (res.headers.get("content-type")?.includes("application/json")) {
    data = await res.json();
  }

  if (!res.ok) {
    throw new Error(data?.message || "Login failed");
  }

  return data;
};

export const signupUser = async (userData: SignupCredentials) => {
  const response = await fetch(`${API_URL}/api/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...userData,
      age: Number(userData.age),
      weight: Number(userData.weight),
      height: Number(userData.height),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Signup failed");
  }

  return data;
};
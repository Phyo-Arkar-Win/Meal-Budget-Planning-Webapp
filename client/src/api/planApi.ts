// client/src/api/planApi.ts
import type { CreatePlanPayload, MacroPreview, Plan } from "../types/plan";

const API_URL = import.meta.env.VITE_API_URL;

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

// ── Preview macros live before plan is created ────────────────────────────────
export const previewPlanMacros = async (
  fitness_goal: string,
  activity_level: string
): Promise<MacroPreview> => {
  const res = await fetch(`${API_URL}/api/plans/preview-macros`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ fitness_goal, activity_level }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to preview macros");
  return data;
};

// ── Create a new plan ─────────────────────────────────────────────────────────
export const createPlan = async (payload: CreatePlanPayload): Promise<Plan> => {
  const res = await fetch(`${API_URL}/api/plans`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create plan");
  return data;
};

// ── Get all plans for the logged-in user ──────────────────────────────────────
export const fetchPlans = async (): Promise<Plan[]> => {
  const res = await fetch(`${API_URL}/api/plans`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch plans");
  return data;
};

// ── Get a single plan by ID ───────────────────────────────────────────────────
export const fetchPlanById = async (planId: string): Promise<Plan> => {
  const res = await fetch(`${API_URL}/api/plans/${planId}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch plan");
  return data;
};
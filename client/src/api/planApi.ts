// client/src/api/planApi.ts
import type { Plan, CreatePlanPayload, MacroPreview } from "../types/plan";

const API_URL = import.meta.env.VITE_API_URL;

const h = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

export const previewPlanMacros = async (
  fitness_goal: string,
  activity_level: string
): Promise<MacroPreview> => {
  const res  = await fetch(`${API_URL}/api/plans/preview-macros`, {
    method: "POST", headers: h(),
    body: JSON.stringify({ fitness_goal, activity_level }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to preview macros");
  return data;
};

export const createPlan = async (payload: CreatePlanPayload): Promise<Plan> => {
  const res  = await fetch(`${API_URL}/api/plans`, {
    method: "POST", headers: h(), body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create plan");
  return data;
};

export const fetchPlans = async (): Promise<Plan[]> => {
  const res  = await fetch(`${API_URL}/api/plans`, { headers: h() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch plans");
  return data;
};

export const fetchPlanById = async (planId: string): Promise<Plan> => {
  const res  = await fetch(`${API_URL}/api/plans/${planId}`, { headers: h() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch plan");
  return data;
};

export const deletePlan = async (planId: string): Promise<void> => {
  const res  = await fetch(`${API_URL}/api/plans/${planId}`, {
    method: "DELETE", headers: h(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete plan");
};
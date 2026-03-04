// client/src/api/progressApi.ts
import type { DailyProgress, Exercise, ExcessFood } from "../types/progress";

const API_URL = import.meta.env.VITE_API_URL;

const h = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

// ── GET /api/progress/:planId/today ───────────────────────────────────────────
// Gets today's record, or creates a new one if it's a new day
export const getTodayProgress = async (planId: string): Promise<DailyProgress> => {
  const res  = await fetch(`${API_URL}/api/progress/${planId}/today`, { headers: h() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch today's progress");
  return data;
};

// ── GET /api/progress/:planId/stats ──────────────────────────────────────────
// All saved days for charts / plan stats page
export const getPlanStats = async (planId: string) => {
  const res  = await fetch(`${API_URL}/api/progress/${planId}/stats`, { headers: h() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch plan stats");
  return data; // { total_days_tracked, data: chartData[] }
};

// ── PUT /api/progress/:progressId/track ───────────────────────────────────────
// Update eaten_template_menus and/or excess_daily_foods while status = 'tracking'
export const updateTracking = async (
  progressId: string,
  payload: {
    eaten_template_menus?: string[];
    excess_daily_foods?:   ExcessFood[];
  }
): Promise<DailyProgress> => {
  const res = await fetch(`${API_URL}/api/progress/${progressId}/track`, {
    method: "PUT", headers: h(), body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update tracking");
  return data;
};

// ── PUT /api/progress/:progressId/complete ────────────────────────────────────
// Calculates totals, sets status → 'recommendation'
export const completeTracking = async (progressId: string): Promise<{
  message: string;
  summary: { totalCalories: number; totalPrice: number; calTarget: number; budgetLimit: number | null };
  data:    DailyProgress;
}> => {
  const res = await fetch(`${API_URL}/api/progress/${progressId}/complete`, {
    method: "PUT", headers: h(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to complete tracking");
  return data;
};

// ── PUT /api/progress/:progressId/save ────────────────────────────────────────
// Finalises the day, sets status → 'saved'
export const saveProgress = async (
  progressId: string,
  payload: {
    exercise_selected?:     string;   // Exercise _id
    exercise_time_minutes?: number;
    actually_exercised?:    boolean;
  }
): Promise<DailyProgress> => {
  const res = await fetch(`${API_URL}/api/progress/${progressId}/save`, {
    method: "PUT", headers: h(), body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to save progress");
  return data.data; // controller returns { message, data }
};

// ── GET /api/exercises ────────────────────────────────────────────────────────
export const getExercises = async (): Promise<Exercise[]> => {
  const res  = await fetch(`${API_URL}/api/exercises`, { headers: h() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch exercises");
  return data;
};
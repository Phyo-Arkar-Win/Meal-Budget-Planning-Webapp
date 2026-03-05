// client/src/api/dailyprogressApi.ts
import type { DailyProgress, Exercise, ExcessFood } from "../types/progress";

const API_URL = import.meta.env.VITE_API_URL;

const h = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

// GET /api/progress/:planId/today  (creates record if none exists)
export const getTodayProgress = async (planId: string): Promise<DailyProgress> => {
  const res  = await fetch(`${API_URL}/api/progress/${planId}/today`, { headers: h() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch today's progress");
  return data;
};

// GET /api/progress/:planId/today-status  (read-only, never creates a record)
// Returns { exists: false } | { exists: true, status, eaten_count, day_number }
export const getTodayStatus = async (planId: string): Promise<{
  exists:      false;
} | {
  exists:      true;
  status:      'tracking' | 'recommendation' | 'saved';
  eaten_count: number;
  day_number:  number;
}> => {
  const res  = await fetch(`${API_URL}/api/progress/${planId}/today-status`, { headers: h() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch today status");
  return data;
};

// GET /api/progress/:planId/stats
export const getPlanStats = async (planId: string) => {
  const res  = await fetch(`${API_URL}/api/progress/${planId}/stats`, { headers: h() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch plan stats");
  return data;
};

// PUT /api/progress/:progressId/track
export const updateTracking = async (
  progressId: string,
  payload: { eaten_template_menus?: string[]; excess_daily_foods?: ExcessFood[] }
): Promise<DailyProgress> => {
  const res = await fetch(`${API_URL}/api/progress/${progressId}/track`, {
    method: "PUT", headers: h(), body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update tracking");
  return data;
};

// PUT /api/progress/:progressId/complete
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

// PUT /api/progress/:progressId/save
export const saveProgress = async (
  progressId: string,
  payload: { exercise_selected?: string; exercise_time_minutes?: number; actually_exercised?: boolean }
): Promise<DailyProgress> => {
  const res = await fetch(`${API_URL}/api/progress/${progressId}/save`, {
    method: "PUT", headers: h(), body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to save progress");
  return data.data;
};

// GET /api/exercises
export const getExercises = async (): Promise<Exercise[]> => {
  const res  = await fetch(`${API_URL}/api/exercises`, { headers: h() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch exercises");
  return data;
};
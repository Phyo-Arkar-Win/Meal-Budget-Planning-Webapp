// client/src/types/plan.ts
import type { Food } from "./food";
export type { Food };

export interface MacroTargets {
  daily_cal:    number;
  carbohydrate: number;
  protein:      number;
  fat:          number;
  sugar:        number;
}

export type Priority   = "budget" | "nutrient";
export type PlanStatus = "active" | "completed" | "abandoned";

export interface Plan {
  _id:            string;
  owner:          string;
  name:           string;
  fitness_goal:   string;
  activity_level: string;
  priority:       Priority;
  budget_limit:   number | null;
  duration:       number;
  template_menus: Food[];
  macro_targets:  MacroTargets;
  status:         PlanStatus;
  createdAt:      string;
  updatedAt:      string;
}

export interface MacroPreview extends MacroTargets {
  bmr?:  number;
  tdee?: number;
}

export interface CreatePlanPayload {
  name:           string;
  fitness_goal:   string;
  activity_level: string;
  priority:       Priority;
  budget_limit:   number | null;
  duration:       number;
  template_menus: string[];
}
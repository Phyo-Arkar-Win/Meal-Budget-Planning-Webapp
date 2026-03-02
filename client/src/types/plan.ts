// client/src/types/plan.ts

export interface MacroTargets {
  daily_cal: number;
  carbohydrate: number;
  protein: number;
  fat: number;
  sugar: number;
}

export interface Food {
  _id: string;
  name: string;
  price: number;
  canteen: string;
  picture?: string;
  macros: {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
    sugar: number;
  };
}

export type Priority   = "budget" | "nutrient";
export type PlanStatus = "active" | "completed" | "abandoned";

export interface Plan {
  _id: string;
  owner: string;
  fitness_goal: string;
  activity_level: string;
  priority: Priority;
  budget_limit: number | null;
  duration: number;
  template_menus: Food[];
  macro_targets: MacroTargets;
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MacroPreview extends MacroTargets {
  bmr?: number;
  tdee?: number;
}

export interface CreatePlanPayload {
  fitness_goal: string;
  activity_level: string;
  priority: Priority;
  budget_limit: number | null;
  duration: number;
  template_menus: string[]; // food _id array
}
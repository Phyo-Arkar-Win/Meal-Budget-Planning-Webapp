// client/src/types/progress.ts

export interface ExcessFood {
  name:     string;
  price:    number;
  calories: number;
  carbs:    number;
  protein:  number;
  fat:      number;
  sugar:    number;
}

export interface RecommendationData {
  calories_exceeded:     number;
  budget_exceeded:       number;
  exercise_selected:     string | null;   // Exercise _id
  exercise_time_minutes: number | null;
  actually_exercised:    boolean;
}

export type ProgressStatus = "tracking" | "recommendation" | "saved";

export interface DailyProgress {
  _id:                  string;
  plan_id:              string;
  user_id:              string;
  day_number:           number;
  date:                 string;
  eaten_template_menus: string[];          // Food _id array
  excess_daily_foods:   ExcessFood[];      // inline objects
  status:               ProgressStatus;
  recommendation_data:  RecommendationData;
  createdAt:            string;
  updatedAt:            string;
}

export interface Exercise {
  _id:          string;
  name:         string;
  cal_per_hour: number;
}
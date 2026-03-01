// server/src/models/DailyProgress.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IDailyProgress extends Document {
  plan_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  day_number: number; // e.g., Day 1, Day 2
  date: Date;
  
  // --- STATE 1: TRACKING ---
  eaten_template_menus: mongoose.Types.ObjectId[]; // Foods from the plan they actually ticked off
  excess_daily_foods: { // Foods manually added that weren't in the plan just for tracking purposes (e.g., snacks, drinks)
    name: string;
    price: number;
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
    sugar: number;
  }[];

  // --- STATE MANAGEMENT ---
  status: 'tracking' | 'recommendation' | 'saved';

  // --- STATE 2 & 3: RECOMMENDATION & SAVED ---
  recommendation_data: {
    calories_exceeded: number;
    budget_exceeded: number;
    exercise_selected: mongoose.Types.ObjectId | null; // future Exercise DB
    exercise_time_minutes: number | null;
    actually_exercised: boolean; // Did user actually do the exercise before clicking "Save"
  };
}

const DailyProgressSchema: Schema = new Schema({
  plan_id: { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  day_number: { type: Number, required: true },
  date: { type: Date, required: true },

  // Tracking Data
  eaten_template_menus: [{ type: Schema.Types.ObjectId, ref: 'Food' }],
  excess_daily_foods: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    calories: { type: Number, required: true },
    carbs: { type: Number, required: true },
    protein: { type: Number, required: true },
    fat: { type: Number, required: true },
    sugar: { type: Number, required: true },
  }],

  // State
  status: { type: String, enum: ['tracking', 'recommendation', 'saved'], default: 'tracking' },

  // Recommendation Data
  recommendation_data: {
    calories_exceeded: { type: Number, default: 0 },
    budget_exceeded: { type: Number, default: 0 },
    exercise_selected: { type: Schema.Types.ObjectId, ref: 'Exercise', default: null },
    exercise_time_minutes: { type: Number, default: null },
    actually_exercised: { type: Boolean, default: false }
  }
}, {
  timestamps: true,
});

// Ensure a user only has one progress record per plan per day
DailyProgressSchema.index({ plan_id: 1, date: 1 }, { unique: true });

export default mongoose.model<IDailyProgress>('DailyProgress', DailyProgressSchema);
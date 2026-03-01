// server/src/models/Plan.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IPlan extends Document {
  owner: mongoose.Types.ObjectId;
  fitness_goal: string;
  activity_level: string;
  priority: 'budget' | 'nutrient';
  budget_limit: number | null; // Null if priority is nutrient
  duration: number; // days
  template_menus: mongoose.Types.ObjectId[]; // The foods they plan to eat daily
  macro_targets: {
    daily_cal: number;
    carbohydrate: number;
    protein: number;
    fat: number;
    sugar: number;
  };
  status: 'active' | 'completed' | 'abandoned';
}

const PlanSchema: Schema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fitness_goal: { type: String, required: true },
  activity_level: { type: String, required: true },
  priority: { type: String, enum: ['budget', 'nutrient'], required: true },
  budget_limit: { type: Number, default: null },
  duration: { type: Number, required: true },
  template_menus: [{ type: Schema.Types.ObjectId, ref: 'Food' }],
  macro_targets: {
    daily_cal: { type: Number, required: true },
    carbohydrate: { type: Number, required: true },
    protein: { type: Number, required: true },
    fat: { type: Number, required: true },
    sugar: { type: Number, required: true },
  },
  status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' }
}, {
  timestamps: true,
});

export default mongoose.model<IPlan>('Plan', PlanSchema);
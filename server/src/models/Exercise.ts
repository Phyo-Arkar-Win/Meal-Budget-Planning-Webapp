// server/src/models/Exercise.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IExercise extends Document {
  name:         string;
  cal_per_hour: number;
  met?:         number;    // metabolic equivalent of task (optional)
  description?: string;
  reps?:        number;    // optional typical repetitions for strength exercises
  calculateBurn?(durationMinutes: number): number;
}

const ExerciseSchema: Schema = new Schema(
  {
    name:         { type: String, required: true, unique: true },
    cal_per_hour: { type: Number, required: true },
    met:          { type: Number, required: false },
    description:  { type: String, required: false },
    reps:         { type: Number, required: false },
  },
  { timestamps: true }
);

// Instance method — uses MET if available, falls back to cal_per_hour
ExerciseSchema.methods.calculateBurn = function (durationMinutes: number): number {
  if (this.met !== undefined) {
    const hours = durationMinutes / 60;
    return Math.round(this.met * 70 * hours); // 70kg base body weight
  }
  return Math.round((this.cal_per_hour * durationMinutes) / 60);
};

export default mongoose.model<IExercise>('Exercise', ExerciseSchema);
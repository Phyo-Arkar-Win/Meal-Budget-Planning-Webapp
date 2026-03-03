// server/src/models/Exercise.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IExercise extends Document {
  name: string;
  cal_per_hour: number;
  met?: number; // metabolic equivalent of task
  description?: string;
  reps?: number; // optional typical repetitions
  // method to compute calories burned given duration
  calculateBurn?(durationMinutes: number): number;
}

const ExerciseSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true // Prevents duplicate exercises
  },
  cal_per_hour: { 
    type: Number, 
    required: true 
  },
  met: {
    type: Number,
    required: false
  },
  description: {
    type: String,
    required: false
  },
  // optional typical number of repetitions (for strength exercises etc.)
  reps: {
    type: Number,
    required: false
  }
}, {
  timestamps: true,
});

// instance method for calculating calories burned
ExerciseSchema.methods.calculateBurn = function(durationMinutes: number): number {
  if (this.met !== undefined) {
    const hours = durationMinutes / 60;
    // assume 70kg base body weight for MET conversions
    return Math.round(this.met * 70 * hours);
  }
  // fallback to stored cal_per_hour
  return Math.round((this.cal_per_hour * durationMinutes) / 60);
};

export default mongoose.model<IExercise>('Exercise', ExerciseSchema);
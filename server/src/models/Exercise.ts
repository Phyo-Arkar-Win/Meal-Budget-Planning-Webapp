// server/src/models/Exercise.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IExercise extends Document {
  name: string;
  cal_per_hour: number;
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
  }
}, {
  timestamps: true,
});

export default mongoose.model<IExercise>('Exercise', ExerciseSchema);
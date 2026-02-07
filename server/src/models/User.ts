import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  gender: 'male' | 'female';
  age: number;
  weight: number; // in kg
  height: number; // in cm
  fitness_goal: 'Weight Loss' | 'Maintenance' | 'Muscle Gain'; 
  activity_level: 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active' | 'Extremely Active';
  carbohydrate_target?: number;
  protein_target?: number;
  fat_target?: number;
  sugar_target?: number;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female'], required: true },
  age: { type: Number, required: true },
  weight: { type: Number, required: true },
  height: { type: Number, required: true },

  fitness_goal: { 
    type: String, 
    enum: ['Weight Loss', 'Maintenance', 'Muscle Gain'], 
    default: 'Maintenance' 
  },
  activity_level: {
    type: String,
    enum: ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Extremely Active'],
    default: 'Sedentary'
  },
 
  daily_cal_target: { type: Number },
  carbohydrate_target: { type: Number },
  protein_target: { type: Number },
  fat_target: { type: Number },
  sugar_target: { type: Number }
}, {
  timestamps: true,
});

export default mongoose.model<IUser>('User', UserSchema);
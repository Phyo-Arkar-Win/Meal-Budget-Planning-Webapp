import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  gender: 'male' | 'female';
  age: number;
  weight: number;
  height: number;
  fitness_goal: string;
  macro_targets: {
    daily_cal: number;
    carbohydrate: number;
    protein: number;
    fat: number;
    sugar: number;
  };
}

// Mongoose Schema for Users
const UserSchema: Schema = new Schema({

  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  gender: { type: String, required: true },
  age: { type: Number, required: true },
  weight: { type: Number, required: true },
  height: { type: Number, required: true },
  macro_targets: {
    daily_cal: { type: Number},
    carbohydrate: { type: Number},
    protein: { type: Number},
    fat: { type: Number},
    sugar: { type: Number}
  }
}, {
  timestamps: true,
});

export default mongoose.model<IUser>('User', UserSchema);
import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  googleId: string;
  email: string;
  password: string;
  profile_picture: string;
  gender: 'male' | 'female';
  age: number;
  weight: number;
  height: number;
  fitness_goal: string;
  activity_level: string;
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
  googleId: { type: String, default: null },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  profile_picture: { type: String, default: ""},
  gender: { type: String, default: null},
  age: { type: Number, default: null},
  weight: { type: Number, default: null},
  height: { type: Number, default: null },
  fitness_goal: {type: String,default: null},
  activity_level: {type: String,default: null},
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
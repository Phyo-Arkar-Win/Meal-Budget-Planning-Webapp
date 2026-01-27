import mongoose, { Document, Schema } from 'mongoose';

// for TypeScript interface
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  gender: string;
  age: number;
  weight: number;
  height: number;
}

// Mongoose Schema for Users
const UserSchema: Schema = new Schema({

  username: { 
    type: String, 
    required: true, 
    unique: true },

  email: { 
    type: String, 
    required: true, 
    unique: true },

  password: { 
    type: String, 
    required: true },

  gender: { 
    type: String, 
    required: true },

    age: { 
      type: Number, 
      required: true },

  weight: { 
    type: Number, 
    required: true },

  height: { 
    type: Number, 
    required: true },
}, {
  timestamps: true,
});

export default mongoose.model<IUser>('User', UserSchema);
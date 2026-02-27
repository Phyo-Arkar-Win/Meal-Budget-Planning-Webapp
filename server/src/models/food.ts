import mongoose, { Document, Schema } from 'mongoose';

// TypeScript interface for Food document
export interface IFood extends Document {
  name: string;
  price: number;
  macros:{
      protein: number;
      carbohydrate: number;
      fat: number;
      sugar: number;
  }
}

// Mongoose Schema for Food
const FoodSchema: Schema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  macros:{
      protein: { type: Number, required: true },
      carbohydrate: { type: Number, required: true },
      fat: { type: Number, required: true },
      sugar: { type: Number, required: true },
  }
});

export default mongoose.model<IFood>('Food', FoodSchema);

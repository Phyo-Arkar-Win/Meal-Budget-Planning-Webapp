import mongoose, { Document, Schema } from 'mongoose';

export interface IFood extends Document {
  name: string;
  price: number;
  canteen: string;
  picture: string;
  macros: {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
    sugar: number;
  };
}

const FoodSchema: Schema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  canteen: { type: String, required: true },
  picture: { type: String, default: "" },
  macros: {
    calories: { type: Number, required: true },
    carbs: { type: Number, required: true },
    protein: { type: Number, required: true },
    fat: { type: Number, required: true },
    sugar: { type: Number, required: true },
  }
}, {
  timestamps: true,
});

export default mongoose.model<IFood>('Food', FoodSchema);
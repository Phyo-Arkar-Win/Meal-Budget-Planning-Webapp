import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  foodId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
}

const ReviewSchema: Schema = new Schema({
    foodId: { type: mongoose.Types.ObjectId, ref: 'Food', required: true },
    userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min : 1, max: 5 },
    comment: { type: String, required: true }
}, {
    timestamps: true,
});

export default mongoose.model<IReview>('Review', ReviewSchema);
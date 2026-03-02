import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
    food_id: mongoose.Types.ObjectId;
    user_id: mongoose.Types.ObjectId;
    review_text: string;
    stars: number;
}

const ReviewSchema: Schema = new Schema({
    food_id: {
        type: Schema.Types.ObjectId,
        ref: 'Food',
        required: true
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    review_text: {
        type: String,
        required: true
    },
    stars: {
        type: Number,
        min: 1,
        max: 5
    }
}, {
    timestamps: true,
});

export default mongoose.model<IReview>('Review', ReviewSchema);
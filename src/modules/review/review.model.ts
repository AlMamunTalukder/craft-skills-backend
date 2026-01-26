// server/models/review.model.ts
import { Schema, model, models } from 'mongoose';
import type { Document } from 'mongoose';

export interface IReview extends Document {
    image: string;
    title?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
    {
        image: {
            type: String,
            required: [true, 'Image is required'],
            trim: true,
        },
        title: {
            type: String,
            trim: true,
            maxlength: [100, 'Title cannot exceed 100 characters'],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    },
);

export const Review = models.Review || model<IReview>('Review', ReviewSchema);

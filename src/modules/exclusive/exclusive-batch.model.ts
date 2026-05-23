import { Schema, model, models } from 'mongoose';
import type { Document } from 'mongoose';

export interface IExclusiveBatch extends Document {
    batchNo: string | number;
    title: string;
    description?: string;
    startDate: Date;
    endDate: Date; // This will also serve as registration deadline
    offerPrice: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ExclusiveBatchSchema = new Schema<IExclusiveBatch>(
    {
        batchNo: {
            type: Schema.Types.Mixed,
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        offerPrice: {
            type: Number,
            required: true,
            default: 199,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        collection: 'exclusive_batches',
    },
);

ExclusiveBatchSchema.index({ batchNo: 1 });
ExclusiveBatchSchema.index({ isActive: 1 });
ExclusiveBatchSchema.index({ endDate: 1 });

export const ExclusiveBatch =
    models.ExclusiveBatch || model<IExclusiveBatch>('ExclusiveBatch', ExclusiveBatchSchema);

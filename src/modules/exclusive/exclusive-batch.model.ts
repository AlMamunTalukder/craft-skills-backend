import { Schema, model, models } from 'mongoose';
import type { Document, Types } from 'mongoose';

export interface IExclusiveBatch extends Document {
    batchNo: string | number;
    title: string;
    description?: string;
    date: Date;
    registrationDeadline: Date;
    isActive: boolean;
    offerPrice: number;
    regularPrice: number;
    whatsappGroupLink?: string;

    enrolledCount: number;
    participants: Types.ObjectId[]; // ✅ Reference to participants
    createdAt: Date;
    updatedAt: Date;
}

const ExclusiveBatchSchema = new Schema<IExclusiveBatch>(
    {
        batchNo: {
            type: Schema.Types.Mixed,
            required: true,
            unique: true,
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
        date: {
            type: Date,
            required: true,
        },
        registrationDeadline: {
            type: Date,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        offerPrice: {
            type: Number,
            default: 199,
        },
        regularPrice: {
            type: Number,
            default: 5500,
        },
        whatsappGroupLink: {
            type: String,
            trim: true,
        },

        enrolledCount: {
            type: Number,
            default: 0,
        },
        participants: [
            {
                type: Schema.Types.ObjectId,
                ref: 'ExclusiveOfferParticipant',
            },
        ],
    },
    {
        timestamps: true,
        collection: 'exclusive_batches',
    },
);

ExclusiveBatchSchema.index({ isActive: 1 });
ExclusiveBatchSchema.index({ date: 1 });

export const ExclusiveBatch =
    models.ExclusiveBatch || model<IExclusiveBatch>('ExclusiveBatch', ExclusiveBatchSchema);

import { Schema, model, models } from 'mongoose';

interface IExclusiveGift {
    name: string;
    email?: string;
    phone: string;
    whatsapp?: string;
    occupation?: string;
    address?: string;
    confirmedAt: Date;
    batchId: Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const ExclusiveGiftSchema = new Schema<IExclusiveGift>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        whatsapp: {
            type: String,
            trim: true,
        },
        occupation: {
            type: String,
            trim: true,
        },
        address: {
            type: String,
            trim: true,
        },
        confirmedAt: {
            type: Date,
            default: Date.now,
        },
        batchId: {
            type: Schema.Types.ObjectId,
            ref: 'ExclusiveBatch',
            required: true,
        },
    },
    {
        timestamps: true,
        collection: 'exclusive_gifts',
    }
);

export const ExclusiveGift =
    models.ExclusiveGift ||
    model<IExclusiveGift>('ExclusiveGift', ExclusiveGiftSchema);
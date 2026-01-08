// server/models/seminar-confirmation.model.ts
import type { Types } from 'mongoose';
import { Schema, model, models } from 'mongoose';

interface ISeminarConfirmation extends Document {
    name: string;
    email?: string;
    phone: string;
    whatsapp?: string;
    occupation?: string;
    address?: string;
    confirmedAt: Date;
    seminarId: Types.ObjectId;
}

const SeminarConfirmationSchema = new Schema<ISeminarConfirmation>(
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
        seminarId: {
            type: Schema.Types.ObjectId,
            ref: 'Seminar',
            required: true,
        },
    },
    {
        collection: 'seminar_confirmations',
        timestamps: true,
    },
);

export const SeminarConfirmation =
    models.SeminarConfirmation ||
    model<ISeminarConfirmation>('SeminarConfirmation', SeminarConfirmationSchema);

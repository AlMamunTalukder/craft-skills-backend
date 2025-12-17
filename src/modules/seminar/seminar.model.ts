// server/models/seminar.model.ts
import { Schema, model, models } from 'mongoose';
import type { Document, Types } from 'mongoose';

export interface ISeminar extends Document {
    sl?: string;
    title: string;
    description?: string;
    date: Date;
    registrationDeadline: Date;
    isActive: boolean;
    link?: string;
    facebookSecretGroup?: string;
    whatsappSecretGroup?: string;
    messengerSecretGroup?: string;
    facebookPublicGroup?: string;
    whatsappPublicGroup?: string;
    telegramGroup?: string;
    participants?: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const SeminarSchema = new Schema<ISeminar>(
    {
        sl: { type: String },
        title: { type: String, required: true },
        description: { type: String },
        date: { type: Date, required: true },
        registrationDeadline: { type: Date, required: true },
        isActive: { type: Boolean, default: true },
        link: { type: String },
        facebookSecretGroup: { type: String },
        whatsappSecretGroup: { type: String },
        messengerSecretGroup: { type: String },
        facebookPublicGroup: { type: String },
        whatsappPublicGroup: { type: String },
        telegramGroup: { type: String },
        participants: [{ type: Schema.Types.ObjectId, ref: 'Participant' }],
    },
    {
        timestamps: true,
    },
);

// server/models/seminar.model.ts
SeminarSchema.index({ createdAt: -1 });
SeminarSchema.index({ isActive: 1 });
SeminarSchema.index({ date: 1 });
SeminarSchema.index({ title: 'text', description: 'text' });

export const Seminar = models.Seminar || model<ISeminar>('Seminar', SeminarSchema);

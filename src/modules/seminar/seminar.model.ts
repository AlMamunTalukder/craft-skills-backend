import { Schema, model, models } from 'mongoose';
import type { IParticipant, ISeminar } from './seminar.interface';

const ParticipantSchema = new Schema<IParticipant>(
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
        registeredAt: {
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
        collection: 'participants',
        timestamps: false,
    },
);

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

SeminarSchema.index({ createdAt: -1 });
SeminarSchema.index({ isActive: 1 });
SeminarSchema.index({ date: 1 });
SeminarSchema.index({ title: 'text', description: 'text' });

export const Seminar = models.Seminar || model<ISeminar>('Seminar', SeminarSchema);
export const Participant =
    models.Participant || model<IParticipant>('Participant', ParticipantSchema);

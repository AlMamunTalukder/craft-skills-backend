import { Schema, model, models } from 'mongoose';
import type { IParticipant, ISeminar } from './seminar.interface';
const ParticipantSchema = new Schema<IParticipant>(
    {
        name: { type: String, required: true },
        email: { type: String },
        phone: { type: String },
        whatsapp: { type: String },
        occupation: { type: String },
        address: { type: String },
        registeredAt: { type: Date, default: Date.now },
        seminarId: { type: Schema.Types.ObjectId, ref: 'Seminar', required: true },
    },
    {
        timestamps: true,
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

        participants: [{ type: Schema.Types.ObjectId, ref: 'Participant' }],

        facebookSecretGroup: { type: String },
        whatsappSecretGroup: { type: String },
        messengerSecretGroup: { type: String },
        facebookPublicGroup: { type: String },
        whatsappPublicGroup: { type: String },
        telegramGroup: { type: String },
    },
    {
        timestamps: true,
    },
);

export const Participant =
    models.Participant || model<IParticipant>('Participant', ParticipantSchema);
export const Seminar = models.Seminar || model<ISeminar>('Seminar', SeminarSchema);

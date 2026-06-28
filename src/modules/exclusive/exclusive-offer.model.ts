import { Schema, model, models } from 'mongoose';
import type { IExclusiveOfferParticipant } from './exclusive-offer.interface';

const ExclusiveOfferParticipantSchema = new Schema<IExclusiveOfferParticipant>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, trim: true, lowercase: true },
        phone: { type: String, required: true, trim: true },
        whatsapp: { type: String, trim: true },
        occupation: { type: String, trim: true },
        price: { type: Number, default: 199 },
        paymentStatus: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
        paymentMethod: { type: String, default: 'sslcommerz' },
        transactionId: { type: String, unique: true },
        sslValidationId: { type: String },
        addedByAdmin: { type: Boolean, default: false },
        visitorId: { type: String }, // ✅ ADD THIS
    },
    { timestamps: true, collection: 'exclusive_offer_participants' },
);

ExclusiveOfferParticipantSchema.index({ createdAt: -1 });
ExclusiveOfferParticipantSchema.index({ transactionId: 1 });

export const ExclusiveOfferParticipant =
    models.ExclusiveOfferParticipant ||
    model<IExclusiveOfferParticipant>('ExclusiveOfferParticipant', ExclusiveOfferParticipantSchema);

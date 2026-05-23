import { Schema, model, models } from 'mongoose';
import type { IExclusiveOfferParticipant } from './exclusive-offer.interface';

const ExclusiveOfferParticipantSchema = new Schema<IExclusiveOfferParticipant>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, trim: true, lowercase: true },
        phone: { type: String, required: true, trim: true },
        whatsapp: { type: String, trim: true },
        occupation: { type: String, trim: true },
        batchId: { type: Schema.Types.ObjectId, ref: 'ExclusiveBatch', required: true },
        batchNo: { type: Schema.Types.Mixed },
        courseTitle: { type: String, default: 'Exclusive Offer Masterclass' },
        regularPrice: { type: Number, default: 5500 },
        offerPrice: { type: Number, default: 199 },
        paymentStatus: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
        paymentMethod: { type: String, default: 'sslcommerz' },
        transactionId: { type: String, unique: true },
    },
    { timestamps: true, collection: 'exclusive_offer_participants' },
);

ExclusiveOfferParticipantSchema.index({ createdAt: -1 });
ExclusiveOfferParticipantSchema.index({ batchId: 1 });

export const ExclusiveOfferParticipant =
    models.ExclusiveOfferParticipant ||
    model<IExclusiveOfferParticipant>('ExclusiveOfferParticipant', ExclusiveOfferParticipantSchema);

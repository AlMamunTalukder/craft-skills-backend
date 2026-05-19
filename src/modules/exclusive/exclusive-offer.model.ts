// ============================================
// server/modules/exclusive-offer/exclusive-offer.model.ts
// ============================================

import { Schema, model, models } from 'mongoose';
import type { IExclusiveOfferParticipant } from './exclusive-offer.interface';

const ExclusiveOfferParticipantSchema = new Schema<IExclusiveOfferParticipant>(
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

        courseTitle: {
            type: String,
            default: 'Exclusive Offer Masterclass',
        },

        regularPrice: {
            type: Number,
            default: 5500,
        },

        offerPrice: {
            type: Number,
            default: 190,
        },
    },
    {
        timestamps: true,
        collection: 'exclusive_offer_participants',
    },
);

ExclusiveOfferParticipantSchema.index({ createdAt: -1 });

export const ExclusiveOfferParticipant =
    models.ExclusiveOfferParticipant ||
    model<IExclusiveOfferParticipant>('ExclusiveOfferParticipant', ExclusiveOfferParticipantSchema);

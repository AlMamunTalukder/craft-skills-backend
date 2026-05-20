// ============================================
// server/modules/exclusive-offer/exclusive-offer.interface.ts
// ============================================

import type { Document } from 'mongoose';

export interface IExclusiveOfferParticipant extends Document {
    name: string;
    email?: string;
    phone: string;

    courseTitle?: string;
    regularPrice?: number;
    offerPrice?: number;

    paymentStatus?: 'pending' | 'success' | 'failed';
    paymentMethod?: string;
    transactionId?: string;

    createdAt: Date;
    updatedAt: Date;
}

import type { Document, Types } from 'mongoose';

export interface IExclusiveOfferParticipant extends Document {
    name: string;
    email?: string;
    phone: string;
    whatsapp?: string;
    occupation?: string;
    price?: number;
    paymentStatus?: 'pending' | 'success' | 'failed';
    paymentMethod?: string;
    transactionId?: string;
    sslValidationId?: string;
    addedByAdmin?: boolean;
    visitorId?: string;
    batchId?: Types.ObjectId; // ✅ ADD THIS
    sheetSynced?: boolean; // ✅ True once the Google Sheet append has completed
    createdAt: Date;
    updatedAt: Date;
}

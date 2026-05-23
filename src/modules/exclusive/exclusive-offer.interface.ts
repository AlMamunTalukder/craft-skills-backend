import type { Document, Types } from 'mongoose';

export interface IExclusiveOfferParticipant extends Document {
    name: string;
    email?: string;
    phone: string;
    whatsapp?: string;
    occupation?: string;
    batchId: Types.ObjectId;
    batchNo?: string | number;
    courseTitle?: string;
    regularPrice?: number;
    offerPrice?: number;
    paymentStatus?: 'pending' | 'success' | 'failed';
    paymentMethod?: string;
    transactionId?: string;
    createdAt: Date;
    updatedAt: Date;
}

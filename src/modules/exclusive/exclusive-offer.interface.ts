import type { Document } from 'mongoose';

export interface IExclusiveOfferParticipant extends Document {
    name: string;
    email?: string;
    phone: string;
    whatsapp?: string;
    occupation?: string;
    paymentStatus?: 'pending' | 'success' | 'failed';
    paymentMethod?: string;
    transactionId?: string;
    sslValidationId?: string;
    createdAt: Date;
    updatedAt: Date;
}

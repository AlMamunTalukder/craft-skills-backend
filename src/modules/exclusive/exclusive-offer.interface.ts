import type { Document } from 'mongoose';

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
    createdAt: Date;
    updatedAt: Date;
}

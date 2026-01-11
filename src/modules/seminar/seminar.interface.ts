import type { Document, Types } from 'mongoose';

export interface IParticipant extends Document {
    name: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    occupation?: string;
    address?: string;
    registeredAt: Date;
    seminarId: Types.ObjectId;
}

export interface ISeminar extends Document {
    sl?: string;
    title: string;
    description?: string;
    date: Date;
    registrationDeadline: Date;
    isActive: boolean;
    // link?: string;
    createdAt: Date;
    updatedAt: Date;

    facebookSecretGroup?: string;
    whatsappSecretGroup?: string;
    messengerSecretGroup?: string;
    facebookPublicGroup?: string;
    whatsappPublicGroup?: string;
    telegramGroup?: string;

    participants?: Types.ObjectId[]; // populated later
}

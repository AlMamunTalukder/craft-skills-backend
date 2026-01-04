// server/types/user.types.ts
import type { Types } from 'mongoose';

export interface PopulatedBatch {
    _id: Types.ObjectId;
    name: string;
    code: string;
    description?: string;
    isActive: boolean;
}

export interface PopulatedAdmission {
    _id: Types.ObjectId;
    status: 'pending' | 'approved' | 'rejected' | 'waitlisted';
    paymentStatus: 'pending' | 'partial' | 'paid' | 'cancelled';
}

export interface UserBatch {
    batchId: PopulatedBatch;
    batchCode: string;
    admissionId: PopulatedAdmission;
    isActive: boolean;
    enrolledAt: Date;
}

export interface PopulatedUser {
    _id: Types.ObjectId;
    name: string;
    email?: string;
    phone?: string;
    role: string;
    status: string;
    batches: UserBatch[];
}

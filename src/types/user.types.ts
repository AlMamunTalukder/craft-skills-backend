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

export interface AuthUser {
    _id: Types.ObjectId;
    name: string;
    email: string;
    phone: string;
    role: 'student' | 'teacher' | 'admin';
    status: 'active' | 'inactive' | 'suspended';
    batchNumber: string;
    batchId?: Types.ObjectId;
    admissionId?: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

// Create a types.ts file or add inline
export type ClassScheduleItem = {
    _id?: string;
    className: string;
    days: string;
    time: string;
    holidays?: string;
    createdAt?: string;
    updatedAt?: string;
};

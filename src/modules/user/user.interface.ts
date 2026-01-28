import type { Document } from 'mongoose';
import type { ObjectId } from 'mongodb';

export enum IUserRole {
    _STUDENT = 'student',
    _ADMIN = 'admin',
    _TEACHER = 'teacher',
}

export enum IUserStatus {
    _ACTIVE = 'active',
    _INACTIVE = 'inactive',
    _BANNED = 'banned',
}

export interface IUser extends Document {
    _id: string | ObjectId;
    name: string;
    email?: string;
    phone?: string;
    password: string;
    role: IUserRole;
    image?: string;
    status: IUserStatus;

    // For multiple batches support
    batchNumbers: string[]; // Array of batch numbers
    batchIds: ObjectId[]; // Array of batch IDs
    admissionIds: ObjectId[]; // Array of admission IDs

    currentBatchId?: ObjectId; // Current active batch for reference
    currentBatchNumber?: string;

    createdAt: Date;
    updatedAt: Date;
}

// import type { Document } from 'mongoose';
// import type { ObjectId } from 'mongodb';

// export enum IUserRole {
//     _STUDENT = 'student',
//     _ADMIN = 'admin',
//     _TEACHER = 'teacher',
// }

// export enum IUserStatus {
//     _ACTIVE = 'active',
//     _INACTIVE = 'inactive',
//     _BANNED = 'banned',
// }

// export interface IUser extends Document {
//     _id: string | ObjectId;
//     name: string;
//     email?: string;
//     phone?: string;
//     password: string;
//     role: IUserRole;
//     image?: string;
//     status: IUserStatus;
//     batchNumber: string;
//     batchId?: ObjectId;
//     createdAt: Date;
//     updatedAt: Date;
//     admissionId: ObjectId;
// }

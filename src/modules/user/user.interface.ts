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
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    password: string;
    role: IUserRole;
    image?: string;
    status: IUserStatus;
}

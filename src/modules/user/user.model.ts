// src/modules/user/user.model.ts
import { Schema, model, models } from 'mongoose';
import type { Document, Types } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: 'student' | 'teacher' | 'admin';
    status: 'active' | 'inactive' | 'suspended';
    batchNumber: string; // Make sure this exists
    batchId: Types.ObjectId;
    admissionId: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    validatePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['student', 'teacher', 'admin'],
            default: 'student',
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'suspended'],
            default: 'active',
        },
        batchNumber: {
            // Make sure this exists in schema
            type: String,
            required: true,
        },
        batchId: {
            type: Schema.Types.ObjectId,
            ref: 'CourseBatch',
            required: true,
        },
        admissionId: {
            type: Schema.Types.ObjectId,
            ref: 'Admission',
            required: true,
        },
    },
    {
        timestamps: true,
    },
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error: any) {
        next(error);
    }
});

// Add password validation method
userSchema.methods.validatePassword = async function (password: string): Promise<boolean> {
    try {
        return await bcrypt.compare(password, this.password);
    } catch (error) {
        return false;
    }
};

export const User = models.User || model<IUser>('User', userSchema);
export default User;

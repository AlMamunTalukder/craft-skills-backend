// // server/models/user.model.ts
// import { Schema, model, models } from 'mongoose';
// import type { Document } from 'mongoose';
// import bcrypt from 'bcrypt'; // Add bcrypt import

// export enum UserRole {
//     STUDENT = 'student',
//     TEACHER = 'teacher',
//     ADMIN = 'admin',
// }

// export enum UserStatus {
//     ACTIVE = 'active',
//     INACTIVE = 'inactive',
//     SUSPENDED = 'suspended',
// }

// export interface IUser extends Document {
//     name: string;
//     email?: string;
//     phone?: string;
//     password: string;
//     role: UserRole;
//     image?: string;
//     status: UserStatus;
//     batches: {
//         batchId: Schema.Types.ObjectId;
//         batchCode: string;
//         admissionId: Schema.Types.ObjectId;
//         isActive: boolean;
//         enrolledAt: Date;
//     }[];
//     createdAt: Date;
//     updatedAt: Date;

//     // Add method signature
//     validatePassword(password: string): Promise<boolean>;
// }

// const userSchema = new Schema<IUser>(
//     {
//         name: {
//             type: String,
//             required: [true, 'Name is required'],
//             trim: true,
//         },
//         email: {
//             type: String,
//             unique: true,
//             sparse: true,
//             lowercase: true,
//             trim: true,
//         },
//         phone: {
//             type: String,
//             unique: true,
//             sparse: true,
//             trim: true,
//         },
//         password: {
//             type: String,
//             required: true,
//         },
//         role: {
//             type: String,
//             enum: Object.values(UserRole),
//             default: UserRole.STUDENT,
//         },
//         image: {
//             type: String,
//         },
//         status: {
//             type: String,
//             enum: Object.values(UserStatus),
//             default: UserStatus.ACTIVE,
//         },
//         batches: [
//             {
//                 batchId: {
//                     type: Schema.Types.ObjectId,
//                     ref: 'CourseBatch',
//                     required: true,
//                 },
//                 batchCode: {
//                     type: String,
//                     required: true,
//                 },
//                 admissionId: {
//                     type: Schema.Types.ObjectId,
//                     ref: 'Admission',
//                     required: true,
//                 },
//                 isActive: {
//                     type: Boolean,
//                     default: true,
//                 },
//                 enrolledAt: {
//                     type: Date,
//                     default: Date.now,
//                 },
//             },
//         ],
//     },
//     {
//         timestamps: true,
//     },
// );

// // Hash password before saving
// userSchema.pre('save', async function (next) {
//     if (!this.isModified('password')) return next();

//     try {
//         const salt = await bcrypt.genSalt(10);
//         this.password = await bcrypt.hash(this.password, salt);
//         next();
//     } catch (error: any) {
//         next(error);
//     }
// });

// // Add password validation method
// userSchema.methods.validatePassword = async function (password: string): Promise<boolean> {
//     try {
//         return await bcrypt.compare(password, this.password);
//     } catch (error) {
//         return false;
//     }
// };

// // Add indexes
// userSchema.index({ 'batches.batchId': 1 });
// userSchema.index({ 'batches.admissionId': 1 });
// userSchema.index({ email: 1 }, { unique: true, sparse: true });
// userSchema.index({ phone: 1 }, { unique: true, sparse: true });

// export const User = models.User || model<IUser>('User', userSchema);
// export default User;

// src/models/user.model.ts
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

// // server/models/coursebatch.model.ts
// import { Schema, model, models } from 'mongoose';
// import type { Document } from 'mongoose';

// export interface ICourseBatch extends Document {
//     name: string;
//     code: string;
//     description?: string;
//     registrationStart: Date;
//     registrationEnd: Date;
//     isActive: boolean;
//     facebookSecretGroup?: string;
//     messengerSecretGroup?: string;
//     createdAt: Date;
//     updatedAt: Date;
// }

// const CourseBatchSchema = new Schema<ICourseBatch>(
//     {
//         name: {
//             type: String,
//             required: [true, 'Batch name is required'],
//         },
//         code: {
//             type: String,
//             required: [true, 'Batch code is required'],
//             unique: true,
//         },
//         description: { type: String },
//         registrationStart: {
//             type: Date,
//             required: [true, 'Registration start date is required'],
//         },
//         registrationEnd: {
//             type: Date,
//             required: [true, 'Registration end date is required'],
//         },
//         isActive: {
//             type: Boolean,
//             default: false,
//         },
//         facebookSecretGroup: {
//             type: String,
//             default: '',
//         },
//         messengerSecretGroup: {
//             type: String,
//             default: '',
//         },
//     },
//     {
//         timestamps: true,
//     },
// );

// // Add indexes
// CourseBatchSchema.index({ isActive: 1 });
// CourseBatchSchema.index({ registrationStart: 1 });
// CourseBatchSchema.index({ code: 1 }, { unique: true });

// export const CourseBatch =
//     models.CourseBatch || model<ICourseBatch>('CourseBatch', CourseBatchSchema);
// src/models/coursebatch.model.ts
import { Schema, model, models } from 'mongoose';
import type { Document } from 'mongoose';

export interface ICourseBatch extends Document {
    name: string;
    code: string;
    description?: string;
    registrationStart: Date;
    registrationEnd: Date;
    isActive: boolean;
    facebookSecretGroup?: string;
    messengerSecretGroup?: string;
    createdAt: Date;
    updatedAt: Date;
}

const CourseBatchSchema = new Schema<ICourseBatch>(
    {
        name: {
            type: String,
            required: [true, 'Batch name is required'],
        },
        code: {
            type: String,
            required: [true, 'Batch code is required'],
            unique: true,
        },
        description: { type: String },
        registrationStart: {
            type: Date,
            required: [true, 'Registration start date is required'],
        },
        registrationEnd: {
            type: Date,
            required: [true, 'Registration end date is required'],
        },
        isActive: {
            type: Boolean,
            default: false,
        },
        facebookSecretGroup: {
            type: String,
            default: '',
        },
        messengerSecretGroup: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    },
);

// Add indexes
CourseBatchSchema.index({ isActive: 1 });
CourseBatchSchema.index({ registrationStart: 1 });
CourseBatchSchema.index({ code: 1 }, { unique: true });

// CORRECT EXPORT
export const CourseBatch =
    models.CourseBatch || model<ICourseBatch>('CourseBatch', CourseBatchSchema);
export default CourseBatch;

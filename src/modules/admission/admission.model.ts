// import { Schema, model, models } from 'mongoose';
// import type { Document, Types } from 'mongoose';

// export interface IAdmission extends Document {
//     studentId?: Types.ObjectId;
//     name: string;
//     email?: string;
//     phone?: string;
//     whatsapp?: string;
//     facebook?: string;
//     occupation?: string;
//     address?: string;
//     courseId: Types.ObjectId;
//     batchId: Types.ObjectId;
//     paymentMethod?: string;
//     senderNumber?: string;
//     couponCode?: string;
//     amount?: number;
//     discountAmount?: number;
//     status: 'pending' | 'approved' | 'rejected' | 'waitlisted';
//     paymentStatus: 'pending' | 'partial' | 'paid' | 'cancelled';
//     notes?: string;
//     registeredAt: Date;
//     updatedAt: Date;
// }

// const AdmissionSchema = new Schema<IAdmission>(
//     {
//          studentId: {
//             type: Schema.Types.ObjectId,
//             ref: 'User',
//             required: false, // Make optional for existing records
//         },
//         name: {
//             type: String,
//             required: [true, 'Name is required'],
//             trim: true,
//         },
//         email: {
//             type: String,
//             trim: true,
//             lowercase: true,
//             validate: {
//                 validator: function (v: string) {
//                     return !v || /^\S+@\S+\.\S+$/.test(v);
//                 },
//                 message: 'Invalid email format',
//             },
//         },
//         phone: {
//             type: String,
//             trim: true,
//             validate: {
//                 validator: function (v: string) {
//                     return !v || /^[0-9+]{10,15}$/.test(v);
//                 },
//                 message: 'Invalid phone number',
//             },
//         },
//         whatsapp: {
//             type: String,
//             trim: true,
//             validate: {
//                 validator: function (v: string) {
//                     return !v || /^[0-9+]{10,15}$/.test(v);
//                 },
//                 message: 'Invalid WhatsApp number',
//             },
//         },
//         facebook: {
//             type: String,
//             trim: true,
//         },
//         occupation: {
//             type: String,
//             trim: true,
//         },
//         address: {
//             type: String,
//             trim: true,
//         },
//         courseId: {
//             type: Schema.Types.ObjectId,
//             ref: 'Course',
//             required: [true, 'Course is required'],
//         },
//         // batchId: {
//         //     type: Schema.Types.ObjectId,
//         //     ref: 'Batch',
//         //     required: [true, 'Batch is required'],
//         // },
//         batchId: {
//             type: Schema.Types.ObjectId,
//             ref: 'CourseBatch',
//             required: [true, 'Batch is required'],
//         },
//         paymentMethod: {
//             type: String,
//             trim: true,
//         },
//         senderNumber: {
//             type: String,
//             trim: true,
//         },
//         couponCode: {
//             type: String,
//             trim: true,
//             uppercase: true,
//         },
//         amount: {
//             type: Number,
//             min: 0,
//         },
//         discountAmount: {
//             type: Number,
//             min: 0,
//             default: 0,
//         },
//         status: {
//             type: String,
//             enum: ['pending', 'approved', 'rejected', 'waitlisted'],
//             default: 'pending',
//         },
//         paymentStatus: {
//             type: String,
//             enum: ['pending', 'partial', 'paid', 'cancelled'],
//             default: 'pending',
//         },
//         notes: {
//             type: String,
//             trim: true,
//         },
//         registeredAt: {
//             type: Date,
//             default: Date.now,
//         },
//     },
//     {
//         timestamps: true,
//     },
// );

// // Add indexes
// AdmissionSchema.index({ batchId: 1 });
// AdmissionSchema.index({ courseId: 1 });
// AdmissionSchema.index({ status: 1 });
// AdmissionSchema.index({ paymentStatus: 1 });
// AdmissionSchema.index({ result: 1 });
// AdmissionSchema.index({ registeredAt: -1 });
// AdmissionSchema.index({ name: 'text', email: 'text', phone: 'text' });

// export const Admission = models.Admission || model<IAdmission>('Admission', AdmissionSchema);
import { Schema, model, models } from 'mongoose';
import type { Document, Types } from 'mongoose';

export interface IAdmission extends Document {
    name: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    facebook?: string;
    occupation?: string;
    address?: string;
    courseId: Types.ObjectId;
    batchId: Types.ObjectId;
    paymentMethod?: string;
    senderNumber?: string;
    couponCode?: string;
    amount?: number;
    discountAmount?: number;
    status: 'pending' | 'approved' | 'rejected' | 'waitlisted';
    paymentStatus: 'pending' | 'partial' | 'paid' | 'cancelled';
    result?: string; // Add this field
    notes?: string;
    registeredAt: Date;
    updatedAt: Date;
}

const AdmissionSchema = new Schema<IAdmission>(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            validate: {
                validator: function (v: string) {
                    return !v || /^\S+@\S+\.\S+$/.test(v);
                },
                message: 'Invalid email format',
            },
        },
        phone: {
            type: String,
            trim: true,
            validate: {
                validator: function (v: string) {
                    return !v || /^[0-9+]{10,15}$/.test(v);
                },
                message: 'Invalid phone number',
            },
        },
        whatsapp: {
            type: String,
            trim: true,
            validate: {
                validator: function (v: string) {
                    return !v || /^[0-9+]{10,15}$/.test(v);
                },
                message: 'Invalid WhatsApp number',
            },
        },
        facebook: {
            type: String,
            trim: true,
        },
        occupation: {
            type: String,
            trim: true,
        },
        address: {
            type: String,
            trim: true,
        },
        courseId: {
            type: Schema.Types.ObjectId,
            ref: 'Course',
            required: [true, 'Course is required'],
        },
        batchId: {
            type: Schema.Types.ObjectId,
            ref: 'CourseBatch',
            required: [true, 'Batch is required'],
        },
        paymentMethod: {
            type: String,
            trim: true,
        },
        senderNumber: {
            type: String,
            trim: true,
        },
        couponCode: {
            type: String,
            trim: true,
            uppercase: true,
        },
        amount: {
            type: Number,
            min: 0,
        },
        discountAmount: {
            type: Number,
            min: 0,
            default: 0,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'waitlisted'],
            default: 'pending',
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'partial', 'paid', 'cancelled'],
            default: 'pending',
        },
        result: {
            type: String,
            enum: ['pending', 'needs improvement', 'average', 'good', 'very good', 'excellent'],
            default: 'pending',
        },
        notes: {
            type: String,
            trim: true,
        },
        registeredAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    },
);

// Add indexes
AdmissionSchema.index({ batchId: 1 });
AdmissionSchema.index({ courseId: 1 });
AdmissionSchema.index({ status: 1 });
AdmissionSchema.index({ paymentStatus: 1 });
AdmissionSchema.index({ result: 1 });
AdmissionSchema.index({ registeredAt: -1 });
AdmissionSchema.index({ name: 'text', email: 'text', phone: 'text' });

export const Admission = models.Admission || model<IAdmission>('Admission', AdmissionSchema);

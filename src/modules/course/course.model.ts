// server/modules/course/course.model.ts
import { Schema, model, models } from 'mongoose';
import type { Document } from 'mongoose';

export interface ICourse extends Document {
    name: string;
    description?: string;
    price: number;
    discount?: number;
    paymentCharge?: number;
    createdAt: Date;
    updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
    {
        name: {
            type: String,
            required: [true, 'Course name is required'],
            trim: true,
        },
        description: {
            type: String,
            default: '',
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative'],
        },
        discount: {
            type: Number,
            default: 0,
            min: [0, 'Discount cannot be negative'],
            max: [100, 'Discount cannot exceed 100%'],
        },
        paymentCharge: {
            type: Number,
            default: 0,
            min: [0, 'Payment charge cannot be negative'],
        },
    },
    {
        timestamps: true,
    },
);

// Add indexes
CourseSchema.index({ name: 'text' });
CourseSchema.index({ price: 1 });
CourseSchema.index({ createdAt: -1 });

export const Course = models.Course || model<ICourse>('Course', CourseSchema);

// server/models/coupon.model.ts
import { Schema, model, models } from 'mongoose';
import type { Document } from 'mongoose';

export interface ICoupon extends Document {
    code: string;
    discountType: 'PERCENTAGE' | 'AMOUNT';
    discount: number;
    isActive: boolean;
    validFrom: Date;
    validTo: Date;
    maxUsage?: number;
    usedCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
    {
        code: {
            type: String,
            required: [true, 'Coupon code is required'],
            unique: true,
            uppercase: true,
            trim: true,
        },
        discountType: {
            type: String,
            enum: ['PERCENTAGE', 'AMOUNT'],
            required: [true, 'Discount type is required'],
        },
        discount: {
            type: Number,
            required: [true, 'Discount is required'],
            min: [0, 'Discount cannot be negative'],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        validFrom: {
            type: Date,
            required: [true, 'Valid from date is required'],
        },
        validTo: {
            type: Date,
            required: [true, 'Valid to date is required'],
        },
        maxUsage: {
            type: Number,
            min: [1, 'Max usage must be at least 1'],
        },
        usedCount: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
    },
);


CouponSchema.index({ code: 1 }, { unique: true });
CouponSchema.index({ isActive: 1 });
CouponSchema.index({ validFrom: 1, validTo: 1 });

export const Coupon = models.Coupon || model<ICoupon>('Coupon', CouponSchema);

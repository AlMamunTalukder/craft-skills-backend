"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Coupon = void 0;
// server/models/coupon.model.ts
const mongoose_1 = require("mongoose");
const CouponSchema = new mongoose_1.Schema({
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
        type: String,
        required: [true, 'Valid from date is required'],
    },
    validTo: {
        type: String,
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
}, {
    timestamps: true,
});
// CouponSchema.index({ code: 1 }, { unique: true });
CouponSchema.index({ isActive: 1 });
CouponSchema.index({ validFrom: 1, validTo: 1 });
//update cupon
exports.Coupon = mongoose_1.models.Coupon || (0, mongoose_1.model)('Coupon', CouponSchema);

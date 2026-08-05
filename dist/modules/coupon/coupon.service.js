"use strict";
// server/services/coupon.service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.couponService = void 0;
const timezone_1 = require("../../utils/timezone");
const coupon_model_1 = require("./coupon.model");
const toResponseDto = (coupon) => ({
    _id: coupon._id.toString(),
    code: coupon.code,
    discountType: coupon.discountType,
    discount: coupon.discount,
    isActive: coupon.isActive,
    validFrom: (0, timezone_1.convertUTCToBD)(coupon.validFrom), // Now handles any type
    validTo: (0, timezone_1.convertUTCToBD)(coupon.validTo), // Now handles any type
    maxUsage: coupon.maxUsage,
    usedCount: coupon.usedCount,
    createdAt: coupon.createdAt,
    updatedAt: coupon.updatedAt,
});
// Get all coupons
const getAllCoupons = async () => {
    const coupons = await coupon_model_1.Coupon.find().sort({ createdAt: -1 }).lean();
    return coupons.map(toResponseDto);
};
// Get coupon by ID
const getCouponById = async (id) => {
    const coupon = await coupon_model_1.Coupon.findById(id).lean();
    if (!coupon)
        throw new Error('Coupon not found');
    return toResponseDto(coupon);
};
// Get coupon by code
const getCouponByCode = async (code) => {
    const coupon = await coupon_model_1.Coupon.findOne({ code: code.toUpperCase() }).lean();
    if (!coupon)
        return null;
    return toResponseDto(coupon);
};
// Create coupon
const createCoupon = async (createDto) => {
    // Check if code already exists
    const existingCoupon = await coupon_model_1.Coupon.findOne({ code: createDto.code.toUpperCase() });
    if (existingCoupon) {
        throw new Error('Coupon code already exists');
    }
    // Convert BD time to UTC before saving
    const couponData = {
        ...createDto,
        code: createDto.code.toUpperCase(),
        validFrom: (0, timezone_1.convertBDToUTC)(createDto.validFrom),
        validTo: (0, timezone_1.convertBDToUTC)(createDto.validTo),
    };
    const coupon = new coupon_model_1.Coupon(couponData);
    const savedCoupon = await coupon.save();
    return toResponseDto(savedCoupon.toObject());
};
// Update coupon
const updateCoupon = async (id, updateDto) => {
    const updateData = { ...updateDto };
    if (updateDto.code) {
        updateData.code = updateDto.code.toUpperCase();
    }
    // Convert BD time to UTC before updating
    if (updateDto.validFrom) {
        updateData.validFrom = (0, timezone_1.convertBDToUTC)(updateDto.validFrom);
    }
    if (updateDto.validTo) {
        updateData.validTo = (0, timezone_1.convertBDToUTC)(updateDto.validTo);
    }
    const coupon = await coupon_model_1.Coupon.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
        lean: true,
    });
    if (!coupon)
        throw new Error('Coupon not found');
    return toResponseDto(coupon);
};
// Delete coupon
const deleteCoupon = async (id) => {
    const coupon = await coupon_model_1.Coupon.findByIdAndDelete(id);
    if (!coupon)
        throw new Error('Coupon not found');
};
// Update coupon status
const updateCouponStatus = async (id, isActive) => {
    const coupon = await coupon_model_1.Coupon.findByIdAndUpdate(id, { isActive }, { new: true, lean: true });
    if (!coupon)
        throw new Error('Coupon not found');
    return toResponseDto(coupon);
};
// Apply coupon (for client-side use)
const applyCoupon = async (code, totalAmount) => {
    const coupon = await coupon_model_1.Coupon.findOne({
        code: code.toUpperCase(),
        isActive: true,
    });
    if (!coupon) {
        return {
            isValid: false,
            discountAmount: 0,
            finalAmount: totalAmount,
            message: 'Invalid coupon code',
        };
    }
    // Check validity dates
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validTo) {
        return {
            isValid: false,
            discountAmount: 0,
            finalAmount: totalAmount,
            message: 'Coupon is not valid at this time',
        };
    }
    // Check max usage
    if (coupon.maxUsage && coupon.usedCount >= coupon.maxUsage) {
        return {
            isValid: false,
            discountAmount: 0,
            finalAmount: totalAmount,
            message: 'Coupon usage limit reached',
        };
    }
    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
        discountAmount = (totalAmount * coupon.discount) / 100;
    }
    else {
        discountAmount = coupon.discount;
    }
    // Ensure discount doesn't exceed total amount
    discountAmount = Math.min(discountAmount, totalAmount);
    const finalAmount = totalAmount - discountAmount;
    // Increment used count
    await coupon_model_1.Coupon.findByIdAndUpdate(coupon._id, {
        $inc: { usedCount: 1 },
    });
    return {
        isValid: true,
        discountAmount,
        finalAmount,
        message: 'Coupon applied successfully',
    };
};
exports.couponService = {
    getAllCoupons,
    getCouponById,
    getCouponByCode,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    updateCouponStatus,
    applyCoupon,
};

// server/services/coupon.service.ts

import type { CouponResponse, CreateCouponDto, UpdateCouponDto } from './coupon.dto';
import { Coupon } from './coupon.model';

const toResponseDto = (coupon: any): CouponResponse => ({
    _id: coupon._id.toString(),
    code: coupon.code,
    discountType: coupon.discountType,
    discount: coupon.discount,
    isActive: coupon.isActive,
    validFrom: coupon.validFrom,
    validTo: coupon.validTo,
    maxUsage: coupon.maxUsage,
    usedCount: coupon.usedCount,
    createdAt: coupon.createdAt,
    updatedAt: coupon.updatedAt,
});

// Get all coupons
const getAllCoupons = async (): Promise<CouponResponse[]> => {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();

    return coupons.map(toResponseDto);
};

// Get coupon by ID
const getCouponById = async (id: string): Promise<CouponResponse> => {
    const coupon = await Coupon.findById(id).lean();
    if (!coupon) throw new Error('Coupon not found');
    return toResponseDto(coupon);
};

// Get coupon by code
const getCouponByCode = async (code: string): Promise<CouponResponse | null> => {
    const coupon = await Coupon.findOne({ code: code.toUpperCase() }).lean();
    if (!coupon) return null;
    return toResponseDto(coupon);
};

// Create coupon
const createCoupon = async (createDto: CreateCouponDto): Promise<CouponResponse> => {
    // Check if code already exists
    const existingCoupon = await Coupon.findOne({ code: createDto.code.toUpperCase() });
    if (existingCoupon) {
        throw new Error('Coupon code already exists');
    }

    const couponData = {
        ...createDto,
        code: createDto.code.toUpperCase(),
        validFrom: new Date(createDto.validFrom),
        validTo: new Date(createDto.validTo),
    };

    const coupon = new Coupon(couponData);
    const savedCoupon = await coupon.save();
    return toResponseDto(savedCoupon.toObject());
};

// Update coupon
const updateCoupon = async (id: string, updateDto: UpdateCouponDto): Promise<CouponResponse> => {
    const updateData: any = { ...updateDto };

    if (updateDto.code) {
        updateData.code = updateDto.code.toUpperCase();
    }

    if (updateDto.validFrom) {
        updateData.validFrom = new Date(updateDto.validFrom);
    }

    if (updateDto.validTo) {
        updateData.validTo = new Date(updateDto.validTo);
    }

    const coupon = await Coupon.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
        lean: true,
    });

    if (!coupon) throw new Error('Coupon not found');
    return toResponseDto(coupon);
};

// Delete coupon
const deleteCoupon = async (id: string): Promise<void> => {
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) throw new Error('Coupon not found');
};

// Update coupon status
const updateCouponStatus = async (id: string, isActive: boolean): Promise<CouponResponse> => {
    const coupon = await Coupon.findByIdAndUpdate(id, { isActive }, { new: true, lean: true });

    if (!coupon) throw new Error('Coupon not found');
    return toResponseDto(coupon);
};

// Apply coupon (for client-side use)
const applyCoupon = async (
    code: string,
    totalAmount: number,
): Promise<{
    isValid: boolean;
    discountAmount: number;
    finalAmount: number;
    message?: string;
}> => {
    const coupon = await Coupon.findOne({
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
    } else {
        discountAmount = coupon.discount;
    }

    // Ensure discount doesn't exceed total amount
    discountAmount = Math.min(discountAmount, totalAmount);
    const finalAmount = totalAmount - discountAmount;

    // Increment used count
    await Coupon.findByIdAndUpdate(coupon._id, {
        $inc: { usedCount: 1 },
    });

    return {
        isValid: true,
        discountAmount,
        finalAmount,
        message: 'Coupon applied successfully',
    };
};

export const couponService = {
    getAllCoupons,
    getCouponById,
    getCouponByCode,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    updateCouponStatus,
    applyCoupon,
};

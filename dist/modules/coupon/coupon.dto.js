"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCouponDto = exports.createCouponDto = exports.createCouponBaseSchema = void 0;
// server/dto/coupon.dto.ts
const zod_1 = require("zod");
exports.createCouponBaseSchema = zod_1.z
    .object({
    code: zod_1.z.string().min(3, 'Coupon code must be at least 3 characters').max(50),
    discountType: zod_1.z.enum(['PERCENTAGE', 'AMOUNT']),
    discount: zod_1.z.coerce.number().min(1, 'Discount must be at least 1'),
    isActive: zod_1.z.boolean().optional().default(true),
    validFrom: zod_1.z.string().refine((val) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(val), {
        message: 'Valid from must be in format YYYY-MM-DDTHH:mm (BD time)',
    }),
    validTo: zod_1.z.string().refine((val) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(val), {
        message: 'Valid to must be in format YYYY-MM-DDTHH:mm (BD time)',
    }),
    maxUsage: zod_1.z.coerce.number().min(1).optional(),
});
exports.createCouponDto = exports.createCouponBaseSchema
    .refine((data) => {
    if (data.discountType === 'PERCENTAGE') {
        return data.discount >= 1 && data.discount <= 100;
    }
    return true;
}, {
    message: 'Percentage discount must be between 1 and 100',
    path: ['discount'],
})
    .refine((data) => {
    const validFrom = new Date(data.validFrom);
    const validTo = new Date(data.validTo);
    return validTo > validFrom;
}, {
    message: 'Valid to date must be after valid from date',
    path: ['validTo'],
});
exports.updateCouponDto = exports.createCouponBaseSchema.partial();

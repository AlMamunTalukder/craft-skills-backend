// server/dto/coupon.dto.ts
import { z } from 'zod';

export const createCouponDto = z
    .object({
        code: z.string().min(3, 'Coupon code must be at least 3 characters').max(50),
        discountType: z.enum(['PERCENTAGE', 'AMOUNT']),
        discount: z.coerce.number().min(1, 'Discount must be at least 1'),
        isActive: z.boolean().optional().default(true),
        validFrom: z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: 'Invalid valid from date format',
        }),
        validTo: z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: 'Invalid valid to date format',
        }),
        maxUsage: z.coerce.number().min(1).optional(),
    })
    .refine(
        (data) => {
            if (data.discountType === 'PERCENTAGE') {
                return data.discount >= 1 && data.discount <= 100;
            }
            return true;
        },
        {
            message: 'Percentage discount must be between 1 and 100',
            path: ['discount'],
        },
    )
    .refine(
        (data) => {
            const validFrom = new Date(data.validFrom);
            const validTo = new Date(data.validTo);
            return validTo > validFrom;
        },
        {
            message: 'Valid to date must be after valid from date',
            path: ['validTo'],
        },
    );

export const updateCouponDto = createCouponDto.partial();

export type CreateCouponDto = z.infer<typeof createCouponDto>;
export type UpdateCouponDto = z.infer<typeof updateCouponDto>;

// Response DTO
export interface CouponResponse {
    _id: string;
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

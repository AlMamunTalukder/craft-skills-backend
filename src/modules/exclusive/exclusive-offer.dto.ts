// ============================================
// server/modules/exclusive-offer/exclusive-offer.dto.ts
// ============================================

import { z } from 'zod';

export const registerExclusiveOfferDto = z.object({
    name: z.string().min(1, 'Name is required'),

    email: z.string().email('Invalid email').optional().or(z.literal('')),

    phone: z.string().min(1, 'Phone number is required'),

    courseTitle: z.string().optional(),

    regularPrice: z.number().optional(),

    offerPrice: z.number().optional(),
});

export type RegisterExclusiveOfferDto = z.infer<typeof registerExclusiveOfferDto>;

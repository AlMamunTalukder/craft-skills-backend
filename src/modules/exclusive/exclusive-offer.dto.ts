// ============================================
// server/modules/exclusive-offer/exclusive-offer.dto.ts
// ============================================

import { z } from 'zod';

export const registerExclusiveOfferDto = z.object({
    name: z.string().min(1),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().min(1),
    courseTitle: z.string().optional(),
    regularPrice: z.number().optional(),
    offerPrice: z.number().optional(),
});

export type RegisterExclusiveOfferDto = z.infer<typeof registerExclusiveOfferDto>;

import { z } from 'zod';

export const registerExclusiveOfferDto = z.object({
    name: z.string().min(1),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().min(1),
    whatsapp: z.string().optional(),
    occupation: z.string().optional(),
    batchId: z.string(),
});

export type RegisterExclusiveOfferDto = z.infer<typeof registerExclusiveOfferDto>;

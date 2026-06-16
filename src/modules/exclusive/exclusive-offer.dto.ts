import { z } from 'zod';

export const registerExclusiveOfferDto = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().min(11, 'Valid phone number is required'),
    whatsapp: z.string().optional(),
    occupation: z.string().optional(),
    visitorId: z.string().optional(),
});

export type RegisterExclusiveOfferDto = z.infer<typeof registerExclusiveOfferDto>;

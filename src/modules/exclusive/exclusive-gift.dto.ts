import { z } from 'zod';

export const exclusiveGiftDto = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().min(11, 'Phone must be at least 11 digits'),
    whatsapp: z.string().optional(),
    occupation: z.string().optional(),
    address: z.string().optional(),
    batchId: z.string().min(1, 'Batch ID is required').optional(),
});

export type ExclusiveGiftDto = z.infer<typeof exclusiveGiftDto>;

// server/dto/coursebatch.dto.ts
import { z } from 'zod';

export const createBatchDto = z.object({
    name: z.string().min(1, 'Batch name is required'),
    code: z.string().min(1, 'Batch code is required'),
    description: z.string().optional(),
    registrationStart: z
        .string()
        .min(1, 'Registration start date is required')
        .refine((val) => !isNaN(Date.parse(val)), {
            message: 'Invalid date format',
        }),
    registrationEnd: z
        .string()
        .min(1, 'Registration end date is required')
        .refine((val) => !isNaN(Date.parse(val)), {
            message: 'Invalid date format',
        }),
    isActive: z.boolean().optional().default(false),
    facebookSecretGroup: z.string().url().optional().or(z.literal('')),
    messengerSecretGroup: z.string().url().optional().or(z.literal('')),
});

export const updateBatchDto = createBatchDto.partial();

export type CreateBatchDto = z.infer<typeof createBatchDto>;
export type UpdateBatchDto = z.infer<typeof updateBatchDto>;

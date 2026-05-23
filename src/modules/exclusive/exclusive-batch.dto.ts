import { z } from 'zod';

export const createExclusiveBatchDto = z.object({
    batchNo: z.union([z.string(), z.number()]),
    title: z.string().min(1),
    description: z.string().optional(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(), // This is the deadline
    offerPrice: z.number().default(199),
    isActive: z.boolean().default(true),
});

export const updateExclusiveBatchDto = createExclusiveBatchDto.partial();

export type CreateExclusiveBatchDto = z.infer<typeof createExclusiveBatchDto>;
export type UpdateExclusiveBatchDto = z.infer<typeof updateExclusiveBatchDto>;

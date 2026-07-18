import { z } from 'zod';

export const createExclusiveBatchDto = z.object({
    batchNo: z.union([z.string(), z.number()]),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    date: z.string().datetime(),
    registrationDeadline: z.string().datetime(),
    isActive: z.boolean().optional().default(true),
    offerPrice: z.number().default(199),
    regularPrice: z.number().default(5500),
   
});

export const updateExclusiveBatchDto = createExclusiveBatchDto.partial();

export type CreateExclusiveBatchDto = z.infer<typeof createExclusiveBatchDto>;
export type UpdateExclusiveBatchDto = z.infer<typeof updateExclusiveBatchDto>;
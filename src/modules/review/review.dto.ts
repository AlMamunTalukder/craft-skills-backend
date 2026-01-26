// server/dto/review.dto.ts
import { z } from 'zod';

export const createReviewDto = z.object({
    image: z.string().min(1, 'Image is required'),
    title: z.string().optional(),
    isActive: z.boolean().optional().default(true),
});

export const updateReviewDto = createReviewDto.partial();

export type CreateReviewDto = z.infer<typeof createReviewDto>;
export type UpdateReviewDto = z.infer<typeof updateReviewDto>;

export interface ReviewResponse {
    _id: string;
    image: string;
    title?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

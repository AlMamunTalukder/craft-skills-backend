// server/dto/course.dto.ts
import { z } from 'zod';

export const createCourseDto = z.object({
    name: z.string().min(1, 'Course name is required'),
    description: z.string().optional(),
    price: z.number().min(0, 'Price must be at least 0'),
    discount: z.number().min(0).max(100).optional().default(0),
    paymentCharge: z.number().min(0).optional().default(0),
});

export const updateCourseDto = createCourseDto.partial();

export type CreateCourseDto = z.infer<typeof createCourseDto>;
export type UpdateCourseDto = z.infer<typeof updateCourseDto>;

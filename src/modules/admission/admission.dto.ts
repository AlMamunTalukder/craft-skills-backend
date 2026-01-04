import { z } from 'zod';

export const createAdmissionDto = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().min(1, 'Phone is required'),
    whatsapp: z.string().optional(),
    facebook: z.string().optional(),
    occupation: z.string().optional(),
    address: z.string().optional(),
    courseId: z.string().min(1, 'Course is required'),
    batchId: z.string().min(1, 'Batch is required'),
    paymentMethod: z.string().optional(),
    senderNumber: z.string().optional(),
    couponCode: z.string().optional(),
    amount: z.number().optional(),
    notes: z.string().optional(),
    status: z.enum(['pending', 'approved', 'rejected', 'waitlisted']).optional().default('pending'),
    paymentStatus: z
        .enum(['pending', 'partial', 'paid', 'cancelled'])
        .optional()
        .default('pending'),
});

export const updateAdmissionDto = createAdmissionDto.partial();

export type CreateAdmissionDto = z.infer<typeof createAdmissionDto>;
export type UpdateAdmissionDto = z.infer<typeof updateAdmissionDto>;

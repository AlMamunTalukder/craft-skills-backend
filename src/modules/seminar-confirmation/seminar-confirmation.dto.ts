// server/dto/seminar-confirmation.dto.ts
import { z } from 'zod';

export const seminarConfirmationDto = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().min(11, 'Phone must be at least 11 digits'),
    whatsapp: z.string().optional(),
    occupation: z.string().optional(),
    address: z.string().optional(),
    seminarId: z.string().min(1, 'Seminar ID is required'),
});

export type SeminarConfirmationDto = z.infer<typeof seminarConfirmationDto>;

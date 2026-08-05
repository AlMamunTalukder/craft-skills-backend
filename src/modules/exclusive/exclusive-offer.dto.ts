import { z } from 'zod';
import mongoose from 'mongoose';

export const registerExclusiveOfferDto = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().min(11, 'Valid phone number is required'),
    whatsapp: z.string().optional(),
    occupation: z.string().optional(),
    visitorId: z.string().optional(),
    batchId: z.string().optional(),
});

export type RegisterExclusiveOfferDto = z.infer<typeof registerExclusiveOfferDto>;

// 🔐 Admin DTO for creating participants (strict validation, no payment fields)
export const createParticipantAdminDto = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().regex(/^(\+880|0088|880|01)\d{9,10}$/, 'Invalid BD phone number'),
    whatsapp: z.string().optional(),
    occupation: z.string().max(100).optional(),
    batchId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), 'Invalid batch ID'),
    // EXPLICITLY EXCLUDE: paymentStatus, price, transactionId, sslValidationId, paymentMethod
});

export type CreateParticipantAdminDto = z.infer<typeof createParticipantAdminDto>;

// 🔐 Admin DTO for updating participants (safe update, blocks payment fields)
export const updateParticipantAdminDto = z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    occupation: z.string().max(100).optional(),
    batchId: z
        .string()
        .refine((val) => mongoose.Types.ObjectId.isValid(val), 'Invalid batch ID')
        .optional(),
    // EXPLICITLY EXCLUDE: paymentStatus, price, transactionId, sslValidationId, paymentMethod
});

export type UpdateParticipantAdminDto = z.infer<typeof updateParticipantAdminDto>;

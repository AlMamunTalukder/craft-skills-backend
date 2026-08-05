"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerParticipantDto = exports.updateSeminarDto = exports.createSeminarDto = void 0;
// server/dto/seminar.dto.ts
const zod_1 = require("zod");
exports.createSeminarDto = zod_1.z.object({
    sl: zod_1.z.string().optional(),
    title: zod_1.z.string().min(1, 'Title is required'),
    description: zod_1.z.string().optional(),
    date: zod_1.z
        .string()
        .min(1, 'Date is required')
        .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date format',
    }),
    registrationDeadline: zod_1.z
        .string()
        .min(1, 'Registration deadline is required')
        .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date format',
    }),
    isActive: zod_1.z.boolean().optional().default(true),
    // link: z.string().url().optional().or(z.literal('')),
    facebookSecretGroup: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    whatsappSecretGroup: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    messengerSecretGroup: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    facebookPublicGroup: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    whatsappPublicGroup: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    telegramGroup: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
});
exports.updateSeminarDto = exports.createSeminarDto.partial();
// Add participant registration DTO
exports.registerParticipantDto = zod_1.z
    .object({
    name: zod_1.z.string().min(1, 'Name is required'),
    email: zod_1.z.string().email('Invalid email').optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().optional(),
    whatsapp: zod_1.z.string().optional(),
    occupation: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    seminarId: zod_1.z.string().min(1, 'Seminar ID is required'),
})
    .refine((data) => data.email || data.phone || data.whatsapp, {
    message: 'At least one contact (email, phone, or whatsapp) is required',
    path: ['email'],
});

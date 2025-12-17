// server/dto/seminar.dto.ts
import { z } from 'zod';

export const createSeminarDto = z.object({
    sl: z.string().optional(),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    date: z
        .string()
        .min(1, 'Date is required')
        .refine((val) => !isNaN(Date.parse(val)), {
            message: 'Invalid date format',
        }),
    registrationDeadline: z
        .string()
        .min(1, 'Registration deadline is required')
        .refine((val) => !isNaN(Date.parse(val)), {
            message: 'Invalid date format',
        }),
    isActive: z.boolean().optional().default(true),
    link: z.string().url().optional().or(z.literal('')),
    facebookSecretGroup: z.string().url().optional().or(z.literal('')),
    whatsappSecretGroup: z.string().url().optional().or(z.literal('')),
    messengerSecretGroup: z.string().url().optional().or(z.literal('')),
    facebookPublicGroup: z.string().url().optional().or(z.literal('')),
    whatsappPublicGroup: z.string().url().optional().or(z.literal('')),
    telegramGroup: z.string().url().optional().or(z.literal('')),
});

export const updateSeminarDto = createSeminarDto.partial();

export type CreateSeminarDto = z.infer<typeof createSeminarDto>;
export type UpdateSeminarDto = z.infer<typeof updateSeminarDto>;

// import { z } from 'zod';

// export const createSeminarDto = z.object({
//     sl: z.string().optional(),
//     title: z.string().nonempty('Title is required'),
//     description: z.string().optional(),
//     date: z
//         .string()
//         .nonempty('Date is required')
//         .refine((val) => !isNaN(Date.parse(val)), {
//             message: 'Invalid date format',
//         }),
//     registrationDeadline: z
//         .string()
//         .nonempty('Registration deadline is required')
//         .refine((val) => !isNaN(Date.parse(val)), {
//             message: 'Invalid date format',
//         }),
//     isActive: z.boolean().optional().default(true),
//     link: z.string().url().optional(),

//     facebookSecretGroup: z.string().url().optional(),
//     whatsappSecretGroup: z.string().url().optional(),
//     messengerSecretGroup: z.string().url().optional(),
//     facebookPublicGroup: z.string().url().optional(),
//     whatsappPublicGroup: z.string().url().optional(),
//     telegramGroup: z.string().url().optional(),
// });

// export const updateSeminarDto = createSeminarDto.partial();

// export const registerParticipantDto = z
//     .object({
//         name: z.string().nonempty('Name is required'),
//         email: z.string().email('Invalid email').optional(),
//         phone: z.string().optional(),
//         whatsapp: z.string().optional(),
//         occupation: z.string().optional(),
//         address: z.string().optional(),
//     })
//     .refine((data) => data.email || data.phone || data.whatsapp, {
//         message: 'At least one contact detail (email, phone, or whatsapp) is required',
//         path: ['email', 'phone', 'whatsapp'],
//     });

// export type CreateSeminarDto = z.infer<typeof createSeminarDto>;
// export type UpdateSeminarDto = z.infer<typeof updateSeminarDto>;
// export type RegisterParticipantDto = z.infer<typeof registerParticipantDto>;

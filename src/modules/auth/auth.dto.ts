import z from 'zod';

export const phoneRegex = /^(01[3-9]\d{8}|8801[3-9]\d{8}|\+8801[3-9]\d{8})$/;

export const RegisterDto = z
    .object({
        name: z
            .string({})
            .min(1, 'Name is required')
            .max(100, 'Name must not exceed 100 characters')
            .trim(),

        email: z
            .string()
            .email('Invalid email address')
            .toLowerCase()
            .trim()
            .optional()
            .or(z.literal('')),

        phone: z
            .string()
            .regex(phoneRegex, 'Invalid Bangladesh phone number format')
            .trim()
            .optional()
            .or(z.literal('')),

        password: z
            .string({})
            .min(6, 'Password must be at least 6 characters')
            .max(100, 'Password must not exceed 100 characters'),

        batchNumber: z.string({}).min(1, 'Batch number is required').trim(),
    })
    .refine((data) => data.email || data.phone, {
        message: 'Either email or phone number must be provided',
        path: ['email'],
    })
    .refine((data) => !(data.email && data.phone), {
        message: 'Please provide either email OR phone, not both',
        path: ['email'],
    });

export enum WebsiteEnum {
    _ADMIN = 'admin',
    _CLIENT = 'client',
}

export const LoginDto = z
    .object({
        website: z.nativeEnum(WebsiteEnum),
        identifier: z.string({}).min(1, 'Email or phone is required').trim(),
        password: z
            .string({})
            .min(6, 'Password must be at least 6 characters')
            .max(100, 'Password must not exceed 100 characters'),
    })
    .refine(
        (data) => {
            const isEmail = z.string().email().safeParse(data.identifier).success;
            const isPhone = phoneRegex.test(data.identifier);
            return isEmail || isPhone;
        },
        {
            message: 'Please provide a valid email or Bangladesh phone number',
            path: ['identifier'],
        },
    );

export type IRegisterDto = z.infer<typeof RegisterDto>;
export type ILoginDto = z.infer<typeof LoginDto>;

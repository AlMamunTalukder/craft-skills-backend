import z from 'zod';

export const phoneRegex = /^(\+880|880)?1[3-9]\d{8}$/;

export const RegisterDto = z
    .object({
        firstName: z
            .string({})
            .min(1, 'First name is required')
            .max(50, 'First name must not exceed 50 characters')
            .trim(),

        lastName: z
            .string({})
            .min(1, 'Last name is required')
            .max(50, 'Last name must not exceed 50 characters')
            .trim(),

        password: z
            .string({})
            .min(6, 'Password must be at least 6 characters')
            .max(100, 'Password must not exceed 100 characters')
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                'Password must contain at least one uppercase letter, one lowercase letter, and one number',
            ),

        email: z
            .string()
            .email('Invalid email address')
            .toLowerCase()
            .trim()
            .optional()
            .or(z.literal('')),

        phone: z
            .string()
            .regex(phoneRegex, 'Invalid phone number format')
            .trim()
            .optional()
            .or(z.literal('')),
    })
    .refine((data) => data.email || data.phone, {
        message: 'Either email or phone number must be provided',
        path: ['email'],
    })
    .refine(
        (data) => {
            if (data.email && data.email.trim() === '') return false;
            if (data.phone && data.phone.trim() === '') return false;
            return true;
        },
        {
            message: 'Email or phone cannot be empty',
            path: ['email'],
        },
    );

enum WebsiteEnum {
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
            message: 'Please provide a valid email or phone number',
            path: ['identifier'],
        },
    );

export type IRegisterDto = z.infer<typeof RegisterDto>;
export type ILoginDto = z.infer<typeof LoginDto>;

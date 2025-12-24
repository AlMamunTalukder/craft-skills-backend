// import z from 'zod';
// import { phoneRegex } from '../auth/auth.dto';

// export const createUserDto = z
//     .object({
//         firstName: z
//             .string({})
//             .min(1, 'First name is required')
//             .max(50, 'First name must not exceed 50 characters')
//             .trim(),

//         lastName: z
//             .string({})
//             .min(1, 'Last name is required')
//             .max(50, 'Last name must not exceed 50 characters')
//             .trim(),

//         password: z
//             .string({})
//             .min(6, 'Password must be at least 6 characters')
//             .max(100, 'Password must not exceed 100 characters')
//             .regex(
//                 /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
//                 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
//             ),

//         email: z
//             .string()
//             .email('Invalid email address')
//             .toLowerCase()
//             .trim()
//             .optional()
//             .or(z.literal('')),

//         phone: z
//             .string()
//             .regex(phoneRegex, 'Invalid phone number format')
//             .trim()
//             .optional()
//             .or(z.literal('')),
//         role: z.enum(['student', 'admin', 'teacher']).optional(),
//     })
//     .refine((data) => data.email || data.phone, {
//         message: 'Either email or phone number must be provided',
//         path: ['email'],
//     })
//     .refine(
//         (data) => {
//             if (data.email && data.email.trim() === '') return false;
//             if (data.phone && data.phone.trim() === '') return false;
//             return true;
//         },
//         {
//             message: 'Email or phone cannot be empty',
//             path: ['email'],
//         },
//     );

// export const updateUserDto = createUserDto.partial().extend({
//     status: z.enum(['active', 'inactive', 'banned']).optional(),
//     role: z.enum(['student', 'admin', 'teacher']).optional(),
//     image: z.string().url('Invalid image URL').optional(),
// });

// export const updateProfileDto = updateUserDto.omit({ role: true, status: true });
// server/dto/user.dto.ts
import z from 'zod';
import { phoneRegex } from '../auth/auth.dto';

export const createUserDto = z
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
            .max(100, 'Password must not exceed 100 characters'),
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

        role: z.enum(['student', 'admin', 'teacher']).optional(),
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

export const updateUserDto = createUserDto.partial().extend({
    status: z.enum(['active', 'inactive', 'banned']).optional(),
    role: z.enum(['student', 'admin', 'teacher']).optional(),
    image: z.string().url('Invalid image URL').optional(),
});

export const updateProfileDto = updateUserDto.omit({ role: true, status: true });

// Add reset password DTO
export const resetPasswordDto = z
    .object({
        password: z
            .string({})
            .min(6, 'Password must be at least 6 characters')
            .max(100, 'Password must not exceed 100 characters'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    });

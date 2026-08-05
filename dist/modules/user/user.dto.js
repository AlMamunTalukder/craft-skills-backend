"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordDto = exports.updateProfileDto = exports.updateUserDto = exports.createUserDto = exports.createUserBaseSchema = void 0;
// server/dto/user.dto.ts
const zod_1 = __importDefault(require("zod"));
const auth_dto_1 = require("../auth/auth.dto");
exports.createUserBaseSchema = zod_1.default
    .object({
    name: zod_1.default
        .string({})
        .min(1, 'Name is required')
        .max(50, 'Name must not exceed 50 characters')
        .trim(),
    password: zod_1.default
        .string({})
        .min(6, 'Password must be at least 6 characters')
        .max(100, 'Password must not exceed 100 characters'),
    email: zod_1.default
        .string()
        .email('Invalid email address')
        .toLowerCase()
        .trim()
        .optional()
        .or(zod_1.default.literal('')),
    phone: zod_1.default
        .string()
        .regex(auth_dto_1.phoneRegex, 'Invalid phone number format')
        .trim()
        .optional()
        .or(zod_1.default.literal('')),
    role: zod_1.default.enum(['student', 'admin', 'teacher']).optional(),
});
exports.createUserDto = exports.createUserBaseSchema
    .refine((data) => data.email || data.phone, {
    message: 'Either email or phone number must be provided',
    path: ['email'],
})
    .refine((data) => {
    if (data.email && data.email.trim() === '')
        return false;
    if (data.phone && data.phone.trim() === '')
        return false;
    return true;
}, {
    message: 'Email or phone cannot be empty',
    path: ['email'],
});
exports.updateUserDto = exports.createUserBaseSchema.partial().extend({
    status: zod_1.default.enum(['active', 'inactive', 'banned']).optional(),
    role: zod_1.default.enum(['student', 'admin', 'teacher']).optional(),
    image: zod_1.default.string().url('Invalid image URL').optional(),
});
exports.updateProfileDto = exports.updateUserDto.omit({ role: true, status: true });
// Add reset password DTO
exports.resetPasswordDto = zod_1.default
    .object({
    password: zod_1.default
        .string({})
        .min(6, 'Password must be at least 6 characters')
        .max(100, 'Password must not exceed 100 characters'),
    confirmPassword: zod_1.default.string(),
})
    .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

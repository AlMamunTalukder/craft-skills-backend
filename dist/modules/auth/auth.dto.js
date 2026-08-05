"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginDto = exports.WebsiteEnum = exports.RegisterDto = exports.phoneRegex = void 0;
const zod_1 = __importDefault(require("zod"));
exports.phoneRegex = /^(01[3-9]\d{8}|8801[3-9]\d{8}|\+8801[3-9]\d{8})$/;
exports.RegisterDto = zod_1.default
    .object({
    name: zod_1.default
        .string({})
        .min(1, 'Name is required')
        .max(100, 'Name must not exceed 100 characters')
        .trim(),
    email: zod_1.default
        .string()
        .email('Invalid email address')
        .toLowerCase()
        .trim()
        .optional()
        .or(zod_1.default.literal('')),
    phone: zod_1.default
        .string()
        .regex(exports.phoneRegex, 'Invalid Bangladesh phone number format')
        .trim()
        .optional()
        .or(zod_1.default.literal('')),
    password: zod_1.default
        .string({})
        .min(6, 'Password must be at least 6 characters')
        .max(100, 'Password must not exceed 100 characters'),
    batchNumber: zod_1.default.string({}).min(1, 'Batch number is required').trim(),
})
    .refine((data) => data.email || data.phone, {
    message: 'Either email or phone number must be provided',
    path: ['email'],
})
    .refine((data) => !(data.email && data.phone), {
    message: 'Please provide either email OR phone, not both',
    path: ['email'],
});
var WebsiteEnum;
(function (WebsiteEnum) {
    WebsiteEnum["_ADMIN"] = "admin";
    WebsiteEnum["_CLIENT"] = "client";
})(WebsiteEnum || (exports.WebsiteEnum = WebsiteEnum = {}));
exports.LoginDto = zod_1.default
    .object({
    website: zod_1.default.nativeEnum(WebsiteEnum),
    identifier: zod_1.default.string({}).min(1, 'Email or phone is required').trim(),
    password: zod_1.default
        .string({})
        .min(6, 'Password must be at least 6 characters')
        .max(100, 'Password must not exceed 100 characters'),
})
    .refine((data) => {
    const isEmail = zod_1.default.string().email().safeParse(data.identifier).success;
    const isPhone = exports.phoneRegex.test(data.identifier);
    return isEmail || isPhone;
}, {
    message: 'Please provide a valid email or Bangladesh phone number',
    path: ['identifier'],
});

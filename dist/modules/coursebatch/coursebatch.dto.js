"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBatchDto = exports.createBatchDto = void 0;
// server/dto/coursebatch.dto.ts
const zod_1 = require("zod");
exports.createBatchDto = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Batch name is required'),
    code: zod_1.z.string().min(1, 'Batch code is required'),
    description: zod_1.z.string().optional(),
    registrationStart: zod_1.z
        .string()
        .min(1, 'Registration start date is required')
        .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date format',
    }),
    registrationEnd: zod_1.z
        .string()
        .min(1, 'Registration end date is required')
        .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date format',
    }),
    isActive: zod_1.z.boolean().optional().default(false),
    facebookSecretGroup: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    messengerSecretGroup: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
});
exports.updateBatchDto = exports.createBatchDto.partial();

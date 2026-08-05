"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exclusiveGiftDto = void 0;
const zod_1 = require("zod");
exports.exclusiveGiftDto = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    email: zod_1.z.string().email('Invalid email').optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().min(11, 'Phone must be at least 11 digits'),
    whatsapp: zod_1.z.string().optional(),
    occupation: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    batchId: zod_1.z.string().min(1, 'Batch ID is required'),
});

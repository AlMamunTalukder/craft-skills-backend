"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateExclusiveBatchDto = exports.createExclusiveBatchDto = void 0;
const zod_1 = require("zod");
exports.createExclusiveBatchDto = zod_1.z.object({
    batchNo: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]),
    title: zod_1.z.string().min(1, 'Title is required'),
    description: zod_1.z.string().optional(),
    date: zod_1.z.string().datetime(),
    registrationDeadline: zod_1.z.string().datetime(),
    isActive: zod_1.z.boolean().optional().default(true),
    offerPrice: zod_1.z.number().default(199),
    regularPrice: zod_1.z.number().default(5500),
    whatsappGroupLink: zod_1.z.string().url('Invalid WhatsApp group link').or(zod_1.z.literal('')).optional(),
});
exports.updateExclusiveBatchDto = exports.createExclusiveBatchDto.partial();

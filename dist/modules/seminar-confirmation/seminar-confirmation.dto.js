"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seminarConfirmationDto = void 0;
// server/dto/seminar-confirmation.dto.ts
const zod_1 = require("zod");
exports.seminarConfirmationDto = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    email: zod_1.z.string().email('Invalid email').optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().min(11, 'Phone must be at least 11 digits'),
    whatsapp: zod_1.z.string().optional(),
    occupation: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    seminarId: zod_1.z.string().min(1, 'Seminar ID is required'),
});

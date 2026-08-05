"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateParticipantAdminDto = exports.createParticipantAdminDto = exports.registerExclusiveOfferDto = void 0;
const zod_1 = require("zod");
const mongoose_1 = __importDefault(require("mongoose"));
exports.registerExclusiveOfferDto = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    email: zod_1.z.string().email('Invalid email').optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().min(11, 'Valid phone number is required'),
    whatsapp: zod_1.z.string().optional(),
    occupation: zod_1.z.string().optional(),
    visitorId: zod_1.z.string().optional(),
    batchId: zod_1.z.string().optional(),
});
// 🔐 Admin DTO for creating participants (strict validation, no payment fields)
exports.createParticipantAdminDto = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
    email: zod_1.z.string().email('Invalid email').optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().regex(/^(\+880|0088|880|01)\d{9,10}$/, 'Invalid BD phone number'),
    whatsapp: zod_1.z.string().optional(),
    occupation: zod_1.z.string().max(100).optional(),
    batchId: zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), 'Invalid batch ID'),
    // EXPLICITLY EXCLUDE: paymentStatus, price, transactionId, sslValidationId, paymentMethod
});
// 🔐 Admin DTO for updating participants (safe update, blocks payment fields)
exports.updateParticipantAdminDto = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().optional(),
    whatsapp: zod_1.z.string().optional(),
    occupation: zod_1.z.string().max(100).optional(),
    batchId: zod_1.z
        .string()
        .refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), 'Invalid batch ID')
        .optional(),
    // EXPLICITLY EXCLUDE: paymentStatus, price, transactionId, sslValidationId, paymentMethod
});

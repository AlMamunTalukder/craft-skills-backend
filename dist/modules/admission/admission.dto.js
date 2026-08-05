"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAdmissionDto = exports.createAdmissionDto = void 0;
const zod_1 = require("zod");
exports.createAdmissionDto = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    email: zod_1.z.string().email('Invalid email').optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().min(1, 'Phone is required'),
    whatsapp: zod_1.z.string().optional(),
    facebook: zod_1.z.string().optional(),
    courseId: zod_1.z.string().min(1, 'Course is required'),
    batchId: zod_1.z.string().min(1, 'Batch is required'),
    paymentMethod: zod_1.z.string().optional(),
    senderNumber: zod_1.z.string().optional(),
    couponCode: zod_1.z.string().optional(),
    amount: zod_1.z.number().optional(),
    notes: zod_1.z.string().optional(),
    status: zod_1.z.enum(['pending', 'approved', 'rejected', 'waitlisted']).optional().default('pending'),
    paymentStatus: zod_1.z
        .enum(['pending', 'partial', 'paid', 'cancelled'])
        .optional()
        .default('pending'),
    // ✅ CORRECTED: Boolean validation with required error
    agreedToTerms: zod_1.z.boolean().refine((val) => val === true, {
        message: 'You must agree to the Terms & Conditions, Privacy Policy, and Refund Policy',
    }),
});
exports.updateAdmissionDto = exports.createAdmissionDto.partial();

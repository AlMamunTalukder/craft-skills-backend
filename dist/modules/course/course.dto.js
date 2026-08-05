"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCourseDto = exports.createCourseDto = void 0;
// server/dto/course.dto.ts
const zod_1 = require("zod");
exports.createCourseDto = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Course name is required'),
    description: zod_1.z.string().optional(),
    price: zod_1.z.number().min(0, 'Price must be at least 0'),
    discount: zod_1.z.number().min(0).max(100).optional().default(0),
    paymentCharge: zod_1.z.number().min(0).optional().default(0),
});
exports.updateCourseDto = exports.createCourseDto.partial();

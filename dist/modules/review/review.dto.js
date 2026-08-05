"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReviewDto = exports.createReviewDto = void 0;
// server/dto/review.dto.ts
const zod_1 = require("zod");
exports.createReviewDto = zod_1.z.object({
    image: zod_1.z.string().min(1, 'Image is required'),
    title: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional().default(true),
});
exports.updateReviewDto = exports.createReviewDto.partial();

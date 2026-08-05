"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Course = void 0;
// server/modules/course/course.model.ts
const mongoose_1 = require("mongoose");
const CourseSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Course name is required'],
        trim: true,
    },
    description: {
        type: String,
        default: '',
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative'],
    },
    discount: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative'],
        max: [100, 'Discount cannot exceed 100%'],
    },
    paymentCharge: {
        type: Number,
        default: 0,
        min: [0, 'Payment charge cannot be negative'],
    },
}, {
    timestamps: true,
});
// Add indexes
CourseSchema.index({ name: 'text' });
CourseSchema.index({ price: 1 });
CourseSchema.index({ createdAt: -1 });
exports.Course = mongoose_1.models.Course || (0, mongoose_1.model)('Course', CourseSchema);

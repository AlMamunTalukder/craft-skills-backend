"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Review = void 0;
// server/models/review.model.ts
const mongoose_1 = require("mongoose");
const ReviewSchema = new mongoose_1.Schema({
    image: {
        type: String,
        required: [true, 'Image is required'],
        trim: true,
    },
    title: {
        type: String,
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
exports.Review = mongoose_1.models.Review || (0, mongoose_1.model)('Review', ReviewSchema);

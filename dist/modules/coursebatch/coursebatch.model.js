"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseBatch = void 0;
// src/modules/coursebatch/coursebatch.model.ts
const mongoose_1 = require("mongoose");
const CourseBatchSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Batch name is required'],
    },
    code: {
        type: String,
        required: [true, 'Batch code is required'],
        unique: true,
    },
    description: { type: String },
    registrationStart: {
        type: Date,
        required: [true, 'Registration start date is required'],
    },
    registrationEnd: {
        type: Date,
        required: [true, 'Registration end date is required'],
    },
    isActive: {
        type: Boolean,
        default: false,
    },
    facebookSecretGroup: {
        type: String,
        default: '',
    },
    messengerSecretGroup: {
        type: String,
        default: '',
    },
}, {
    timestamps: true,
});
// Add indexes
CourseBatchSchema.index({ isActive: 1 });
CourseBatchSchema.index({ registrationStart: 1 });
// CourseBatchSchema.index({ code: 1 }, { unique: true });
// CORRECT EXPORT
exports.CourseBatch = mongoose_1.models.CourseBatch || (0, mongoose_1.model)('CourseBatch', CourseBatchSchema);
exports.default = exports.CourseBatch;

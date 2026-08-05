"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Schedule = void 0;
const mongoose_1 = require("mongoose");
// Sub-schema for individual class
const scheduleItemSchema = new mongoose_1.Schema({
    className: { type: String, required: true },
    days: { type: String, required: true },
    time: { type: String, required: true },
});
// Main schedule schema
// In schedule.model.ts
const scheduleSchema = new mongoose_1.Schema({
    weekNumber: { type: Number, required: true },
    schedules: {
        type: [
            {
                className: { type: String, required: true },
                days: { type: String, required: true },
                time: { type: String, required: true },
            },
        ],
        required: true,
        default: [],
    },
    holidays: { type: String },
    isActive: { type: Boolean, default: true }, // Add this field
}, { timestamps: true });
exports.Schedule = (0, mongoose_1.model)('Schedule', scheduleSchema);

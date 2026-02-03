import { Schema, model } from 'mongoose';

// Sub-schema for individual class
const scheduleItemSchema = new Schema({
    className: { type: String, required: true },
    days: { type: String, required: true },
    time: { type: String, required: true },
});

// Main schedule schema
// In schedule.model.ts
const scheduleSchema = new Schema(
    {
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
    },
    { timestamps: true },
);

export const Schedule = model('Schedule', scheduleSchema);

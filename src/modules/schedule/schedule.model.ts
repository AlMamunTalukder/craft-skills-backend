import { Schema, model } from 'mongoose';
import type { ISchedule } from './schedule.interface';

const scheduleSchema = new Schema<ISchedule>(
    {
        className: { type: String, required: true },
        days: { type: String, required: true },
        time: { type: String, required: true },
        holidays: { type: String },
    },
    { timestamps: true },
);

export const Schedule = model<ISchedule>('Schedule', scheduleSchema);

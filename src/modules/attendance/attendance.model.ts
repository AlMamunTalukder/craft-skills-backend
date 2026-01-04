import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export interface IAttendance extends Document {
    className: string;
    studentId: mongoose.Types.ObjectId;
    batchId: string;
    attendanceType: 'main' | 'special' | 'guest';
    sessionType: string;
    attended: boolean;
    date: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
    {
        className: { type: String, required: true },
        studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        batchId: { type: String, required: true },
        attendanceType: { type: String, enum: ['main', 'special', 'guest'], required: true },
        sessionType: { type: String, required: true },
        attended: { type: Boolean, default: false },
        date: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
    },
);

// Prevent duplicate attendance entries
AttendanceSchema.index(
    {
        studentId: 1,
        className: 1,
        sessionType: 1,
        date: 1,
    },
    { unique: true },
);

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);

// import type { Document } from 'mongoose';
// import mongoose, { Schema } from 'mongoose';

// export interface IAttendance extends Document {
//     className: string;
//     studentId: mongoose.Types.ObjectId;
//     batchId: string;
//     attendanceType: 'main' | 'special' | 'guest';
//     sessionType: string;
//     attended: boolean;
//     date: Date;
// }

// const AttendanceSchema = new Schema<IAttendance>(
//     {
//         className: { type: String, required: true },
//         studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
//         batchId: { type: String, required: true },
//         attendanceType: { type: String, enum: ['main', 'special', 'guest'], required: true },
//         sessionType: { type: String, required: true },
//         attended: { type: Boolean, default: false },
//         date: { type: Date, default: Date.now },
//     },
//     {
//         timestamps: true,
//     },
// );

// // Prevent duplicate attendance entries
// AttendanceSchema.index(
//     {
//         studentId: 1,
//         className: 1,
//         sessionType: 1,
//         date: 1,
//     },
//     { unique: true },
// );

// export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);
//
// src/models/attendance.model.ts
import { Schema, model, models } from 'mongoose';
import type { Document } from 'mongoose';

export interface IAttendance extends Document {
    studentId: Schema.Types.ObjectId;
    batchId: string;
    className: string;
    sessionType: 'regular' | 'problemSolving' | 'practice';
    attended: boolean;
    date: Date;
    markedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
    {
        studentId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        batchId: {
            type: String,
            required: true,
        },
        className: {
            type: String,
            required: true,
        },
        sessionType: {
            type: String,
            enum: ['regular', 'problemSolving', 'practice', 'special', 'guest'],
            required: true,
        },
        attended: {
            type: Boolean,
            default: false,
        },
        date: {
            type: Date,
            required: true,
            default: Date.now,
        },
        markedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    },
);

// Make sure this index doesn't cause conflicts
attendanceSchema.index({ studentId: 1, className: 1, sessionType: 1, date: 1 }, { unique: true });

export const Attendance = models.Attendance || model<IAttendance>('Attendance', attendanceSchema);
export default Attendance;

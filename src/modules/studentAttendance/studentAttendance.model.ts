// server/models/studentAttendance.model.ts
import { Schema, model, models } from 'mongoose';
import type { Document } from 'mongoose';

export interface IStudentAttendance extends Document {
    studentId: Schema.Types.ObjectId;
    attendanceRoutineId: Schema.Types.ObjectId;
    batchId: Schema.Types.ObjectId;
    attendanceData: {
        mainClasses?: any[];
        guestClasses?: any[];
        specialClasses?: any[];
        metadata: {
            totalMainSessions: number;
            totalGuestSessions: number;
            totalSpecialSessions: number;
            totalPresent: number;
            totalSessions: number;
            attendanceRate: number;
            submittedAt: Date;
            submittedDate: string;
            updatedAt?: Date;
        };
    };
    createdAt: Date;
    updatedAt: Date;
}

const StudentAttendanceSchema = new Schema<IStudentAttendance>(
    {
        studentId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Student ID is required'],
        },
        attendanceRoutineId: {
            type: Schema.Types.ObjectId,
            ref: 'Attendance',
            required: [true, 'Attendance routine ID is required'],
        },
        batchId: {
            type: Schema.Types.ObjectId,
            ref: 'CourseBatch',
            required: [true, 'Batch ID is required'],
        },
        attendanceData: {
            type: Schema.Types.Mixed,
            required: [true, 'Attendance data is required'],
        },
    },
    {
        timestamps: true,
    },
);

// Compound index for unique attendance per student per routine per batch
StudentAttendanceSchema.index(
    { studentId: 1, attendanceRoutineId: 1, batchId: 1 },
    { unique: true },
);

// Indexes for faster queries
StudentAttendanceSchema.index({ studentId: 1 });
StudentAttendanceSchema.index({ batchId: 1 });
StudentAttendanceSchema.index({ attendanceRoutineId: 1 });
StudentAttendanceSchema.index({ createdAt: -1 });

export const StudentAttendance =
    models.StudentAttendance ||
    model<IStudentAttendance>('StudentAttendance', StudentAttendanceSchema);

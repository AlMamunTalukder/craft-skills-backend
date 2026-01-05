// src/modules/studentAttendance/studentAttendance.model.ts
import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export interface IStudentAttendance extends Document {
    studentId: mongoose.Types.ObjectId;
    batchId: string;
    attendanceRoutineId?: mongoose.Types.ObjectId;

    // Main Classes
    mainClasses: Map<
        string,
        {
            regular: boolean;
            problemSolving: boolean;
            practice: boolean;
            lastUpdated: Date;
        }
    >;

    // Special Classes
    specialClasses: Map<
        string,
        {
            attended: boolean;
            lastUpdated: Date;
        }
    >;

    // Guest Classes
    guestClasses: Map<
        string,
        {
            attended: boolean;
            guestName?: string;
            lastUpdated: Date;
        }
    >;

    // Statistics
    statistics: {
        main: { attended: number; total: number; percentage: number };
        special: { attended: number; total: number; percentage: number };
        guest: { attended: number; total: number; percentage: number };
        overall: { attended: number; total: number; percentage: number };
        lastUpdated: Date;
    };

    createdAt: Date;
    updatedAt: Date;
}

const StudentAttendanceSchema = new Schema<IStudentAttendance>(
    {
        studentId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        batchId: {
            type: String,
            required: true,
            index: true,
        },
        attendanceRoutineId: {
            type: Schema.Types.ObjectId,
            ref: 'AttendanceRoutine',
            default: null,
        },

        // Main Classes (15 classes)
        mainClasses: {
            type: Map,
            of: new Schema({
                regular: { type: Boolean, default: false },
                problemSolving: { type: Boolean, default: false },
                practice: { type: Boolean, default: false },
                lastUpdated: { type: Date, default: Date.now },
            }),
            default: () => {
                const mainClasses = new Map();
                for (let i = 1; i <= 15; i++) {
                    mainClasses.set(`Class ${i}`, {
                        regular: false,
                        problemSolving: false,
                        practice: false,
                        lastUpdated: new Date(),
                    });
                }
                return mainClasses;
            },
        },

        // Special Classes (5 classes)
        specialClasses: {
            type: Map,
            of: new Schema({
                attended: { type: Boolean, default: false },
                lastUpdated: { type: Date, default: Date.now },
            }),
            default: () => {
                const specialClasses = new Map();
                for (let i = 1; i <= 5; i++) {
                    specialClasses.set(`Special Class ${i}`, {
                        attended: false,
                        lastUpdated: new Date(),
                    });
                }
                return specialClasses;
            },
        },

        // Guest Classes (5 classes)
        guestClasses: {
            type: Map,
            of: new Schema({
                attended: { type: Boolean, default: false },
                guestName: { type: String, default: 'Guest Speaker' },
                lastUpdated: { type: Date, default: Date.now },
            }),
            default: () => {
                const guestClasses = new Map();
                for (let i = 1; i <= 5; i++) {
                    guestClasses.set(`Guest Class ${i}`, {
                        attended: false,
                        guestName: `Guest Speaker ${i}`,
                        lastUpdated: new Date(),
                    });
                }
                return guestClasses;
            },
        },

        // Statistics
        statistics: {
            type: {
                main: {
                    attended: { type: Number, default: 0 },
                    total: { type: Number, default: 45 },
                    percentage: { type: Number, default: 0 },
                },
                special: {
                    attended: { type: Number, default: 0 },
                    total: { type: Number, default: 5 },
                    percentage: { type: Number, default: 0 },
                },
                guest: {
                    attended: { type: Number, default: 0 },
                    total: { type: Number, default: 5 },
                    percentage: { type: Number, default: 0 },
                },
                overall: {
                    attended: { type: Number, default: 0 },
                    total: { type: Number, default: 55 },
                    percentage: { type: Number, default: 0 },
                },
                lastUpdated: { type: Date, default: Date.now },
            },
            default: () => ({
                main: { attended: 0, total: 45, percentage: 0 },
                special: { attended: 0, total: 5, percentage: 0 },
                guest: { attended: 0, total: 5, percentage: 0 },
                overall: { attended: 0, total: 55, percentage: 0 },
                lastUpdated: new Date(),
            }),
        },
    },
    {
        timestamps: true,
    },
);

// FIX: Use studentId + batchId as unique index instead of studentId + attendanceRoutineId
StudentAttendanceSchema.index({ studentId: 1, batchId: 1 }, { unique: true });

export default mongoose.models?.StudentAttendance ||
    mongoose.model<IStudentAttendance>('StudentAttendance', StudentAttendanceSchema);

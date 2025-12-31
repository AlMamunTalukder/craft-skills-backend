// server/models/attendance.model.ts
import { Schema, model, models } from 'mongoose';
import type { Document } from 'mongoose';

export enum AttendanceType {
    MAIN = 'main',
    SPECIAL = 'special',
    GUEST = 'guest',
}

export enum AttendanceSessionType {
    MAIN_CLASS = 'main_class',
    PROBLEM_SOLVING = 'problem_solving',
    PRACTICE = 'practice',
}

export interface IAttendanceClass {
    className: string;
    type: AttendanceType;
    guestName?: string;
    sessions: {
        type: AttendanceSessionType;
        name: string;
        date?: Date;
        attended?: boolean;
    }[];
}

export interface IAttendance extends Document {
    batchId: string;
    batchCode: string;
    totalClasses: number;
    classes: IAttendanceClass[];
    mainClasses: number;
    specialClasses: number;
    guestClasses: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
    {
        batchId: {
            type: String,
            required: [true, 'Batch ID is required'],
        },
        batchCode: {
            type: String,
            required: [true, 'Batch code is required'],
        },
        totalClasses: {
            type: Number,
            required: [true, 'Total classes is required'],
            min: [1, 'At least one class is required'],
        },
        classes: [
            {
                className: {
                    type: String,
                    required: [true, 'Class name is required'],
                },
                type: {
                    type: String,
                    enum: Object.values(AttendanceType),
                    required: [true, 'Class type is required'],
                },
                guestName: {
                    type: String,
                },
                sessions: [
                    {
                        type: {
                            type: String,
                            enum: Object.values(AttendanceSessionType),
                            required: [true, 'Session type is required'],
                        },
                        name: {
                            type: String,
                            required: [true, 'Session name is required'],
                        },
                        date: {
                            type: Date,
                        },
                        attended: {
                            type: Boolean,
                            default: false,
                        },
                    },
                ],
            },
        ],
        mainClasses: {
            type: Number,
            default: 0,
        },
        specialClasses: {
            type: Number,
            default: 0,
        },
        guestClasses: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    },
);

// Auto-calculate class counts before saving
AttendanceSchema.pre('save', function (next) {
    const mainClasses = this.classes.filter((c) => c.type === AttendanceType.MAIN).length;
    const specialClasses = this.classes.filter((c) => c.type === AttendanceType.SPECIAL).length;
    const guestClasses = this.classes.filter((c) => c.type === AttendanceType.GUEST).length;

    this.mainClasses = mainClasses;
    this.specialClasses = specialClasses;
    this.guestClasses = guestClasses;
    this.totalClasses = mainClasses + specialClasses + guestClasses;

    next();
});

export const Attendance = models.Attendance || model<IAttendance>('Attendance', AttendanceSchema);
export default Attendance;

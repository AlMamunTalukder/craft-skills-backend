// server/services/studentAttendance.service.ts
import Attendance, { AttendanceType } from '../attendance/attendance.model';
import { CourseBatch } from '../coursebatch/coursebatch.model';
import { User } from '../user/user.model';
import { StudentAttendance } from './studentAttendance.model';
import type { Types } from 'mongoose';

interface SaveAttendanceDto {
    studentId: string;
    attendanceRoutineId: string;
    attendanceData: any;
    batchId: string;
    attendanceType: 'mainClasses' | 'guestClasses' | 'specialClasses';
}

interface BatchInfo {
    id: string;
    name: string;
    code: string;
    description: string;
    isActive: boolean;
    admissionStatus: string;
    paymentStatus: string;
    enrolledAt: Date;
}

// Type definitions for Mongoose lean results
interface LeanUser {
    _id: Types.ObjectId;
    batches?: Array<{
        batchId:
            | Types.ObjectId
            | {
                  _id: Types.ObjectId;
                  name?: string;
                  code?: string;
                  description?: string;
                  isActive?: boolean;
              };
        batchCode: string;
        admissionId: Types.ObjectId;
        isActive: boolean;
        enrolledAt: Date;
    }>;
}

interface LeanBatch {
    _id: Types.ObjectId;
    name?: string;
    code?: string;
    description?: string;
    isActive?: boolean;
}

interface LeanAttendance {
    _id: Types.ObjectId;
    attendanceData?: {
        metadata?: {
            totalSessions?: number;
            totalPresent?: number;
            totalMainSessions?: number;
            totalGuestSessions?: number;
            totalSpecialSessions?: number;
        };
        mainClasses?: any[];
        guestClasses?: any[];
        specialClasses?: any[];
    };
}

// Get student's batches - FIXED with proper type casting
export const getStudentBatches = async (studentId: string): Promise<BatchInfo[]> => {
    try {
        const user = await User.findById(studentId).lean<LeanUser>();

        if (!user || !user.batches) {
            return [];
        }

        const batches: BatchInfo[] = [];

        // Process each batch
        for (const batch of user.batches) {
            if (!batch.isActive) continue;

            try {
                // Get batch info with proper type casting
                const batchDoc = await CourseBatch.findById(batch.batchId).lean<LeanBatch>();

                if (!batchDoc) continue;

                // Get the actual batch object (could be ObjectId or populated object)
                const batchObj = batch.batchId;
                const isPopulated =
                    typeof batchObj === 'object' && batchObj !== null && '_id' in batchObj;

                batches.push({
                    id: batchDoc._id.toString(),
                    name: batchDoc.name || 'Unknown Batch',
                    code: batch.batchCode || batchDoc.code || '',
                    description: batchDoc.description || '',
                    isActive: batchDoc.isActive || false,
                    admissionStatus: 'approved', // Default - update with actual data
                    paymentStatus: 'paid', // Default - update with actual data
                    enrolledAt: batch.enrolledAt || new Date(),
                });
            } catch (error) {
                console.error('Error processing batch:', error);
                continue;
            }
        }

        return batches;
    } catch (error) {
        console.error('Error fetching student batches:', error);
        throw new Error('Failed to fetch student batches');
    }
};

// Get attendance routines for a specific batch
export const getAttendanceRoutines = async (batchId: string, type?: string) => {
    try {
        const query: any = {
            batchId: batchId,
            isActive: true,
        };

        if (type) {
            const attendanceTypeMap: Record<string, AttendanceType> = {
                main: AttendanceType.MAIN,
                guest: AttendanceType.GUEST,
                special: AttendanceType.SPECIAL,
            };

            const targetType = attendanceTypeMap[type];
            if (targetType) {
                query['classes.type'] = targetType;
            }
        }

        return await Attendance.find(query).lean().exec();
    } catch (error) {
        console.error('Error fetching attendance routines:', error);
        throw new Error('Failed to fetch attendance routines');
    }
};

// Get student's saved attendance for a batch
export const getStudentAttendance = async (studentId: string, batchId: string) => {
    try {
        return await StudentAttendance.find({
            studentId: studentId,
            batchId: batchId,
        })
            .populate('attendanceRoutineId')
            .sort({ updatedAt: -1 })
            .lean()
            .exec();
    } catch (error) {
        console.error('Error fetching student attendance:', error);
        throw new Error('Failed to fetch student attendance');
    }
};

// Save student attendance
export const saveStudentAttendance = async (data: SaveAttendanceDto) => {
    try {
        const { studentId, attendanceRoutineId, attendanceData, batchId, attendanceType } = data;

        // Check if student is enrolled
        const user = await User.findOne({
            _id: studentId,
            'batches.batchId': batchId,
            'batches.isActive': true,
        }).lean();

        if (!user) {
            throw new Error('Student is not enrolled in this batch');
        }

        // Check attendance routine
        const routine = await Attendance.findOne({
            _id: attendanceRoutineId,
            batchId: batchId,
            isActive: true,
        }).lean();

        if (!routine) {
            throw new Error('Attendance routine not found or inactive');
        }

        // Get or create attendance record
        const existingAttendance = await StudentAttendance.findOne({
            studentId: studentId,
            attendanceRoutineId: attendanceRoutineId,
            batchId: batchId,
        });

        const now = new Date();
        const today = now.toISOString().split('T')[0];

        let finalData: any = existingAttendance?.attendanceData || {
            mainClasses: [],
            guestClasses: [],
            specialClasses: [],
            metadata: {
                totalMainSessions: 0,
                totalGuestSessions: 0,
                totalSpecialSessions: 0,
                totalPresent: 0,
                totalSessions: 0,
                attendanceRate: 0,
                submittedAt: now,
                submittedDate: today,
            },
        };

        // Update the specific attendance type
        finalData[attendanceType] = attendanceData;

        // Recalculate stats
        let totalSessions = 0;
        let totalPresent = 0;
        let totalMain = 0;
        let totalGuest = 0;
        let totalSpecial = 0;

        ['mainClasses', 'guestClasses', 'specialClasses'].forEach((type) => {
            if (Array.isArray(finalData[type])) {
                finalData[type].forEach((classItem: any) => {
                    if (classItem.sessions) {
                        const sessions = classItem.sessions.length;
                        const present = classItem.sessions.filter(
                            (s: any) => s.attendance?.present,
                        ).length;

                        totalSessions += sessions;
                        totalPresent += present;

                        if (type === 'mainClasses') totalMain += sessions;
                        else if (type === 'guestClasses') totalGuest += sessions;
                        else if (type === 'specialClasses') totalSpecial += sessions;
                    }
                });
            }
        });

        const attendanceRate = totalSessions > 0 ? (totalPresent / totalSessions) * 100 : 0;

        // Update metadata
        finalData.metadata = {
            totalMainSessions: totalMain,
            totalGuestSessions: totalGuest,
            totalSpecialSessions: totalSpecial,
            totalPresent,
            totalSessions,
            attendanceRate,
            submittedAt: now,
            submittedDate: today,
            updatedAt: now,
        };

        // Save attendance
        return await StudentAttendance.findOneAndUpdate(
            {
                studentId: studentId,
                attendanceRoutineId: attendanceRoutineId,
                batchId: batchId,
            },
            {
                studentId,
                attendanceRoutineId,
                batchId,
                attendanceData: finalData,
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
            },
        );
    } catch (error) {
        console.error('Error saving student attendance:', error);
        throw new Error('Failed to save student attendance');
    }
};

// Get attendance statistics - FIXED with proper type casting
export const getAttendanceStats = async (studentId: string, batchId: string) => {
    try {
        const attendance = await StudentAttendance.findOne({
            studentId: studentId,
            batchId: batchId,
        })
            .sort({ updatedAt: -1 })
            .lean<LeanAttendance>();

        let totalSessions = 0;
        let attendedSessions = 0;
        let mainRate = 0;
        let guestRate = 0;
        let specialRate = 0;
        let metadata: any = {};

        // Type-safe check for attendance data
        if (attendance?.attendanceData?.metadata) {
            const attendanceData = attendance.attendanceData;
            metadata = attendanceData.metadata || {};
            totalSessions = metadata.totalSessions || 0;
            attendedSessions = metadata.totalPresent || 0;

            // Calculate rates
            const mainTotal = metadata.totalMainSessions || 0;
            const guestTotal = metadata.totalGuestSessions || 0;
            const specialTotal = metadata.totalSpecialSessions || 0;

            const mainClasses = attendanceData.mainClasses || [];
            const guestClasses = attendanceData.guestClasses || [];
            const specialClasses = attendanceData.specialClasses || [];

            const mainPresent = mainClasses.reduce(
                (sum: number, cls: any) =>
                    sum + (cls.sessions?.filter((s: any) => s.attendance?.present).length || 0),
                0,
            );

            const guestPresent = guestClasses.reduce(
                (sum: number, cls: any) =>
                    sum + (cls.sessions?.filter((s: any) => s.attendance?.present).length || 0),
                0,
            );

            const specialPresent = specialClasses.reduce(
                (sum: number, cls: any) =>
                    sum + (cls.sessions?.filter((s: any) => s.attendance?.present).length || 0),
                0,
            );

            mainRate = mainTotal > 0 ? Math.round((mainPresent / mainTotal) * 100) : 0;
            guestRate = guestTotal > 0 ? Math.round((guestPresent / guestTotal) * 100) : 0;
            specialRate = specialTotal > 0 ? Math.round((specialPresent / specialTotal) * 100) : 0;
        }

        // Get batch info with proper type casting
        const batch = await CourseBatch.findById(batchId).lean<LeanBatch>();

        // Type-safe access to batch properties
        const batchName = batch?.name || 'Batch';
        const batchCode = batch?.code || '';

        return {
            overallAttendance:
                totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0,
            mainClasses: mainRate,
            guestClasses: guestRate,
            specialClasses: specialRate,
            totalSessions,
            attendedSessions,
            batchName,
            batchCode,
            statsByType: {
                main: {
                    attended: Math.round((mainRate / 100) * (metadata.totalMainSessions || 0)),
                    total: metadata.totalMainSessions || 0,
                },
                guest: {
                    attended: Math.round((guestRate / 100) * (metadata.totalGuestSessions || 0)),
                    total: metadata.totalGuestSessions || 0,
                },
                special: {
                    attended: Math.round(
                        (specialRate / 100) * (metadata.totalSpecialSessions || 0),
                    ),
                    total: metadata.totalSpecialSessions || 0,
                },
            },
        };
    } catch (error) {
        console.error('Error calculating attendance stats:', error);
        throw new Error('Failed to calculate attendance statistics');
    }
};

// Export all functions
export const studentAttendanceService = {
    getStudentBatches,
    getAttendanceRoutines,
    getStudentAttendance,
    saveStudentAttendance,
    getAttendanceStats,
};

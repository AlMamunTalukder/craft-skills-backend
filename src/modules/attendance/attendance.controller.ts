// src/modules/attendance/attendance.controller.ts
import type { Request, Response } from 'express';
import Attendance from './attendance.model';
import CourseBatch from '../coursebatch/coursebatch.model';
import { Admission } from '../admission/admission.model';
import catchAsync from 'src/utils/catchAsync';
import sendResponse from 'src/utils/sendResponse';

export const attendanceController = {
    // Get all attendances (for admin dashboard)
    getAllAttendances: catchAsync(async (req: Request, res: Response): Promise<void> => {
        const attendances = await Attendance.find()
            .populate('studentId', 'name email phone')
            .sort({ date: -1, markedAt: -1 })
            .lean();

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Attendances fetched successfully',
            data: attendances,
        });
    }),

    // Get attendances by batch code
    getAttendancesByBatch: catchAsync(async (req: Request, res: Response): Promise<void> => {
        const { batchCode } = req.params;

        const attendances = await Attendance.find({ batchId: batchCode })
            .populate('studentId', 'name email phone')
            .sort({ date: -1, markedAt: -1 })
            .lean();

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: `Attendances for batch ${batchCode} fetched successfully`,
            data: attendances,
        });
    }),

    // Get batch-wise attendance statistics for dashboard
    getBatchAttendanceStats: catchAsync(async (req: Request, res: Response): Promise<void> => {
        try {
            // Get all batches
            const batches = await CourseBatch.find({}).lean();

            const batchStats = await Promise.all(
                batches.map(async (batch: any) => {
                    const batchId = batch._id.toString();
                    const batchCode = batch.code;

                    // Get total students in this batch
                    const admissionsCount = await Admission.countDocuments({ batchId });

                    // Get attendance for this batch
                    const attendanceRecords = await Attendance.find({ batchId: batchCode }).lean();

                    // Calculate statistics
                    const stats = calculateBatchStats(attendanceRecords, admissionsCount);

                    return {
                        ...batch,
                        attendanceStats: stats,
                    };
                }),
            );

            sendResponse(res, {
                statusCode: 200,
                success: true,
                message: 'Batch attendance statistics fetched successfully',
                data: batchStats,
            });
        } catch (error: any) {
            // console.error('Error fetching batch attendance stats:', error);
            //   sendResponse(res, {
            //     statusCode: 500,
            //     success: false,
            //     message: error.message || 'Failed to fetch batch attendance statistics',
            //   });
        }
    }),

    // Get detailed batch attendance with students
    getBatchAttendanceDetails: catchAsync(async (req: Request, res: Response): Promise<void> => {
        try {
            const { batchId } = req.params;

            // Get batch details
            const batch = await CourseBatch.findById(batchId).lean();
            // if (!batch) {
            //   return sendResponse(res, {
            //     statusCode: 404,
            //     success: false,
            //     message: 'Batch not found',
            //   });
            // }

            // Get all admissions for this batch
            const admissions = await Admission.find({ batchId })
                .populate('studentId', 'name email phone')
                .lean();

            // Get attendance records for this batch using batch code
            const attendanceRecords = await Attendance.find({ batchId: (batch as any).code })
                .populate('studentId', 'name email phone')
                .lean();

            // Group attendance by student
            const studentAttendanceMap = new Map<string, any[]>();

            attendanceRecords.forEach((record) => {
                const studentId = record.studentId?._id?.toString() || record.studentId?.toString();
                if (studentId) {
                    if (!studentAttendanceMap.has(studentId)) {
                        studentAttendanceMap.set(studentId, []);
                    }
                    studentAttendanceMap.get(studentId)!.push(record);
                }
            });

            // Prepare student data with attendance
            const studentsWithAttendance = admissions.map((admission) => {
                const studentId = admission.studentId?._id?.toString();
                const studentAttendance = studentId
                    ? studentAttendanceMap.get(studentId) || []
                    : [];

                const stats = calculateStudentStats(studentAttendance);

                return {
                    ...admission,
                    attendanceStats: stats,
                    attendanceRecords: studentAttendance,
                };
            });

            // Calculate batch summary
            const batchStats = calculateBatchStats(attendanceRecords, admissions.length);

            sendResponse(res, {
                statusCode: 200,
                success: true,
                message: 'Batch attendance details fetched successfully',
                data: {
                    batch,
                    batchStats,
                    students: studentsWithAttendance,
                    totalStudents: admissions.length,
                    totalAttendanceRecords: attendanceRecords.length,
                },
            });
        } catch (error: any) {
            // console.error('Error fetching batch attendance details:', error);
            //   sendResponse(res, {
            //     statusCode: 500,
            //     success: false,
            //     message: error.message || 'Failed to fetch batch attendance details',
            //   });
        }
    }),

    // Get attendance statistics by batch
    getBatchStatistics: catchAsync(async (req: Request, res: Response): Promise<void> => {
        const { batchCode } = req.params;

        const attendances = await Attendance.find({ batchId: batchCode }).lean();

        // Calculate statistics
        const stats = {
            totalRecords: attendances.length,
            totalAttended: attendances.filter((a) => a.attended).length,
            bySessionType: {
                regular: {
                    total: attendances.filter((a) => a.sessionType === 'regular').length,
                    attended: attendances.filter((a) => a.sessionType === 'regular' && a.attended)
                        .length,
                },
                problemSolving: {
                    total: attendances.filter((a) => a.sessionType === 'problemSolving').length,
                    attended: attendances.filter(
                        (a) => a.sessionType === 'problemSolving' && a.attended,
                    ).length,
                },
                practice: {
                    total: attendances.filter((a) => a.sessionType === 'practice').length,
                    attended: attendances.filter((a) => a.sessionType === 'practice' && a.attended)
                        .length,
                },
                special: {
                    total: attendances.filter((a) => a.sessionType === 'special').length,
                    attended: attendances.filter((a) => a.sessionType === 'special' && a.attended)
                        .length,
                },
                guest: {
                    total: attendances.filter((a) => a.sessionType === 'guest').length,
                    attended: attendances.filter((a) => a.sessionType === 'guest' && a.attended)
                        .length,
                },
            },
            uniqueStudents: [...new Set(attendances.map((a) => a.studentId?.toString()))].filter(
                Boolean,
            ).length,
        };

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Batch statistics fetched successfully',
            data: stats,
        });
    }),

    // Test authentication
    testAuth: catchAsync(async (req: Request, res: Response): Promise<void> => {
        // console.log('Auth Test - Session:', req.session);
        // console.log('Auth Test - User:', req.user);
        // console.log('Auth Test - isAuthenticated:', req.isAuthenticated?.());

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Auth test',
            data: {
                authenticated: req.isAuthenticated?.(),
                user: req.user,
                sessionId: req.sessionID,
            },
        });
    }),

    // Public endpoint for batch stats (no auth required)
    getBatchAttendanceStatsPublic: catchAsync(
        async (req: Request, res: Response): Promise<void> => {
            try {
                // Get all batches
                const batches = await CourseBatch.find({}).lean();

                const batchStats = await Promise.all(
                    batches.map(async (batch: any) => {
                        const batchId = batch._id.toString();
                        const batchCode = batch.code;

                        // Get total students in this batch
                        const admissionsCount = await Admission.countDocuments({ batchId });

                        // Get attendance for this batch
                        const attendanceRecords = await Attendance.find({
                            batchId: batchCode,
                        }).lean();

                        // Calculate statistics
                        const stats = {
                            totalClasses: {
                                main: attendanceRecords.filter((a) =>
                                    ['regular', 'problemSolving', 'practice'].includes(
                                        a.sessionType,
                                    ),
                                ).length,
                                special: attendanceRecords.filter(
                                    (a) => a.sessionType === 'special',
                                ).length,
                                guest: attendanceRecords.filter((a) => a.sessionType === 'guest')
                                    .length,
                                total: attendanceRecords.length,
                            },
                            attendedClasses: {
                                main: attendanceRecords.filter(
                                    (a) =>
                                        ['regular', 'problemSolving', 'practice'].includes(
                                            a.sessionType,
                                        ) && a.attended,
                                ).length,
                                special: attendanceRecords.filter(
                                    (a) => a.sessionType === 'special' && a.attended,
                                ).length,
                                guest: attendanceRecords.filter(
                                    (a) => a.sessionType === 'guest' && a.attended,
                                ).length,
                                total: attendanceRecords.filter((a) => a.attended).length,
                            },
                            attendanceRate: {
                                main: 0,
                                special: 0,
                                guest: 0,
                                overall: 0,
                            },
                            uniqueStudents: [
                                ...new Set(attendanceRecords.map((a) => a.studentId?.toString())),
                            ].filter(Boolean).length,
                            totalStudents: admissionsCount,
                        };

                        // Calculate rates
                        stats.attendanceRate.main =
                            stats.totalClasses.main > 0
                                ? (stats.attendedClasses.main / stats.totalClasses.main) * 100
                                : 0;
                        stats.attendanceRate.special =
                            stats.totalClasses.special > 0
                                ? (stats.attendedClasses.special / stats.totalClasses.special) * 100
                                : 0;
                        stats.attendanceRate.guest =
                            stats.totalClasses.guest > 0
                                ? (stats.attendedClasses.guest / stats.totalClasses.guest) * 100
                                : 0;
                        stats.attendanceRate.overall =
                            stats.totalClasses.total > 0
                                ? (stats.attendedClasses.total / stats.totalClasses.total) * 100
                                : 0;

                        return {
                            ...batch,
                            attendanceStats: stats,
                        };
                    }),
                );

                sendResponse(res, {
                    statusCode: 200,
                    success: true,
                    message: 'Batch attendance statistics fetched successfully',
                    data: batchStats,
                });
            } catch (error: any) {
                // console.error('Error fetching batch attendance stats:', error);
                //   sendResponse(res, {
                //     statusCode: 500,
                //     success: false,
                //     message: error.message || 'Failed to fetch batch attendance statistics',
                //   });
            }
        },
    ),
};

// Helper function to calculate batch statistics
function calculateBatchStats(attendanceRecords: any[], totalStudents: number) {
    // Main classes (regular, problemSolving, practice)
    const mainClasses = attendanceRecords.filter((a) =>
        ['regular', 'problemSolving', 'practice'].includes(a.sessionType),
    );

    const specialClasses = attendanceRecords.filter((a) => a.sessionType === 'special');
    const guestClasses = attendanceRecords.filter((a) => a.sessionType === 'guest');

    const stats = {
        totalClasses: {
            main: mainClasses.length,
            special: specialClasses.length,
            guest: guestClasses.length,
            total: attendanceRecords.length,
        },
        attendedClasses: {
            main: mainClasses.filter((a) => a.attended).length,
            special: specialClasses.filter((a) => a.attended).length,
            guest: guestClasses.filter((a) => a.attended).length,
            total: attendanceRecords.filter((a) => a.attended).length,
        },
        attendanceRate: {
            main:
                mainClasses.length > 0
                    ? (mainClasses.filter((a) => a.attended).length / mainClasses.length) * 100
                    : 0,
            special:
                specialClasses.length > 0
                    ? (specialClasses.filter((a) => a.attended).length / specialClasses.length) *
                      100
                    : 0,
            guest:
                guestClasses.length > 0
                    ? (guestClasses.filter((a) => a.attended).length / guestClasses.length) * 100
                    : 0,
            overall:
                attendanceRecords.length > 0
                    ? (attendanceRecords.filter((a) => a.attended).length /
                          attendanceRecords.length) *
                      100
                    : 0,
        },
        uniqueStudents: [...new Set(attendanceRecords.map((a) => a.studentId?.toString()))].filter(
            Boolean,
        ).length,
        totalStudents,
    };

    return stats;
}

// Helper function to calculate student statistics
function calculateStudentStats(attendanceRecords: any[]) {
    const stats = {
        mainClasses: {
            regular: {
                total: attendanceRecords.filter((a) => a.sessionType === 'regular').length,
                attended: attendanceRecords.filter((a) => a.sessionType === 'regular' && a.attended)
                    .length,
            },
            problemSolving: {
                total: attendanceRecords.filter((a) => a.sessionType === 'problemSolving').length,
                attended: attendanceRecords.filter(
                    (a) => a.sessionType === 'problemSolving' && a.attended,
                ).length,
            },
            practice: {
                total: attendanceRecords.filter((a) => a.sessionType === 'practice').length,
                attended: attendanceRecords.filter(
                    (a) => a.sessionType === 'practice' && a.attended,
                ).length,
            },
            total: attendanceRecords.filter((a) =>
                ['regular', 'problemSolving', 'practice'].includes(a.sessionType),
            ).length,
            attended: attendanceRecords.filter(
                (a) =>
                    ['regular', 'problemSolving', 'practice'].includes(a.sessionType) && a.attended,
            ).length,
            rate: 0,
        },
        specialClasses: {
            total: attendanceRecords.filter((a) => a.sessionType === 'special').length,
            attended: attendanceRecords.filter((a) => a.sessionType === 'special' && a.attended)
                .length,
            rate: 0,
        },
        guestClasses: {
            total: attendanceRecords.filter((a) => a.sessionType === 'guest').length,
            attended: attendanceRecords.filter((a) => a.sessionType === 'guest' && a.attended)
                .length,
            rate: 0,
        },
        totalClasses: attendanceRecords.length,
        totalAttended: attendanceRecords.filter((a) => a.attended).length,
        overallRate: 0,
        presentations: 0,
        result: 'Pending',
    };

    // Calculate rates
    stats.mainClasses.rate =
        stats.mainClasses.total > 0
            ? (stats.mainClasses.attended / stats.mainClasses.total) * 100
            : 0;
    stats.specialClasses.rate =
        stats.specialClasses.total > 0
            ? (stats.specialClasses.attended / stats.specialClasses.total) * 100
            : 0;
    stats.guestClasses.rate =
        stats.guestClasses.total > 0
            ? (stats.guestClasses.attended / stats.guestClasses.total) * 100
            : 0;
    stats.overallRate =
        stats.totalClasses > 0 ? (stats.totalAttended / stats.totalClasses) * 100 : 0;

    // Determine result
    if (stats.overallRate >= 80) {
        stats.result = 'Excellent';
    } else if (stats.overallRate >= 60) {
        stats.result = 'Good';
    } else if (stats.overallRate >= 40) {
        stats.result = 'Average';
    } else if (stats.totalClasses > 0) {
        stats.result = 'Needs Improvement';
    } else {
        stats.result = 'No Attendance';
    }

    return stats;
}

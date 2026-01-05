// src/modules/studentAttendance/studentAttendance.controller.ts
import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import StudentAttendance from './studentAttendance.model';

export const studentAttendanceController = {
    // Get student's attendance - FIXED VERSION
    getAttendance: async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }

            const userId = user._id || user.id;
            const batchId = (req.query.batchId as string) || '36';

            // Try to find attendance by studentId and batchId
            let attendance = await StudentAttendance.findOne({
                studentId: new mongoose.Types.ObjectId(userId),
                batchId,
            });

            // If not found, try to find by studentId only
            if (!attendance) {
                attendance = await StudentAttendance.findOne({
                    studentId: new mongoose.Types.ObjectId(userId),
                });

                // If found old record without batchId, update it
                if (attendance && !attendance.batchId) {
                    attendance.batchId = batchId;
                    await attendance.save();
                }
            }

            // If still not found, create new
            if (!attendance) {
                attendance = new StudentAttendance({
                    studentId: new mongoose.Types.ObjectId(userId),
                    batchId,
                    attendanceRoutineId: null,
                });

                await attendance.save();

                return res.json({
                    success: true,
                    data: attendance,
                    message: 'New attendance record created',
                });
            }

            res.json({
                success: true,
                data: attendance,
            });
        } catch (error: any) {
            console.error('Get attendance error:', error);

            // Handle duplicate key error
            if (error.code === 11000) {
                // Try to find the existing record
                const user = (req as any).user;
                const userId = user._id || user.id;
                const batchId = (req.query.batchId as string) || '36';

                const attendance = await StudentAttendance.findOne({
                    studentId: new mongoose.Types.ObjectId(userId),
                });

                if (attendance) {
                    return res.json({
                        success: true,
                        data: attendance,
                        message: 'Found existing attendance',
                    });
                }
            }

            res.status(500).json({
                success: false,
                message: 'Failed to get attendance',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    },

    // Save main class attendance
    saveMainClass: async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const { className, sessionType, attended, batchId = '36' } = req.body;

            if (!className || !sessionType) {
                return res.status(400).json({
                    success: false,
                    message: 'ClassName and sessionType are required',
                });
            }

            console.log('Saving main class:', {
                className,
                sessionType,
                attended,
                batchId,
                userId: user._id,
            });

            // FIRST: Try to find by studentId and the provided batchId
            let attendance = await StudentAttendance.findOne({
                studentId: new mongoose.Types.ObjectId(user._id || user.id),
                batchId,
            });

            // SECOND: If not found with exact batchId, try to find by studentId only
            if (!attendance) {
                console.log(
                    `No attendance found for batch ${batchId}, searching for any attendance record...`,
                );
                attendance = await StudentAttendance.findOne({
                    studentId: new mongoose.Types.ObjectId(user._id || user.id),
                });

                // If found but with different batchId, update it
                if (attendance && attendance.batchId !== batchId) {
                    console.log(
                        `Found attendance for batch ${attendance.batchId}, updating to batch ${batchId}...`,
                    );
                    attendance.batchId = batchId;
                    await attendance.save();
                }
            }

            // THIRD: If still not found, create new
            if (!attendance) {
                console.log('Creating new attendance record...');
                attendance = new StudentAttendance({
                    studentId: new mongoose.Types.ObjectId(user._id || user.id),
                    batchId,
                });
            }

            // Update main class
            const mainClass = attendance.mainClasses.get(className);
            if (mainClass) {
                if (sessionType === 'regular') mainClass.regular = attended;
                if (sessionType === 'problemSolving') mainClass.problemSolving = attended;
                if (sessionType === 'practice') mainClass.practice = attended;
                mainClass.lastUpdated = new Date();

                attendance.mainClasses.set(className, mainClass);
            }

            // Recalculate statistics
            await recalculateStatistics(attendance);

            await attendance.save();

            console.log('Successfully saved attendance:', attendance._id);

            res.json({
                success: true,
                message: 'Main class attendance saved',
                data: attendance,
            });
        } catch (error) {
            console.error('Save main class error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to save attendance',
                // error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    },
    // saveMainClass: async (req: Request, res: Response) => {
    //     try {
    //         const user = (req as any).user;
    //         const { className, sessionType, attended, batchId = '36' } = req.body;

    //         if (!className || !sessionType) {
    //             return res.status(400).json({
    //                 success: false,
    //                 message: 'ClassName and sessionType are required',
    //             });
    //         }

    //         // Find attendance
    //         let attendance = await StudentAttendance.findOne({
    //             studentId: new mongoose.Types.ObjectId(user._id || user.id),
    //             batchId,
    //         });

    //         if (!attendance) {
    //             attendance = new StudentAttendance({
    //                 studentId: new mongoose.Types.ObjectId(user._id || user.id),
    //                 batchId,
    //                 attendanceRoutineId: null,
    //             });
    //         }

    //         // Update main class
    //         const mainClass = attendance.mainClasses.get(className) || {
    //             regular: false,
    //             problemSolving: false,
    //             practice: false,
    //             lastUpdated: new Date(),
    //         };

    //         if (sessionType === 'regular') mainClass.regular = attended;
    //         if (sessionType === 'problemSolving') mainClass.problemSolving = attended;
    //         if (sessionType === 'practice') mainClass.practice = attended;
    //         mainClass.lastUpdated = new Date();

    //         attendance.mainClasses.set(className, mainClass);

    //         // Recalculate statistics
    //         await recalculateStatistics(attendance);
    //         await attendance.save();

    //         res.json({
    //             success: true,
    //             message: 'Main class attendance saved',
    //             data: attendance,
    //         });
    //     } catch (error) {
    //         console.error('Save main class error:', error);
    //         res.status(500).json({
    //             success: false,
    //             message: 'Failed to save attendance',
    //         });
    //     }
    // },

    // Save special class attendance
    saveSpecialClass: async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const { className, attended, batchId = '36' } = req.body;

            if (!className) {
                return res.status(400).json({
                    success: false,
                    message: 'ClassName is required',
                });
            }

            let attendance = await StudentAttendance.findOne({
                studentId: new mongoose.Types.ObjectId(user._id || user.id),
                batchId,
            });

            if (!attendance) {
                attendance = new StudentAttendance({
                    studentId: new mongoose.Types.ObjectId(user._id || user.id),
                    batchId,
                    attendanceRoutineId: null,
                });
            }

            // Update special class
            const specialClass = attendance.specialClasses.get(className) || {
                attended: false,
                lastUpdated: new Date(),
            };

            specialClass.attended = attended;
            specialClass.lastUpdated = new Date();
            attendance.specialClasses.set(className, specialClass);

            await recalculateStatistics(attendance);
            await attendance.save();

            res.json({
                success: true,
                message: 'Special class attendance saved',
                data: attendance,
            });
        } catch (error) {
            console.error('Save special class error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to save attendance',
            });
        }
    },

    // Save guest class attendance
    saveGuestClass: async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const { className, attended, batchId = '36' } = req.body;

            if (!className) {
                return res.status(400).json({
                    success: false,
                    message: 'ClassName is required',
                });
            }

            let attendance = await StudentAttendance.findOne({
                studentId: new mongoose.Types.ObjectId(user._id || user.id),
                batchId,
            });

            if (!attendance) {
                attendance = new StudentAttendance({
                    studentId: new mongoose.Types.ObjectId(user._id || user.id),
                    batchId,
                    attendanceRoutineId: null,
                });
            }

            // Update guest class
            const guestClass = attendance.guestClasses.get(className) || {
                attended: false,
                guestName: `Guest Speaker ${className.split(' ')[2] || '1'}`,
                lastUpdated: new Date(),
            };

            guestClass.attended = attended;
            guestClass.lastUpdated = new Date();
            attendance.guestClasses.set(className, guestClass);

            await recalculateStatistics(attendance);
            await attendance.save();

            res.json({
                success: true,
                message: 'Guest class attendance saved',
                data: attendance,
            });
        } catch (error) {
            console.error('Save guest class error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to save attendance',
            });
        }
    },

    // Get statistics
    getStatistics: async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const batchId = (req.query.batchId as string) || '36';

            const attendance = await StudentAttendance.findOne({
                studentId: new mongoose.Types.ObjectId(user._id || user.id),
                batchId,
            });

            if (!attendance) {
                return res.json({
                    success: true,
                    data: {
                        main: { attended: 0, total: 45, percentage: 0 },
                        special: { attended: 0, total: 5, percentage: 0 },
                        guest: { attended: 0, total: 5, percentage: 0 },
                        overall: { attended: 0, total: 55, percentage: 0 },
                    },
                });
            }

            res.json({
                success: true,
                data: attendance.statistics,
            });
        } catch (error) {
            console.error('Get statistics error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get statistics',
            });
        }
    },
};

// Helper function to recalculate statistics
async function recalculateStatistics(attendance: any) {
    // Calculate main classes
    let mainAttended = 0;
    attendance.mainClasses.forEach((cls: any) => {
        if (cls.regular) mainAttended++;
        if (cls.problemSolving) mainAttended++;
        if (cls.practice) mainAttended++;
    });

    // Calculate special classes
    let specialAttended = 0;
    attendance.specialClasses.forEach((cls: any) => {
        if (cls.attended) specialAttended++;
    });

    // Calculate guest classes
    let guestAttended = 0;
    attendance.guestClasses.forEach((cls: any) => {
        if (cls.attended) guestAttended++;
    });

    // Calculate percentages
    const mainPercentage = Math.round((mainAttended / 45) * 100);
    const specialPercentage = Math.round((specialAttended / 5) * 100);
    const guestPercentage = Math.round((guestAttended / 5) * 100);

    const totalAttended = mainAttended + specialAttended + guestAttended;
    const overallPercentage = Math.round((totalAttended / 55) * 100);

    // Update statistics
    attendance.statistics = {
        main: { attended: mainAttended, total: 45, percentage: mainPercentage },
        special: { attended: specialAttended, total: 5, percentage: specialPercentage },
        guest: { attended: guestAttended, total: 5, percentage: guestPercentage },
        overall: { attended: totalAttended, total: 55, percentage: overallPercentage },
        lastUpdated: new Date(),
    };
}

import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../user/user.model';
import Attendance from '../attendance/attendance.model';

// Define proper TypeScript interfaces based on your User model
interface UserLeanDocument {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    batchNumber: string;
    batchId: mongoose.Types.ObjectId;
    admissionId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export const studentAttendanceController = {
    // Get student dashboard data
    getDashboard: async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;

            // if (!user) {
            //     return res.status(401).json({
            //         success: false,
            //         message: 'Authentication required',
            //     });
            // }

            // Get user with populated batch
            const userData = await User.findById(user._id)
                .populate('batchId', 'name code description isActive')
                .lean();

            if (!userData) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }

            // Type assertion with proper interface
            const typedUserData = userData as unknown as UserLeanDocument & {
                batchId: {
                    _id: mongoose.Types.ObjectId;
                    name: string;
                    code: string;
                    description: string;
                    isActive: boolean;
                };
            };

            // Calculate attendance statistics
            const attendanceStats = await calculateAttendanceStats(
                user._id.toString(),
                typedUserData.batchNumber,
            );

            res.json({
                success: true,
                data: {
                    user: typedUserData,
                    attendanceStats,
                },
            });
        } catch (error: any) {
            // console.error('Get dashboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to load dashboard',
            });
        }
    },

    // Mark attendance for main classes
    markAttendance: async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const { className, sessionType, attended = true } = req.body;

            if (!user || !className || !sessionType) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields',
                });
            }

            // Get user's batch number
            const userData = await User.findById(user._id).select('batchNumber').lean();

            if (!userData) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }

            const typedUserData = userData as unknown as { batchNumber: string };

            // Set date to today (start of day)
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Check if attendance already exists
            const existingAttendance = await Attendance.findOne({
                studentId: user._id,
                className,
                sessionType,
                date: today,
            });

            if (existingAttendance) {
                // Update existing attendance
                existingAttendance.attended = attended;
                existingAttendance.markedAt = new Date();
                await existingAttendance.save();
            } else {
                // Create new attendance
                const attendance = new Attendance({
                    studentId: user._id,
                    batchId: typedUserData.batchNumber,
                    className,
                    sessionType,
                    attended,
                    date: today,
                    markedAt: new Date(),
                });
                await attendance.save();
            }

            // Get updated statistics
            const updatedStats = await calculateAttendanceStats(
                user._id.toString(),
                typedUserData.batchNumber,
            );

            res.json({
                success: true,
                message: `Attendance ${attended ? 'marked' : 'unmarked'} successfully`,
                data: updatedStats,
            });
        } catch (error: any) {
            // console.error('Mark attendance error:', error);

            if (error.code === 11000) {
                return res.status(400).json({
                    success: false,
                    message: 'Attendance already marked for this session today',
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to mark attendance',
            });
        }
    },

    // Get today's sessions
    getTodaySessions: async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;

            // if (!user) {
            //     return res.status(401).json({
            //         success: false,
            //         message: 'Authentication required',
            //     });
            // }

            const userData = await User.findById(user._id).select('batchNumber').lean();

            if (!userData) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }

            const typedUserData = userData as unknown as { batchNumber: string };

            // Generate all main classes for today (15 classes × 3 sessions)
            const allMainClasses: Array<{
                className: string;
                sessionType: 'regular' | 'problemSolving' | 'practice';
                time: string;
                topic: string;
            }> = [];

            for (let i = 1; i <= 15; i++) {
                const className = `Class ${i}`;

                allMainClasses.push({
                    className,
                    sessionType: 'regular',
                    time: '10:00 AM',
                    topic: `Main Lecture ${i}`,
                });

                allMainClasses.push({
                    className,
                    sessionType: 'problemSolving',
                    time: '2:00 PM',
                    topic: `Problem Solving Session ${i}`,
                });

                allMainClasses.push({
                    className,
                    sessionType: 'practice',
                    time: '4:00 PM',
                    topic: `Practice Session ${i}`,
                });
            }

            // Check which sessions are already attended
            const sessionsWithAttendance = await Promise.all(
                allMainClasses.map(async (session) => {
                    const attendance = await Attendance.findOne({
                        studentId: user._id,
                        className: session.className,
                        sessionType: session.sessionType,
                    });

                    return {
                        ...session,
                        attended: attendance?.attended || false,
                        attendanceId: attendance?._id,
                    };
                }),
            );

            res.json({
                success: true,
                data: sessionsWithAttendance,
            });
        } catch (error: any) {
            // console.error('Get today sessions error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to load today sessions',
            });
        }
    },

    // Get attendance history
    getAttendanceHistory: async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const { limit = 20 } = req.query;

            // if (!user) {
            //     return res.status(401).json({
            //         success: false,
            //         message: 'Authentication required',
            //     });
            // }

            const history = await Attendance.find({
                studentId: user._id,
            })
                .sort({ date: -1, markedAt: -1 })
                .limit(Number(limit))
                .lean();

            res.json({
                success: true,
                data: history,
            });
        } catch (error: any) {
            // console.error('Get attendance history error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to load attendance history',
            });
        }
    },

    // Update special class attendance - FIXED
    updateSpecialClass: async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const { className, attended = true } = req.body;

            if (!user || !className) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields',
                });
            }

            // Get user's batch number
            const userData = await User.findById(user._id).select('batchNumber').lean();
            if (!userData) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }

            const typedUserData = userData as unknown as { batchNumber: string };

            // Set date to today
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Check if attendance already exists for this special class
            const existingAttendance = await Attendance.findOne({
                studentId: user._id,
                className,
                sessionType: 'special',
                date: today,
            });

            if (existingAttendance) {
                // Update existing attendance
                existingAttendance.attended = attended;
                existingAttendance.markedAt = new Date();
                await existingAttendance.save();
            } else {
                // Create new attendance record
                const newAttendance = new Attendance({
                    studentId: user._id,
                    batchId: typedUserData.batchNumber,
                    className,
                    sessionType: 'special',
                    attended,
                    date: today,
                    markedAt: new Date(),
                });
                await newAttendance.save();
            }

            // Get updated statistics
            const updatedStats = await calculateAttendanceStats(
                user._id.toString(),
                typedUserData.batchNumber,
            );

            res.json({
                success: true,
                message: `Special class attendance ${attended ? 'marked' : 'unmarked'} successfully`,
                data: updatedStats,
            });
        } catch (error: any) {
            if (error.code === 11000) {
                return res.status(400).json({
                    success: false,
                    message: 'Attendance already marked for this special class today',
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to update special class attendance',
                error: error.message,
            });
        }
    },

    // Update guest class attendance - FIXED
    updateGuestClass: async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const { className, attended = true } = req.body;

            if (!user || !className) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields',
                });
            }

            // Get user's batch number
            const userData = await User.findById(user._id).select('batchNumber').lean();
            if (!userData) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }

            const typedUserData = userData as unknown as { batchNumber: string };

            // Set date to today
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Check if attendance already exists for this guest class
            const existingAttendance = await Attendance.findOne({
                studentId: user._id,
                className,
                sessionType: 'guest',
                date: today,
            });

            if (existingAttendance) {
                // Update existing attendance
                existingAttendance.attended = attended;
                existingAttendance.markedAt = new Date();
                await existingAttendance.save();
            } else {
                // Create new attendance record
                const newAttendance = new Attendance({
                    studentId: user._id,
                    batchId: typedUserData.batchNumber,
                    className,
                    sessionType: 'guest',
                    attended,
                    date: today,
                    markedAt: new Date(),
                });
                await newAttendance.save();
            }

            // Get updated statistics
            const updatedStats = await calculateAttendanceStats(
                user._id.toString(),
                typedUserData.batchNumber,
            );

            res.json({
                success: true,
                message: `Guest class attendance ${attended ? 'marked' : 'unmarked'} successfully`,
                data: updatedStats,
            });
        } catch (error: any) {
            // console.error('Update guest class error:', error);

            if (error.code === 11000) {
                return res.status(400).json({
                    success: false,
                    message: 'Attendance already marked for this guest class today',
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to update guest class attendance',
                error: error.message,
            });
        }
    },
};

// Helper function to calculate attendance statistics
async function calculateAttendanceStats(studentId: string, batchNumber: string) {
    // Get all attendance records for this student
    const allAttendance = await Attendance.find({
        studentId: new mongoose.Types.ObjectId(studentId),
        batchId: batchNumber,
    }).lean();

    // Calculate counts
    const attended = allAttendance.filter((record) => record.attended).length;
    const total = allAttendance.length;

    // Calculate by session type
    const regular = allAttendance.filter((r) => r.sessionType === 'regular' && r.attended).length;
    const problemSolving = allAttendance.filter(
        (r) => r.sessionType === 'problemSolving' && r.attended,
    ).length;
    const practice = allAttendance.filter((r) => r.sessionType === 'practice' && r.attended).length;
    const special = allAttendance.filter((r) => r.sessionType === 'special' && r.attended).length;
    const guest = allAttendance.filter((r) => r.sessionType === 'guest' && r.attended).length;

    // Calculate percentages
    const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
    const regularPercentage =
        allAttendance.filter((r) => r.sessionType === 'regular').length > 0
            ? Math.round(
                  (regular / allAttendance.filter((r) => r.sessionType === 'regular').length) * 100,
              )
            : 0;
    const problemSolvingPercentage =
        allAttendance.filter((r) => r.sessionType === 'problemSolving').length > 0
            ? Math.round(
                  (problemSolving /
                      allAttendance.filter((r) => r.sessionType === 'problemSolving').length) *
                      100,
              )
            : 0;
    const practicePercentage =
        allAttendance.filter((r) => r.sessionType === 'practice').length > 0
            ? Math.round(
                  (practice / allAttendance.filter((r) => r.sessionType === 'practice').length) *
                      100,
              )
            : 0;
    const specialPercentage =
        allAttendance.filter((r) => r.sessionType === 'special').length > 0
            ? Math.round(
                  (special / allAttendance.filter((r) => r.sessionType === 'special').length) * 100,
              )
            : 0;
    const guestPercentage =
        allAttendance.filter((r) => r.sessionType === 'guest').length > 0
            ? Math.round(
                  (guest / allAttendance.filter((r) => r.sessionType === 'guest').length) * 100,
              )
            : 0;

    return {
        summary: {
            attended,
            total,
            percentage,
        },
        byType: {
            regular: { attended: regular, percentage: regularPercentage },
            problemSolving: { attended: problemSolving, percentage: problemSolvingPercentage },
            practice: { attended: practice, percentage: practicePercentage },
            special: { attended: special, percentage: specialPercentage },
            guest: { attended: guest, percentage: guestPercentage },
        },
        recentCount: allAttendance.length,
    };
}

import type { Request, Response } from 'express';
import Attendance from './attendance.model';

export const attendanceController = {
    // Get attendance for a student
    getAttendance: async (req: Request, res: Response) => {
        try {
            const studentId = (req as any).user.id;
            const { batchId, type } = req.query;

            if (!batchId) {
                return res.status(400).json({
                    success: false,
                    message: 'Batch ID is required',
                });
            }

            const query: any = {
                studentId,
                batchId,
            };

            if (type) {
                query.attendanceType = type;
            }

            const attendance = await Attendance.find(query).sort({ createdAt: -1 }).lean();

            res.json({
                success: true,
                data: attendance,
            });
        } catch (error) {
            console.error('Get attendance error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get attendance',
            });
        }
    },

    // Save attendance
    saveAttendance: async (req: Request, res: Response) => {
        try {
            const studentId = (req as any).user.id;
            const { className, batchId, attendanceType, sessionType, attended } = req.body;

            console.log('Saving attendance:', {
                studentId,
                className,
                batchId,
                attendanceType,
                sessionType,
                attended,
            });

            // Validate required fields
            if (!className || !batchId || !attendanceType || !sessionType) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields',
                });
            }

            // Create or update attendance
            const attendance = await Attendance.findOneAndUpdate(
                {
                    studentId,
                    className,
                    batchId,
                    attendanceType,
                    sessionType,
                    date: {
                        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        $lt: new Date(new Date().setHours(23, 59, 59, 999)),
                    },
                },
                {
                    studentId,
                    className,
                    batchId,
                    attendanceType,
                    sessionType,
                    attended: attended || false,
                },
                {
                    new: true,
                    upsert: true,
                    runValidators: true,
                },
            );

            console.log('Attendance saved:', attendance._id);

            res.json({
                success: true,
                message: 'Attendance saved successfully',
                data: attendance,
            });
        } catch (error: any) {
            console.error('Save attendance error:', error);

            // Handle duplicate key error
            if (error.code === 11000) {
                return res.status(400).json({
                    success: false,
                    message: 'Attendance already submitted for today',
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to save attendance',
            });
        }
    },

    // Get attendance summary
    getSummary: async (req: Request, res: Response) => {
        try {
            const studentId = (req as any).user.id;
            const { batchId, type } = req.query;

            if (!batchId) {
                return res.status(400).json({
                    success: false,
                    message: 'Batch ID is required',
                });
            }

            const query: any = {
                studentId,
                batchId,
            };

            if (type) {
                query.attendanceType = type;
            }

            const attendance = await Attendance.find(query).lean();

            // Calculate summary
            const totalSessions = attendance.length;
            const attendedSessions = attendance.filter((a) => a.attended).length;
            const percentage =
                totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0;

            res.json({
                success: true,
                data: {
                    totalSessions,
                    attendedSessions,
                    percentage,
                    summary: attendance.reduce(
                        (acc, curr) => {
                            if (!acc[curr.className]) {
                                acc[curr.className] = {
                                    total: 0,
                                    attended: 0,
                                };
                            }
                            acc[curr.className].total++;
                            if (curr.attended) acc[curr.className].attended++;
                            return acc;
                        },
                        {} as Record<string, { total: number; attended: number }>,
                    ),
                },
            });
        } catch (error) {
            console.error('Get summary error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get summary',
            });
        }
    },
};

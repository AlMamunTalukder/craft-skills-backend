// server/controllers/attendance.controller.ts
import type { Request, Response } from 'express';
import { attendanceService } from './attendance.service';
import type { CreateAttendanceDto, UpdateAttendanceDto } from './attendance.dto';

export const attendanceController = {
    // Get all attendance routines
    getAllAttendances: async (req: Request, res: Response) => {
        try {
            const attendances = await attendanceService.getAllAttendances();
            res.json({ success: true, data: attendances });
        } catch (error) {
            res.status(500).json({
                success: false,
                message:
                    error instanceof Error ? error.message : 'Failed to fetch attendance routines',
            });
        }
    },

    // Get attendance by ID
    getAttendanceById: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const attendance = await attendanceService.getAttendanceById(id);

            if (!attendance) {
                return res.status(404).json({
                    success: false,
                    message: 'Attendance routine not found',
                });
            }

            res.json({ success: true, data: attendance });
        } catch (error) {
            res.status(500).json({
                success: false,
                message:
                    error instanceof Error ? error.message : 'Failed to fetch attendance routine',
            });
        }
    },

    // Create attendance routine
    createAttendance: async (req: Request, res: Response) => {
        try {
            const createDto: CreateAttendanceDto = req.body;
            const attendance = await attendanceService.createAttendance(createDto);
            res.status(201).json({ success: true, data: attendance });
        } catch (error) {
            res.status(400).json({
                success: false,
                message:
                    error instanceof Error ? error.message : 'Failed to create attendance routine',
            });
        }
    },

    // Update attendance routine
    updateAttendance: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const updateDto: UpdateAttendanceDto = req.body;
            const attendance = await attendanceService.updateAttendance(id, updateDto);

            if (!attendance) {
                return res.status(404).json({
                    success: false,
                    message: 'Attendance routine not found',
                });
            }

            res.json({ success: true, data: attendance });
        } catch (error) {
            res.status(400).json({
                success: false,
                message:
                    error instanceof Error ? error.message : 'Failed to update attendance routine',
            });
        }
    },

    // Delete attendance routine
    deleteAttendance: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            await attendanceService.deleteAttendance(id);
            res.json({ success: true, message: 'Attendance routine deleted successfully' });
        } catch (error) {
            const status =
                error instanceof Error && error.message === 'Attendance not found' ? 404 : 400;
            res.status(status).json({
                success: false,
                message:
                    error instanceof Error ? error.message : 'Failed to delete attendance routine',
            });
        }
    },

    // Update attendance status
    updateAttendanceStatus: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { isActive } = req.body;

            if (typeof isActive !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    message: 'isActive must be a boolean',
                });
            }

            const attendance = await attendanceService.updateAttendanceStatus(id, isActive);

            if (!attendance) {
                return res.status(404).json({
                    success: false,
                    message: 'Attendance routine not found',
                });
            }

            res.json({ success: true, data: attendance });
        } catch (error) {
            const status =
                error instanceof Error && error.message === 'Attendance not found' ? 404 : 400;
            res.status(status).json({
                success: false,
                message:
                    error instanceof Error ? error.message : 'Failed to update attendance status',
            });
        }
    },

    // Get attendance statistics
    getAttendanceStats: async (req: Request, res: Response) => {
        try {
            const stats = await attendanceService.getAttendanceStats();
            res.json({ success: true, data: stats });
        } catch (error) {
            res.status(500).json({
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : 'Failed to fetch attendance statistics',
            });
        }
    },
};

import type { Request, Response } from 'express';
import { ScheduleService } from './schedule.service';
import { scheduleDto } from './schedule.dto';
import { Schedule } from './schedule.model';

// Get all schedules
export const getAllSchedules = async (_req: Request, res: Response) => {
    try {
        const schedules = await Schedule.find().sort({ weekNumber: 1 });

        res.json({
            success: true,
            data: schedules,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch schedules',
        });
    }
};

// Get single schedule by ID
export const getScheduleById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const schedule = await Schedule.findById(id);

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found',
            });
        }

        res.json({
            success: true,
            data: schedule,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch schedule',
        });
    }
};

// Create new schedule
export const createSchedule = async (req: Request, res: Response) => {
    try {
        const { weekNumber, holidays, schedules } = req.body;

        // Check if schedule for this week already exists
        const existingSchedule = await Schedule.findOne({ weekNumber });
        if (existingSchedule) {
            return res.status(400).json({
                success: false,
                message: `Schedule for Week ${weekNumber} already exists`,
            });
        }

        const newSchedule = await Schedule.create({
            weekNumber,
            holidays,
            schedules,
        });

        res.status(201).json({
            success: true,
            message: 'Schedule created successfully',
            data: newSchedule,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || 'Validation failed',
        });
    }
};

// Update schedule (with or without ID)
export const updateSchedule = async (req: Request, res: Response) => {
    try {
        const { weekNumber, holidays, schedules } = req.body;
        const { id } = req.params; // Could be undefined if using old route

        let scheduleDoc;

        if (id) {
            // Update specific schedule by ID
            scheduleDoc = await Schedule.findByIdAndUpdate(
                id,
                { weekNumber, holidays, schedules },
                { new: true },
            );
        } else {
            // Update the single schedule document (old behavior)
            scheduleDoc = await Schedule.findOne();
            if (!scheduleDoc) {
                return res.status(404).json({
                    success: false,
                    message: 'Schedule not found',
                });
            }

            scheduleDoc.weekNumber = weekNumber;
            scheduleDoc.holidays = holidays;
            scheduleDoc.schedules = schedules;
            await scheduleDoc.save();
        }

        if (!scheduleDoc) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found',
            });
        }

        res.json({
            success: true,
            message: 'Schedule updated successfully',
            data: scheduleDoc,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || 'Validation failed',
        });
    }
};

// In schedule.controller.ts
export const updateScheduleStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const schedule = await Schedule.findByIdAndUpdate(id, { isActive }, { new: true });

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found',
            });
        }

        res.json({
            success: true,
            message: `Schedule ${isActive ? 'activated' : 'deactivated'} successfully`,
            data: schedule,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update schedule status',
        });
    }
};

// Delete schedule
export const deleteSchedule = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const schedule = await Schedule.findByIdAndDelete(id);

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found',
            });
        }

        res.json({
            success: true,
            message: 'Schedule deleted successfully',
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete schedule',
        });
    }
};

// Also update your getSchedule to handle first-time creation
export const getSchedule = async (_req: Request, res: Response) => {
    try {
        let scheduleDoc = await Schedule.findOne();

        // If no schedule exists, create a default one
        if (!scheduleDoc) {
            scheduleDoc = await Schedule.create({
                weekNumber: 1,
                schedules: [],
                holidays: '',
            });
        }

        res.json({
            success: true,
            data: scheduleDoc,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch schedule',
        });
    }
};

export const bulkUpdateSchedules = async (req: Request, res: Response) => {
    try {
        const { schedules, holidays, weekNumber } = req.body;

        if (!Array.isArray(schedules)) {
            return res.status(400).json({
                success: false,
                message: 'Schedules must be an array',
            });
        }

        const scheduleDoc = await Schedule.findOne();

        if (!scheduleDoc) {
            return res.status(404).json({
                success: false,
                message: 'Schedule document not found',
            });
        }

        // scheduleDoc.schedules = schedules;
        if (holidays !== undefined) scheduleDoc.holidays = holidays;
        if (weekNumber !== undefined) scheduleDoc.weekNumber = weekNumber;

        await scheduleDoc.save();

        res.json({
            success: true,
            message: 'Class schedule updated successfully',
            data: scheduleDoc,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update schedule',
        });
    }
};

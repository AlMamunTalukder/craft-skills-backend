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

export const updateScheduleStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        // If we are setting this one to active, turn ALL others off first
        if (isActive === true) {
            await Schedule.updateMany({}, { isActive: false });
        }

        const schedule = await Schedule.findByIdAndUpdate(id, { isActive }, { new: true });

        res.json({
            success: true,
            message: `Schedule Week ${schedule?.weekNumber} is now ${isActive ? 'active' : 'inactive'}`,
            data: schedule,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
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

// Updated getSchedule in schedule.controller.ts
export const getSchedule = async (_req: Request, res: Response) => {
    try {
        // 1. Specifically look for the ACTIVE schedule
        let scheduleDoc = await Schedule.findOne({ isActive: true });

        // 2. If no schedule is marked active, fallback to the latest one
        if (!scheduleDoc) {
            scheduleDoc = await Schedule.findOne().sort({ createdAt: -1 });
        }

        // 3. Only create if the database is completely empty
        if (!scheduleDoc) {
            scheduleDoc = await Schedule.create({
                weekNumber: 1,
                schedules: [],
                holidays: '',
                isActive: true,
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

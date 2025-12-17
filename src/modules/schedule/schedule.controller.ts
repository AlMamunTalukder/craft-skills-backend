import type { Request, Response } from 'express';
import { ScheduleService } from './schedule.service';
import { scheduleDto } from './schedule.dto';
import { Schedule } from './schedule.model';

export const createSchedule = async (req: Request, res: Response) => {
    const validatedData = scheduleDto.parse(req.body);
    const result = await ScheduleService.createSchedule(validatedData);

    res.status(201).json({
        success: true,
        message: 'Schedule created successfully',
        data: result,
    });
};

export const getAllSchedules = async (_req: Request, res: Response) => {
    const result = await ScheduleService.getAllSchedules();

    res.json({
        success: true,
        data: result,
    });
};

export const updateSchedule = async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ScheduleService.updateSchedule(id, req.body);

    res.json({
        success: true,
        message: 'Schedule updated successfully',
        data: result,
    });
};

export const bulkUpdateSchedules = async (req: Request, res: Response) => {
    const schedules = req.body;

    if (!Array.isArray(schedules)) {
        return res.status(400).json({
            success: false,
            message: 'Payload must be an array',
        });
    }

    const operations = schedules.map((item) => ({
        updateOne: {
            filter: { _id: item._id },
            update: {
                className: item.className,
                days: item.days,
                time: item.time,
                holidays: item.holidays,
            },
        },
    }));

    await Schedule.bulkWrite(operations);

    res.json({
        success: true,
        message: 'Class schedule updated successfully',
    });
};

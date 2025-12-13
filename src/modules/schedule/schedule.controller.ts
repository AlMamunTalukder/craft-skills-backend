import type { Request, Response } from 'express';
import { ScheduleService } from './schedule.service';
import { scheduleDto } from './schedule.dto';

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

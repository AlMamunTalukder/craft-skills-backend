import type { Request, Response } from 'express';
import catchAsync from 'src/utils/catchAsync';
import { seminarService } from './seminar.service';

export const seminarController = {
    getAllSeminars: catchAsync(async (req: Request, res: Response) => {
        const seminars = await seminarService.getAllSeminars();

        res.status(200).json({
            success: true,
            message: 'Seminars retrieved successfully',
            data: seminars,
            count: seminars.length,
        });
    }),

    getSeminarById: catchAsync(async (req: Request, res: Response) => {
        const { id } = req.params;

        const seminar = await seminarService.getSeminarById(id);

        res.status(200).json({
            success: true,
            message: 'Seminar retrieved successfully',
            data: seminar,
        });
    }),

    // Create seminar
    createSeminar: catchAsync(async (req: Request, res: Response) => {
        const seminar = await seminarService.createSeminar(req.body);

        res.status(201).json({
            success: true,
            message: 'Seminar created successfully',
            data: seminar,
        });
    }),

    updateSeminar: catchAsync(async (req: Request, res: Response) => {
        const { id } = req.params;

        const seminar = await seminarService.updateSeminar(id, req.body);

        res.status(200).json({
            success: true,
            message: 'Seminar updated successfully',
            data: seminar,
        });
    }),

    // Delete seminar
    deleteSeminar: catchAsync(async (req: Request, res: Response) => {
        const { id } = req.params;

        await seminarService.deleteSeminar(id);

        res.status(200).json({
            success: true,
            message: 'Seminar deleted successfully',
        });
    }),

    // Change status
    changeStatus: catchAsync(async (req: Request, res: Response) => {
        const { id } = req.params;
        const { isActive } = req.body;

        const seminar = await seminarService.changeStatus(id, isActive);

        res.status(200).json({
            success: true,
            message: 'Seminar status updated successfully',
            data: seminar,
        });
    }),
};

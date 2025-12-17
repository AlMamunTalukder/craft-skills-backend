// server/controllers/seminar.controller.ts
import type { Request, Response } from 'express';
import catchAsync from 'src/utils/catchAsync';
import { seminarService } from './seminar.service';

export const seminarController = {
    // Get all seminars
    getAllSeminars: catchAsync(async (req: Request, res: Response) => {
        console.time('getAllSeminarsController');

        const seminars = await seminarService.getAllSeminars();

        // Cache control headers
        res.set({
            'Cache-Control': 'public, max-age=60',
        });

        console.timeEnd('getAllSeminarsController');
        console.log(`🚀 Sent ${seminars.length} seminars`);

        res.status(200).json({
            success: true,
            message: 'Seminars retrieved successfully',
            data: seminars,
            count: seminars.length,
        });
    }),

    // Get single seminar
    getSeminarById: catchAsync(async (req: Request, res: Response) => {
        const { id } = req.params;

        console.time('getSeminarByIdController');
        const seminar = await seminarService.getSeminarById(id);
        console.timeEnd('getSeminarByIdController');

        res.status(200).json({
            success: true,
            message: 'Seminar retrieved successfully',
            data: seminar,
        });
    }),

    // Create seminar
    createSeminar: catchAsync(async (req: Request, res: Response) => {
        console.time('createSeminarController');
        const seminar = await seminarService.createSeminar(req.body);
        console.timeEnd('createSeminarController');

        res.status(201).json({
            success: true,
            message: 'Seminar created successfully',
            data: seminar,
        });
    }),

    // Update seminar
    updateSeminar: catchAsync(async (req: Request, res: Response) => {
        const { id } = req.params;

        console.time('updateSeminarController');
        const seminar = await seminarService.updateSeminar(id, req.body);
        console.timeEnd('updateSeminarController');

        res.status(200).json({
            success: true,
            message: 'Seminar updated successfully',
            data: seminar,
        });
    }),

    // Delete seminar
    deleteSeminar: catchAsync(async (req: Request, res: Response) => {
        const { id } = req.params;

        console.time('deleteSeminarController');
        await seminarService.deleteSeminar(id);
        console.timeEnd('deleteSeminarController');

        res.status(200).json({
            success: true,
            message: 'Seminar deleted successfully',
        });
    }),

    // Change status
    changeStatus: catchAsync(async (req: Request, res: Response) => {
        const { id } = req.params;
        const { isActive } = req.body;

        console.time('changeStatusController');
        const seminar = await seminarService.changeStatus(id, isActive);
        console.timeEnd('changeStatusController');

        res.status(200).json({
            success: true,
            message: 'Seminar status updated successfully',
            data: seminar,
        });
    }),
};

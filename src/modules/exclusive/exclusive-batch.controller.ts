import type { Request, Response } from 'express';
import catchAsync from 'src/utils/catchAsync';
import { exclusiveBatchService } from './exclusive-batch.service';

export const exclusiveBatchController = {
    getAllBatches: catchAsync(async (req: Request, res: Response) => {
        const batches = await exclusiveBatchService.getAllBatches();
        res.status(200).json({
            success: true,
            message: 'Batches retrieved successfully',
            data: batches,
            count: batches.length,
        });
    }),

    getActiveBatch: catchAsync(async (req: Request, res: Response) => {
        const batch = await exclusiveBatchService.getActiveBatch();
        if (!batch) {
            return res.status(404).json({
                success: false,
                message: 'No active batch found',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Active batch retrieved successfully',
            data: batch,
        });
    }),

    getBatchById: catchAsync(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const batch = await exclusiveBatchService.getBatchById(id);
        res.status(200).json({
            success: true,
            message: 'Batch retrieved successfully',
            data: batch,
        });
    }),

    createBatch: catchAsync(async (req: Request, res: Response) => {
        const batch = await exclusiveBatchService.createBatch(req.body);
        res.status(201).json({
            success: true,
            message: 'Batch created successfully',
            data: batch,
        });
    }),

    updateBatch: catchAsync(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const batch = await exclusiveBatchService.updateBatch(id, req.body);
        res.status(200).json({
            success: true,
            message: 'Batch updated successfully',
            data: batch,
        });
    }),

    deleteBatch: catchAsync(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        await exclusiveBatchService.deleteBatch(id);
        res.status(200).json({
            success: true,
            message: 'Batch deleted successfully',
        });
    }),

    changeStatus: catchAsync(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const { isActive } = req.body;
        const batch = await exclusiveBatchService.changeStatus(id, isActive);
        res.status(200).json({
            success: true,
            message: 'Batch status updated successfully',
            data: batch,
        });
    }),
};

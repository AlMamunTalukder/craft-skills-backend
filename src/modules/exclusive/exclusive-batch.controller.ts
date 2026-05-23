import type { Request, Response } from 'express';
import { exclusiveBatchService } from './exclusive-batch.service';
import { createExclusiveBatchDto, updateExclusiveBatchDto } from './exclusive-batch.dto';
import validateRequest from 'src/utils/validateRequest';

export const exclusiveBatchController = {
    getAllBatches: async (req: Request, res: Response) => {
        try {
            const batches = await exclusiveBatchService.getAllBatches();
            res.json({
                success: true,
                message: 'Batches retrieved successfully',
                data: batches,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    getBatchById: async (req: Request, res: Response) => {
        try {
            const batch = await exclusiveBatchService.getBatchById(req.params.id);
            res.json({
                success: true,
                message: 'Batch retrieved successfully',
                data: batch,
            });
        } catch (error: any) {
            res.status(404).json({
                success: false,
                message: error.message,
            });
        }
    },

    createBatch: [
        validateRequest(createExclusiveBatchDto),
        async (req: Request, res: Response) => {
            try {
                const batchData = {
                    ...req.body,
                    startDate: new Date(req.body.startDate),
                    endDate: new Date(req.body.endDate),
                };
                const batch = await exclusiveBatchService.createBatch(batchData);
                res.status(201).json({
                    success: true,
                    message: 'Batch created successfully',
                    data: batch,
                });
            } catch (error: any) {
                res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }
        },
    ],

    updateBatch: [
        validateRequest(updateExclusiveBatchDto),
        async (req: Request, res: Response) => {
            try {
                const { startDate, endDate, ...otherData } = req.body;
                const updateData: any = { ...otherData };

                if (startDate) updateData.startDate = new Date(startDate);
                if (endDate) updateData.endDate = new Date(endDate);

                const batch = await exclusiveBatchService.updateBatch(req.params.id, updateData);
                res.json({
                    success: true,
                    message: 'Batch updated successfully',
                    data: batch,
                });
            } catch (error: any) {
                res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }
        },
    ],

    deleteBatch: async (req: Request, res: Response) => {
        try {
            await exclusiveBatchService.deleteBatch(req.params.id);
            res.json({
                success: true,
                message: 'Batch deleted successfully',
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    },

    toggleBatchStatus: async (req: Request, res: Response) => {
        try {
            const { isActive } = req.body;
            const batch = await exclusiveBatchService.toggleBatchStatus(req.params.id, isActive);
            res.json({
                success: true,
                message: `Batch ${isActive ? 'activated' : 'deactivated'} successfully`,
                data: batch,
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    },

    getActiveBatch: async (req: Request, res: Response) => {
        try {
            const batch = await exclusiveBatchService.getActiveBatch();
            res.json({
                success: true,
                message: 'Active batch retrieved successfully',
                data: batch,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },
};

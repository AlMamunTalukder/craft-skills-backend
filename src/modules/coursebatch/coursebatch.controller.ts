// server/controllers/coursebatch.controller.ts
import type { Request, Response } from 'express';
import { courseBatchService } from './coursebatch.service';
import { createBatchDto, updateBatchDto } from './coursebatch.dto';
import validateRequest from 'src/utils/validateRequest';

export const courseBatchController = {
    getAllBatches: async (req: Request, res: Response) => {
        try {
            const batches = await courseBatchService.getAllBatches();
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
            const batch = await courseBatchService.getBatchById(req.params.id);
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
        validateRequest(createBatchDto),
        async (req: Request, res: Response) => {
            try {
                // Convert string dates to Date objects for MongoDB
                const batchData = {
                    ...req.body,
                    registrationStart: new Date(req.body.registrationStart),
                    registrationEnd: new Date(req.body.registrationEnd),
                };

                const batch = await courseBatchService.createBatch(batchData);
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
        validateRequest(updateBatchDto),
        async (req: Request, res: Response) => {
            try {
                const { registrationStart, registrationEnd, ...otherData } = req.body;

                // Prepare update data
                const updateData: any = { ...otherData };

                if (registrationStart) {
                    updateData.registrationStart = new Date(registrationStart);
                }

                if (registrationEnd) {
                    updateData.registrationEnd = new Date(registrationEnd);
                }

                const batch = await courseBatchService.updateBatch(req.params.id, updateData);
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
            await courseBatchService.deleteBatch(req.params.id);
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

    changeStatus: async (req: Request, res: Response) => {
        try {
            const { isActive } = req.body;
            const batch = await courseBatchService.changeStatus(req.params.id, isActive);
            res.json({
                success: true,
                message: 'Batch status updated successfully',
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
            const batch = await courseBatchService.getActiveBatch();
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

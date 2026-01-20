// src/controllers/admission.controller.ts
import type { Request, Response } from 'express';
import catchAsync from 'src/utils/catchAsync';
import { admissionService, queueAdmission } from './admission.service';
import { Admission } from './admission.model';
import sendResponse from 'src/utils/sendResponse';
import { AuthUser } from 'src/types/user.types';

export const admissionController = {
    getAllAdmissions: catchAsync(async (req: Request, res: Response) => {
        const admissions = await admissionService.getAllAdmissions();

        res.status(200).json({
            success: true,
            message: 'Admissions retrieved successfully',
            data: admissions,
            count: admissions.length,
        });
    }),

    getAdmissionById: catchAsync(async (req: Request, res: Response) => {
        const { id } = req.params;
        const admission = await admissionService.getAdmissionById(id);

        res.status(200).json({
            success: true,
            message: 'Admission retrieved successfully',
            data: admission,
        });
    }),

    getAdmissionsByBatchId: catchAsync(async (req: Request, res: Response) => {
        const { batchId } = req.params;
        const admissions = await admissionService.getAdmissionsByBatchId(batchId);

        res.status(200).json({
            success: true,
            message: 'Admissions retrieved successfully',
            data: admissions,
            count: admissions.length,
        });
    }),

    // This is the public registration endpoint (uses queue for Google Sheets)
    createAdmission: catchAsync(async (req: Request, res: Response) => {
        // Use queue-based admission for Google Sheets integration
        const result = await queueAdmission(req.body);

        res.status(202).json({
            success: true,
            message: 'Admission registration is being processed',
            data: result,
        });
    }),

    updateAdmission: catchAsync(async (req: Request, res: Response) => {
        const { id } = req.params;
        const admission = await admissionService.updateAdmission(id, req.body);

        res.status(200).json({
            success: true,
            message: 'Admission updated successfully',
            data: admission,
        });
    }),

    deleteAdmission: catchAsync(async (req: Request, res: Response) => {
        const { id } = req.params;
        await admissionService.deleteAdmission(id);

        res.status(200).json({
            success: true,
            message: 'Admission deleted successfully',
        });
    }),

    updateStatus: catchAsync(async (req: Request, res: Response) => {
        const { id } = req.params;
        const { status } = req.body;
        const admission = await admissionService.updateAdmissionStatus(id, status);

        res.status(200).json({
            success: true,
            message: 'Admission status updated successfully',
            data: admission,
        });
    }),

    updatePaymentStatus: catchAsync(async (req: Request, res: Response) => {
        const { id } = req.params;
        const { paymentStatus } = req.body;
        const admission = await admissionService.updatePaymentStatus(id, paymentStatus);

        res.status(200).json({
            success: true,
            message: 'Payment status updated successfully',
            data: admission,
        });
    }),

    updateAdmissionResult: catchAsync(async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const { result } = req.body;

        // console.log(`Updating result for admission ID ${id} to ${result}`);

        // Validate result
        const validResults = [
            'pending',
            'needs improvement',
            'average',
            'good',
            'very good',
            'excellent',
        ];
        if (!validResults.includes(result)) {
            // Use res.json instead of sendResponse for error responses
            // return res.status(400).json({
            //     success: false,
            //     message: 'Invalid result value. Must be one of: ' + validResults.join(', '),
            //     data: null,
            // });
        }

        // Find the admission by its _id (admission ID)
        const admission = await Admission.findById(id);

        if (!admission) {
            // console.log(`Admission not found for ID: ${id}`);
            // return res.status(404).json({
            //     success: false,
            //     message: 'Admission record not found',
            //     data: null,
            // });
        }

        // Update the result
        admission.result = result;
        await admission.save();

        // Use res.json for successful response
        res.status(200).json({
            success: true,
            message: 'Result updated successfully',
            data: admission,
        });
    }),

    // Add this method to admission.controller.ts
    getStudentAdmissionResult: catchAsync(async (req: Request, res: Response): Promise<void> => {
        const user = req.user as AuthUser;

        // if (!user) {
        //     return res.status(401).json({
        //         success: false,
        //         message: 'Unauthorized',
        //         data: null,
        //     });
        // }

        let admission = null;

        // 1. First try to get admission by user's admissionId
        if (user.admissionId) {
            admission = await Admission.findById(user.admissionId)
                .select('name result updatedAt')
                .populate('batchId', 'batchNumber name');
        }

        // 2. If not found, try to get admission by exact match with user
        if (!admission) {
            admission = await Admission.findOne({
                name: user.name,
                $or: [{ email: user.email || '' }, { phone: user.phone || '' }],
            })
                .select('name result updatedAt')
                .populate('batchId', 'batchNumber name');
        }

        // 3. If still not found, try any admission with matching email/phone
        if (!admission) {
            admission = await Admission.findOne({
                $or: [{ email: user.email || '' }, { phone: user.phone || '' }],
            })
                .select('name result updatedAt')
                .populate('batchId', 'batchNumber name');
        }

        // if (!admission) {
        //     return res.status(404).json({
        //         success: false,
        //         message: 'No admission record found',
        //         data: null,
        //     });
        // }

        res.status(200).json({
            success: true,
            message: 'Result retrieved successfully',
            data: {
                user: {
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    batchNumber: user.batchNumber,
                },
                admission: {
                    name: admission.name,
                    result: admission.result || 'pending',
                    updatedAt: admission.updatedAt,
                    batchId: admission.batchId,
                },
                // Always show the logged-in user's name from session
                displayName: user.name,
                admissionName: admission.name,
            },
        });
    }),
};

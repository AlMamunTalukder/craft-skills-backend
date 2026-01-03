// // server/controllers/admission.controller.ts
// import type { Request, Response } from 'express';
// import catchAsync from 'src/utils/catchAsync';
// import { admissionService, createAdmission } from './admission.service';
// import logger from 'src/shared/logger';

// export const admissionController = {
//     getAllAdmissions: catchAsync(async (req: Request, res: Response) => {
//         const admissions = await admissionService.getAllAdmissions();

//         res.status(200).json({
//             success: true,
//             message: 'Admissions retrieved successfully',
//             data: admissions,
//             count: admissions.length,
//         });
//     }),

//     getAdmissionById: catchAsync(async (req: Request, res: Response) => {
//         const { id } = req.params;
//         const admission = await admissionService.getAdmissionById(id);

//         res.status(200).json({
//             success: true,
//             message: 'Admission retrieved successfully',
//             data: admission,
//         });
//     }),

//     getAdmissionsByBatchId: catchAsync(async (req: Request, res: Response) => {
//         const { batchId } = req.params;
//         const admissions = await admissionService.getAdmissionsByBatchId(batchId);

//         res.status(200).json({
//             success: true,
//             message: 'Admissions retrieved successfully',
//             data: admissions,
//             count: admissions.length,
//         });
//     }),

//     createAdmission: catchAsync(async (req: Request, res: Response) => {
//         const admission = await admissionService.createAdmission(req.body);

//         res.status(201).json({
//             success: true,
//             message: 'Admission created successfully',
//             data: admission,
//         });
//     }),

//     updateAdmission: catchAsync(async (req: Request, res: Response) => {
//         const { id } = req.params;
//         const admission = await admissionService.updateAdmission(id, req.body);

//         res.status(200).json({
//             success: true,
//             message: 'Admission updated successfully',
//             data: admission,
//         });
//     }),

//     deleteAdmission: catchAsync(async (req: Request, res: Response) => {
//         const { id } = req.params;
//         await admissionService.deleteAdmission(id);

//         res.status(200).json({
//             success: true,
//             message: 'Admission deleted successfully',
//         });
//     }),

//     updateStatus: catchAsync(async (req: Request, res: Response) => {
//         const { id } = req.params;
//         const { status } = req.body;
//         const admission = await admissionService.updateAdmissionStatus(id, status);

//         res.status(200).json({
//             success: true,
//             message: 'Admission status updated successfully',
//             data: admission,
//         });
//     }),

//     updatePaymentStatus: catchAsync(async (req: Request, res: Response) => {
//         const { id } = req.params;
//         const { paymentStatus } = req.body;
//         const admission = await admissionService.updatePaymentStatus(id, paymentStatus);

//         res.status(200).json({
//             success: true,
//             message: 'Payment status updated successfully',
//             data: admission,
//         });
//     }),
// };
// export const registerAdmission = async (req: Request, res: Response) => {
//     try {
//         const admissionData = req.body;

//         // Option 1: Using queue (recommended for production)
//         const result = await createAdmission(admissionData);

//         // Option 2: Direct save (simpler, no queue)
//         // const admission = await createAdmissionDirect(admissionData);

//         res.status(202).json({
//             success: true,
//             message: 'Admission registration is being processed',
//             data: result,
//         });
//     } catch (error: any) {
//         logger.error('Error in admission registration:', error);
//         res.status(400).json({
//             success: false,
//             message: error.message || 'Failed to register admission',
//         });
//     }
// };

// src/controllers/admission.controller.ts
import type { Request, Response } from 'express';
import catchAsync from 'src/utils/catchAsync';
import { admissionService, queueAdmission } from './admission.service';

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
};

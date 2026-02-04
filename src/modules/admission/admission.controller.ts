// src/controllers/admission.controller.ts
import type { Request, Response } from 'express';
import catchAsync from 'src/utils/catchAsync';
import { admissionService, queueAdmission } from './admission.service';
import { Admission } from './admission.model';
import sendResponse from 'src/utils/sendResponse';
import { AuthUser } from 'src/types/user.types';
import User from '../user/user.model';

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

    getStudentAdmissionResult: catchAsync(async (req: Request, res: Response): Promise<any> => {
        const user = req.user as AuthUser;
        const { batchId } = req.query; // Get batchId from query params

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                data: null,
            });
        }

        let admission = null;
        let query: any = {
            $or: [{ email: user.email }, { phone: user.phone }],
        };

        // If batchId is provided, add it to query
        if (batchId) {
            query.batchId = batchId;
        }

        // Try to find admission for the specified batch
        admission = await Admission.findOne(query)
            .select('name result updatedAt batchId courseId paymentStatus status')
            .populate('batchId', 'name batchNumber code description')
            .populate('courseId', 'name code')
            .lean();

        // If no batch specified or not found, try to get current batch admission
        if (!admission) {
            // Get user's current batch info
            const userData = await User.findById(user._id)
                .select('currentBatchId currentBatchNumber')
                .lean();

            if (userData && (userData as any).currentBatchId) {
                admission = await Admission.findOne({
                    $or: [{ email: user.email }, { phone: user.phone }],
                    batchId: (userData as any).currentBatchId,
                })
                    .select('name result updatedAt batchId courseId paymentStatus status')
                    .populate('batchId', 'name batchNumber code description')
                    .populate('courseId', 'name code')
                    .lean();
            }
        }

        // If still not found, get any admission (fallback)
        if (!admission) {
            admission = await Admission.findOne({
                $or: [{ email: user.email }, { phone: user.phone }],
            })
                .select('name result updatedAt batchId courseId paymentStatus status')
                .populate('batchId', 'name batchNumber code description')
                .populate('courseId', 'name code')
                .lean();
        }

        if (!admission) {
            return res.status(404).json({
                success: false,
                message: 'No admission record found',
                data: null,
            });
        }

        // Cast admission to any to access properties safely
        const admissionData = admission as any;

        return res.status(200).json({
            success: true,
            message: 'Result retrieved successfully',
            data: {
                _id: admissionData._id,
                name: admissionData.name,
                result: admissionData.result || 'pending',
                updatedAt: admissionData.updatedAt,
                batchId: admissionData.batchId,
                batchName:
                    admissionData.batchId?.name ||
                    `Batch ${admissionData.batchId?.batchNumber || 'N/A'}`,
                batchNumber: admissionData.batchId?.batchNumber,
                courseName: admissionData.courseId?.name || 'Course',
                paymentStatus: admissionData.paymentStatus,
                status: admissionData.status,
                displayName: user.name,
                admissionName: admissionData.name,
            },
        });
    }),

    getStudentAllAdmissionResults: catchAsync(async (req: Request, res: Response): Promise<any> => {
        const user = req.user as AuthUser;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                data: null,
            });
        }

        // Find ALL admissions for this user by matching email or phone
        const admissions = await Admission.find({
            $or: [{ email: user.email }, { phone: user.phone }],
        })
            .populate('batchId', 'name batchNumber code description')
            .populate('courseId', 'name code')
            .sort({ createdAt: -1 })
            .lean();

        if (!admissions || admissions.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No admission records found',
                data: [],
            });
        }

        // Transform the data
        const results = admissions.map((admission) => ({
            _id: admission._id,
            name: admission.name,
            result: admission.result || 'pending',
            updatedAt: admission.updatedAt,
            createdAt: admission.createdAt,
            batchId: admission.batchId,
            batchName:
                (admission.batchId as any)?.name ||
                `Batch ${(admission.batchId as any)?.batchNumber || 'N/A'}`,
            batchNumber: (admission.batchId as any)?.batchNumber,
            courseName: (admission.courseId as any)?.name || 'Course',
            paymentStatus: admission.paymentStatus,
            status: admission.status,
        }));

        res.status(200).json({
            success: true,
            message: 'All results retrieved successfully',
            data: results,
            count: results.length,
        });
    }),

    createAdmissionDirect: catchAsync(async (req: Request, res: Response) => {
        // Direct creation without queue for admin
        const admission = await admissionService.createAdmission(req.body);

        res.status(201).json({
            success: true,
            message: 'Admission created successfully',
            data: admission,
        });
    }),
};

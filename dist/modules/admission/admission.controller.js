"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.admissionController = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const admission_service_1 = require("./admission.service");
const admission_model_1 = require("./admission.model");
const user_model_1 = __importDefault(require("../user/user.model"));
exports.admissionController = {
    getAllAdmissions: (0, catchAsync_1.default)(async (req, res) => {
        const admissions = await admission_service_1.admissionService.getAllAdmissions();
        res.status(200).json({
            success: true,
            message: 'Admissions retrieved successfully',
            data: admissions,
            count: admissions.length,
        });
    }),
    getAdmissionById: (0, catchAsync_1.default)(async (req, res) => {
        const id = req.params.id;
        const admission = await admission_service_1.admissionService.getAdmissionById(id);
        res.status(200).json({
            success: true,
            message: 'Admission retrieved successfully',
            data: admission,
        });
    }),
    getAdmissionsByBatchId: (0, catchAsync_1.default)(async (req, res) => {
        const batchId = req.params.batchId;
        const admissions = await admission_service_1.admissionService.getAdmissionsByBatchId(batchId);
        res.status(200).json({
            success: true,
            message: 'Admissions retrieved successfully',
            data: admissions,
            count: admissions.length,
        });
    }),
    // This is the public registration endpoint (uses queue for Google Sheets)
    createAdmission: (0, catchAsync_1.default)(async (req, res) => {
        // Use queue-based admission for Google Sheets integration
        const result = await (0, admission_service_1.queueAdmission)(req.body);
        res.status(202).json({
            success: true,
            message: 'Admission registration is being processed',
            data: result,
        });
    }),
    updateAdmission: (0, catchAsync_1.default)(async (req, res) => {
        const id = req.params.id;
        const admission = await admission_service_1.admissionService.updateAdmission(id, req.body);
        res.status(200).json({
            success: true,
            message: 'Admission updated successfully',
            data: admission,
        });
    }),
    deleteAdmission: (0, catchAsync_1.default)(async (req, res) => {
        const id = req.params.id;
        await admission_service_1.admissionService.deleteAdmission(id);
        res.status(200).json({
            success: true,
            message: 'Admission deleted successfully',
        });
    }),
    updateStatus: (0, catchAsync_1.default)(async (req, res) => {
        const id = req.params.id;
        const { status } = req.body;
        const admission = await admission_service_1.admissionService.updateAdmissionStatus(id, status);
        res.status(200).json({
            success: true,
            message: 'Admission status updated successfully',
            data: admission,
        });
    }),
    updatePaymentStatus: (0, catchAsync_1.default)(async (req, res) => {
        const id = req.params.id;
        const { paymentStatus } = req.body;
        const admission = await admission_service_1.admissionService.updatePaymentStatus(id, paymentStatus);
        res.status(200).json({
            success: true,
            message: 'Payment status updated successfully',
            data: admission,
        });
    }),
    updateAdmissionResult: (0, catchAsync_1.default)(async (req, res) => {
        const id = req.params.id;
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
        const admission = await admission_model_1.Admission.findById(id);
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
    getStudentAdmissionResult: (0, catchAsync_1.default)(async (req, res) => {
        const user = req.user;
        const { batchId } = req.query; // Get batchId from query params
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                data: null,
            });
        }
        let admission = null;
        let query = {
            $or: [{ email: user.email }, { phone: user.phone }],
        };
        // If batchId is provided, add it to query
        if (batchId) {
            query.batchId = batchId;
        }
        // Try to find admission for the specified batch
        admission = await admission_model_1.Admission.findOne(query)
            .select('name result updatedAt batchId courseId paymentStatus status')
            .populate('batchId', 'name batchNumber code description')
            .populate('courseId', 'name code')
            .lean();
        // If no batch specified or not found, try to get current batch admission
        if (!admission) {
            // Get user's current batch info
            const userData = await user_model_1.default.findById(user._id)
                .select('currentBatchId currentBatchNumber')
                .lean();
            if (userData && userData.currentBatchId) {
                admission = await admission_model_1.Admission.findOne({
                    $or: [{ email: user.email }, { phone: user.phone }],
                    batchId: userData.currentBatchId,
                })
                    .select('name result updatedAt batchId courseId paymentStatus status')
                    .populate('batchId', 'name batchNumber code description')
                    .populate('courseId', 'name code')
                    .lean();
            }
        }
        // If still not found, get any admission (fallback)
        if (!admission) {
            admission = await admission_model_1.Admission.findOne({
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
        const admissionData = admission;
        return res.status(200).json({
            success: true,
            message: 'Result retrieved successfully',
            data: {
                _id: admissionData._id,
                name: admissionData.name,
                result: admissionData.result || 'pending',
                updatedAt: admissionData.updatedAt,
                batchId: admissionData.batchId,
                batchName: admissionData.batchId?.name ||
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
    getStudentAllAdmissionResults: (0, catchAsync_1.default)(async (req, res) => {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                data: null,
            });
        }
        // Find ALL admissions for this user by matching email or phone
        const admissions = await admission_model_1.Admission.find({
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
            batchName: admission.batchId?.name ||
                `Batch ${admission.batchId?.batchNumber || 'N/A'}`,
            batchNumber: admission.batchId?.batchNumber,
            courseName: admission.courseId?.name || 'Course',
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
    createAdmissionDirect: (0, catchAsync_1.default)(async (req, res) => {
        // Direct creation without queue for admin
        const admission = await admission_service_1.admissionService.createAdmission(req.body);
        res.status(201).json({
            success: true,
            message: 'Admission created successfully',
            data: admission,
        });
    }),
};

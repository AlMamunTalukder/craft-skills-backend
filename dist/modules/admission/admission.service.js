"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.admissionService = exports.queueAdmission = void 0;
const bullmq_1 = require("bullmq");
const mongoose_1 = __importDefault(require("mongoose"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const admission_model_1 = require("./admission.model");
const course_model_1 = require("../course/course.model");
const coursebatch_model_1 = require("../coursebatch/coursebatch.model");
const logger_1 = __importDefault(require("../../shared/logger"));
const connection_1 = require("../../queues/connection");
// import { trackEvent } from 'src/utils/tracker';
const admissionQueue = new bullmq_1.Queue('admission-queue', {
    connection: connection_1.redisConnection,
});
// Queue-based admission creation (for Google Sheets)
const queueAdmission = async (admissionData) => {
    try {
        // if (!admissionData.courseId || !admissionData.batchId) {
        //     await trackEvent({
        //         event: 'registration_invalid',
        //         data: { reason: 'missing_course_or_batch' },
        //     });
        //     throw new Error('Course and Batch are required');
        // }
        const job = await admissionQueue.add('admission-registration', { admissionData }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: 100,
            removeOnFail: 50,
        });
        // 🔥 TRACK QUEUE ADDED
        // await trackEvent({
        //     event: 'registration_queued',
        //     data: {
        //         jobId: job.id,
        //         phone: admissionData.phone,
        //     },
        // });
        logger_1.default.info(`Admission job ${job.id} queued`);
        return {
            jobId: job.id,
            message: 'Admission registration is being processed',
            status: 'queued',
        };
    }
    catch (error) {
        logger_1.default.error(error, 'Error queueing admission:');
        throw error;
    }
};
exports.queueAdmission = queueAdmission;
// Original service functions
const getAllAdmissions = async () => {
    try {
        const admissions = await admission_model_1.Admission.find()
            .populate('courseId', 'name price discount')
            .populate('batchId', 'name code registrationStart registrationEnd')
            .sort({ registeredAt: -1 })
            .lean();
        return admissions;
    }
    catch (error) {
        console.error('Database error in getAllAdmissions:', error);
        return [];
    }
};
const getAdmissionById = async (id) => {
    const admission = await admission_model_1.Admission.findById(id)
        .populate('courseId', 'name description price discount paymentCharge')
        .populate('batchId', 'name code description registrationStart registrationEnd')
        .lean();
    if (!admission) {
        throw new AppError_1.default(404, 'Admission not found');
    }
    return admission;
};
const getAdmissionsByBatchId = async (batchId) => {
    try {
        const admissions = await admission_model_1.Admission.find({ batchId })
            .populate('courseId', 'name price')
            .sort({ registeredAt: -1 })
            .lean();
        return admissions;
    }
    catch (error) {
        console.error('Database error in getAdmissionsByBatchId:', error);
        return [];
    }
};
// Original createAdmission (sync version)
const createAdmission = async (admissionData) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        // Validate course exists
        const course = await course_model_1.Course.findById(admissionData.courseId).session(session);
        if (!course) {
            throw new AppError_1.default(404, 'Course not found');
        }
        // Validate batch exists and is active
        const batch = await coursebatch_model_1.CourseBatch.findById(admissionData.batchId).session(session);
        if (!batch) {
            throw new AppError_1.default(404, 'Batch not found');
        }
        if (!batch.isActive) {
            throw new AppError_1.default(400, 'Batch is not active for admissions');
        }
        // Check if registration deadline has passed
        const now = new Date();
        if (batch.registrationEnd && now > batch.registrationEnd) {
            throw new AppError_1.default(400, 'Registration deadline has passed');
        }
        // Create admission
        const [admission] = await admission_model_1.Admission.create([admissionData], { session });
        await session.commitTransaction();
        session.endSession();
        // If you want immediate Google Sheets sync (not recommended for production)
        // await sendAdmissionToGoogleSheets(admission, course, batch);
        return admission;
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        if (error instanceof AppError_1.default) {
            throw error;
        }
        throw new AppError_1.default(400, 'Validation failed: ' + error.message);
    }
};
const updateAdmission = async (id, admissionData) => {
    const admission = await admission_model_1.Admission.findByIdAndUpdate(id, admissionData, {
        new: true,
        runValidators: true,
    }).lean();
    if (!admission) {
        throw new AppError_1.default(404, 'Admission not found');
    }
    return admission;
};
const deleteAdmission = async (id) => {
    const admission = await admission_model_1.Admission.findByIdAndDelete(id);
    if (!admission) {
        throw new AppError_1.default(404, 'Admission not found');
    }
};
const updateAdmissionStatus = async (id, status) => {
    const admission = await admission_model_1.Admission.findByIdAndUpdate(id, { status }, { new: true, runValidators: true }).lean();
    if (!admission) {
        throw new AppError_1.default(404, 'Admission not found');
    }
    return admission;
};
const updatePaymentStatus = async (id, paymentStatus) => {
    const admission = await admission_model_1.Admission.findByIdAndUpdate(id, { paymentStatus }, { new: true, runValidators: true }).lean();
    if (!admission) {
        throw new AppError_1.default(404, 'Admission not found');
    }
    return admission;
};
exports.admissionService = {
    getAllAdmissions,
    getAdmissionById,
    getAdmissionsByBatchId,
    createAdmission,
    updateAdmission,
    deleteAdmission,
    updateAdmissionStatus,
    updatePaymentStatus,
};

/* eslint-disable no-console */
import { Queue } from 'bullmq';
import mongoose from 'mongoose';
import AppError from 'src/errors/AppError';
import { Admission, type IAdmission } from './admission.model';
import { Course } from '../course/course.model';
import { CourseBatch } from '../coursebatch/coursebatch.model';
import logger from '@/shared/logger';
import { appendDataToGoogleSheet } from '@/utils/googleSheets';
import { redisConnection } from 'src/queues/connection';

const admissionQueue = new Queue('admission-queue', {
    connection: redisConnection,
});

// Queue-based admission creation (for Google Sheets)
export const queueAdmission = async (admissionData: any) => {
    try {
        // Validate required fields
        if (!admissionData.courseId || !admissionData.batchId) {
            throw new Error('Course and Batch are required');
        }

        // Add admission to queue for processing
        const job = await admissionQueue.add(
            'admission-registration',
            {
                admissionData,
            },
            {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000,
                },
                removeOnComplete: 100,
                removeOnFail: 50,
            },
        );

        logger.info(`Admission job ${job.id} queued for processing`);

        return {
            jobId: job.id,
            message: 'Admission registration is being processed',
            status: 'queued',
        };
    } catch (error: any) {
        logger.error('Error queueing admission:', error);
        throw error;
    }
};

// Original service functions
const getAllAdmissions = async (): Promise<IAdmission[]> => {
    try {
        const admissions = await Admission.find()
            .populate('courseId', 'name price discount')
            .populate('batchId', 'name code registrationStart registrationEnd')
            .sort({ registeredAt: -1 })
            .lean<IAdmission[]>();

        return admissions;
    } catch (error: any) {
        console.error('Database error in getAllAdmissions:', error);
        return [];
    }
};

const getAdmissionById = async (id: string): Promise<IAdmission> => {
    const admission = await Admission.findById(id)
        .populate('courseId', 'name description price discount paymentCharge')
        .populate('batchId', 'name code description registrationStart registrationEnd')
        .lean<IAdmission>();

    if (!admission) {
        throw new AppError(404, 'Admission not found');
    }
    return admission;
};

const getAdmissionsByBatchId = async (batchId: string): Promise<IAdmission[]> => {
    try {
        const admissions = await Admission.find({ batchId })
            .populate('courseId', 'name price')
            .sort({ registeredAt: -1 })
            .lean<IAdmission[]>();

        return admissions;
    } catch (error: any) {
        console.error('Database error in getAdmissionsByBatchId:', error);
        return [];
    }
};

// Original createAdmission (sync version)
const createAdmission = async (admissionData: Partial<IAdmission>): Promise<IAdmission> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Validate course exists
        const course = await Course.findById(admissionData.courseId).session(session);
        if (!course) {
            throw new AppError(404, 'Course not found');
        }

        // Validate batch exists and is active
        const batch = await CourseBatch.findById(admissionData.batchId).session(session);
        if (!batch) {
            throw new AppError(404, 'Batch not found');
        }

        if (!batch.isActive) {
            throw new AppError(400, 'Batch is not active for admissions');
        }

        // Check if registration deadline has passed
        const now = new Date();
        if (batch.registrationEnd && now > batch.registrationEnd) {
            throw new AppError(400, 'Registration deadline has passed');
        }

        // Create admission
        const [admission] = await Admission.create([admissionData], { session });

        await session.commitTransaction();
        session.endSession();

        // If you want immediate Google Sheets sync (not recommended for production)
        // await sendAdmissionToGoogleSheets(admission, course, batch);

        return admission;
    } catch (error: any) {
        await session.abortTransaction();
        session.endSession();
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError(400, 'Validation failed: ' + error.message);
    }
};

// Google Sheets helper (optional, for sync version)
async function sendAdmissionToGoogleSheets(admission: IAdmission, course: any, batch: any) {
    try {
        const registrationDate = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });

        const discountAmount = admission.discountAmount || 0;
        const baseAmount = admission.amount || course.price;
        const paymentCharge = course.paymentCharge || 0;
        const finalAmount = baseAmount - discountAmount + paymentCharge;

        const sheetTitle = `${course.name.replace(/\s+/g, '-')}-Admissions`;

        await appendDataToGoogleSheet(
            sheetTitle,
            [
                'Name',
                'Phone',
                'WhatsApp',
                'Email',
                'Facebook',
                'Occupation',
                'Address',
                'Course',
                'Batch',
                'Course Price',
                'Payment Charge',
                'Discount Amount',
                'Final Amount',
                'Payment Method',
                'Sender Number',
                'Coupon Code',
                'Status',
                'Payment Status',
                'Notes',
                'Registered At',
            ],
            [
                admission.name || '',
                admission.phone || '',
                admission.whatsapp || '',
                admission.email || '',
                admission.facebook || '',
                admission.occupation || '',
                admission.address || '',
                course.name || '',
                batch.name || '',
                course.price?.toString() || '0',
                paymentCharge.toString() || '0',
                discountAmount.toString() || '0',
                finalAmount.toString() || '0',
                admission.paymentMethod || '',
                admission.senderNumber || '',
                admission.couponCode || '',
                admission.status || 'pending',
                admission.paymentStatus || 'pending',
                admission.notes || '',
                registrationDate,
            ],
        );

        logger.info(`Admission data sent to Google Sheets: ${sheetTitle}`);
    } catch (error: any) {
        logger.error('Failed to send admission to Google Sheets:', error);
        // Don't throw error here - admission is already saved to DB
    }
}

const updateAdmission = async (
    id: string,
    admissionData: Partial<IAdmission>,
): Promise<IAdmission> => {
    const admission = await Admission.findByIdAndUpdate(id, admissionData, {
        new: true,
        runValidators: true,
    }).lean<IAdmission>();

    if (!admission) {
        throw new AppError(404, 'Admission not found');
    }
    return admission;
};

const deleteAdmission = async (id: string): Promise<void> => {
    const admission = await Admission.findByIdAndDelete(id);
    if (!admission) {
        throw new AppError(404, 'Admission not found');
    }
};

const updateAdmissionStatus = async (
    id: string,
    status: IAdmission['status'],
): Promise<IAdmission> => {
    const admission = await Admission.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true },
    ).lean<IAdmission>();

    if (!admission) {
        throw new AppError(404, 'Admission not found');
    }
    return admission;
};

const updatePaymentStatus = async (
    id: string,
    paymentStatus: IAdmission['paymentStatus'],
): Promise<IAdmission> => {
    const admission = await Admission.findByIdAndUpdate(
        id,
        { paymentStatus },
        { new: true, runValidators: true },
    ).lean<IAdmission>();

    if (!admission) {
        throw new AppError(404, 'Admission not found');
    }
    return admission;
};

export const admissionService = {
    getAllAdmissions,
    getAdmissionById,
    getAdmissionsByBatchId,
    createAdmission,
    updateAdmission,
    deleteAdmission,
    updateAdmissionStatus,
    updatePaymentStatus,
};

// export { queueAdmission };

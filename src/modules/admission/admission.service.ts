// server/services/admission.service.ts
import AppError from 'src/errors/AppError';
import { Course } from '../course/course.model';
import { Admission, type IAdmission } from './admission.model';
import { CourseBatch } from '../coursebatch/coursebatch.model';

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

const createAdmission = async (admissionData: Partial<IAdmission>): Promise<IAdmission> => {
    try {
        // Validate course exists
        const course = await Course.findById(admissionData.courseId);
        if (!course) {
            throw new AppError(404, 'Course not found');
        }

        // Validate batch exists and is active
        const batch = await CourseBatch.findById(admissionData.batchId);
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

        const admission = new Admission(admissionData);
        await admission.save();

        return admission;
    } catch (error: any) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError(400, 'Validation failed: ' + error.message);
    }
};

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

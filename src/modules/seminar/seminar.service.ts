// server/services/seminar.service.ts

import AppError from 'src/errors/AppError';
import { Seminar } from './seminar.model';
import type { ISeminar } from './seminar.interface';

const getAllSeminars = async (): Promise<ISeminar[]> => {
    try {
        const seminars = await Seminar.find().sort({ createdAt: -1 });
        return seminars;
    } catch (error: any) {
        console.error('Database error in getAllSeminars:', error);
        return [];
    }
};

// Also check your createSeminar function
const createSeminar = async (seminarData: Partial<ISeminar>): Promise<ISeminar> => {
    try {
        console.log('Creating seminar with data:', seminarData);

        const seminar = new Seminar(seminarData);
        await seminar.save();

        console.log('Seminar created successfully with ID:', seminar._id);
        return seminar;
    } catch (error: any) {
        console.error('Error creating seminar:', error);
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            code: error.code,
            validationErrors: error.errors,
        });
        throw new AppError(400, 'Validation failed: ' + error.message);
    }
};

const getSeminarById = async (id: string): Promise<ISeminar> => {
    // Remove populate temporarily
    const seminar = await Seminar.findById(id);

    if (!seminar) {
        throw new AppError(404, 'Seminar not found');
    }
    return seminar;
};

const updateSeminar = async (id: string, seminarData: Partial<ISeminar>): Promise<ISeminar> => {
    const seminar = await Seminar.findByIdAndUpdate(id, seminarData, {
        new: true,
        runValidators: true,
    });
    if (!seminar) {
        throw new AppError(404, 'Seminar not found');
    }
    return seminar;
};

const deleteSeminar = async (id: string): Promise<void> => {
    const seminar = await Seminar.findByIdAndDelete(id);
    if (!seminar) {
        throw new AppError(404, 'Seminar not found');
    }
};

const changeStatus = async (id: string, isActive: boolean): Promise<ISeminar> => {
    const seminar = await Seminar.findByIdAndUpdate(id, { isActive }, { new: true });
    if (!seminar) {
        throw new AppError(404, 'Seminar not found');
    }
    return seminar;
};

const getActiveSeminar = async (): Promise<ISeminar | null> => {
    try {
        const now = new Date();

        // Find seminar that is active and registration deadline hasn't passed
        const seminar = await Seminar.findOne({
            isActive: true,
            registrationDeadline: { $gte: now },
        }).sort({ date: 1 }); // Get the earliest upcoming seminar

        return seminar;
    } catch (error: any) {
        console.error('Database error in getActiveSeminar:', error);
        return null;
    }
};

export const seminarService = {
    createSeminar,
    getAllSeminars,
    getSeminarById,
    updateSeminar,
    deleteSeminar,
    changeStatus,
    getActiveSeminar,
};

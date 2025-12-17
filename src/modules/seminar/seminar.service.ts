// server/services/seminar.service.ts

import AppError from 'src/errors/AppError';
import type { ISeminar } from './seminar.model';
import { Seminar } from './seminar.model';

const getAllSeminars = async (): Promise<ISeminar[]> => {
    try {
        console.log('Fetching seminars from database...');

        // Try without populate first to see if it's a population issue
        const seminars = await Seminar.find().sort({ createdAt: -1 });
        // If that works, try with populate:
        // const seminars = await Seminar.find()
        //   .sort({ createdAt: -1 })
        //   .populate('participants');

        console.log(`Found ${seminars.length} seminars`);
        return seminars;
    } catch (error: any) {
        console.error('Database error in getAllSeminars:', error);
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            code: error.code,
            stack: error.stack,
        });

        // Don't throw AppError, just return empty array for now
        return [];
        // Or if you want to throw:
        // throw new AppError(500, 'Database error: ' + error.message);
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

export const seminarService = {
    createSeminar,
    getAllSeminars,
    getSeminarById,
    updateSeminar,
    deleteSeminar,
    changeStatus,
};

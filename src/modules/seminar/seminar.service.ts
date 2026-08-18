import AppError from 'src/errors/AppError';
import { Seminar } from './seminar.model';
import type { ISeminar } from './seminar.interface';

const PUBLIC_FIELDS = 'sl title description date registrationDeadline isActive createdAt updatedAt';

const getAllSeminars = async (): Promise<ISeminar[]> => {
    try {
        const seminars = await Seminar.find()
            .select(PUBLIC_FIELDS)
            .sort({ createdAt: -1 });
        return seminars;
    } catch (error: any) {
        throw new AppError(500, 'Database error: ' + error.message);
    }
};

// Also check your createSeminar function
const createSeminar = async (seminarData: Partial<ISeminar>): Promise<ISeminar> => {
    try {
        // console.log('Creating seminar with data:', seminarData);

        const seminar = new Seminar(seminarData);
        await seminar.save();

        // console.log('Seminar created successfully with ID:', seminar._id);
        return seminar;
    } catch (error: any) {
        throw new AppError(400, 'Validation failed: ' + error.message);
    }
};

const getSeminarById = async (id: string): Promise<ISeminar> => {
    const seminar = await Seminar.findById(id).lean();

    if (!seminar) {
        throw new AppError(404, 'Seminar not found');
    }
    return seminar as unknown as ISeminar;
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
        // Subtract 6 hours to align stored UTC deadline with BD time
        const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

        const seminar = await Seminar.findOne({
            isActive: true,
            registrationDeadline: { $gte: sixHoursAgo },
        })
            .select(PUBLIC_FIELDS)
            .sort({ date: 1 })
            .lean();

        return seminar as unknown as ISeminar | null;
    } catch (error: any) {
        return null;
    }
};

const getPdfSeminar = async (): Promise<ISeminar | null> => {
    try {
        const seminar = await Seminar.findOne({})
            .select(PUBLIC_FIELDS)
            .sort({ date: -1 })
            .lean();
        return seminar as unknown as ISeminar | null;
    } catch (error: any) {
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
    getPdfSeminar,
};

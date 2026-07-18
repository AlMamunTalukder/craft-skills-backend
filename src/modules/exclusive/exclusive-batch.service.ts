import AppError from 'src/errors/AppError';
import { ExclusiveBatch } from './exclusive-batch.model';
import type { IExclusiveBatch } from './exclusive-batch.model';

const getAllBatches = async (): Promise<IExclusiveBatch[]> => {
    try {
        const batches = await ExclusiveBatch.find().sort({ batchNo: -1 }).populate('participants');
        return batches;
    } catch (error: any) {
        throw new AppError(500, 'Database error: ' + error.message);
    }
};

const getActiveBatch = async (): Promise<IExclusiveBatch | null> => {
    try {
        const now = new Date();
        const batch = await ExclusiveBatch.findOne({
            isActive: true,
            registrationDeadline: { $gte: now },
        })
            .sort({ date: 1 })
            .populate('participants');
        return batch;
    } catch (error: any) {
        return null;
    }
};

// ✅ FIX: Populate participants in getBatchById
const getBatchById = async (id: string): Promise<IExclusiveBatch> => {
    const batch = await ExclusiveBatch.findById(id).populate({
        path: 'participants',
        options: { sort: { createdAt: -1 } },
    });
    if (!batch) {
        throw new AppError(404, 'Batch not found');
    }
    return batch;
};

const createBatch = async (batchData: Partial<IExclusiveBatch>): Promise<IExclusiveBatch> => {
    try {
        const existing = await ExclusiveBatch.findOne({
            batchNo: batchData.batchNo,
        });
        if (existing) {
            throw new AppError(400, `Batch number ${batchData.batchNo} already exists`);
        }
        const batch = new ExclusiveBatch(batchData);
        await batch.save();
        return batch;
    } catch (error: any) {
        if (error instanceof AppError) throw error;
        throw new AppError(400, 'Validation failed: ' + error.message);
    }
};

const updateBatch = async (
    id: string,
    batchData: Partial<IExclusiveBatch>,
): Promise<IExclusiveBatch> => {
    const batch = await ExclusiveBatch.findByIdAndUpdate(id, batchData, {
        new: true,
        runValidators: true,
    });
    if (!batch) {
        throw new AppError(404, 'Batch not found');
    }
    return batch;
};

const deleteBatch = async (id: string): Promise<void> => {
    const batch = await ExclusiveBatch.findByIdAndDelete(id);
    if (!batch) {
        throw new AppError(404, 'Batch not found');
    }
};

const changeStatus = async (id: string, isActive: boolean): Promise<IExclusiveBatch> => {
    const batch = await ExclusiveBatch.findByIdAndUpdate(id, { isActive }, { new: true });
    if (!batch) {
        throw new AppError(404, 'Batch not found');
    }
    return batch;
};

export const exclusiveBatchService = {
    getAllBatches,
    getActiveBatch,
    getBatchById,
    createBatch,
    updateBatch,
    deleteBatch,
    changeStatus,
};

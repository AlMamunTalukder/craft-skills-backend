// server/services/coursebatch.service.ts
import type { ICourseBatch } from './coursebatch.model';
import { CourseBatch } from './coursebatch.model';

// server/services/coursebatch.service.ts
const getAllBatches = async (): Promise<ICourseBatch[]> => {
    const batches = await CourseBatch.find()
        .select(
            'name code description registrationStart registrationEnd isActive facebookSecretGroup messengerSecretGroup createdAt',
        ) // Add fields here
        .sort({ createdAt: -1 })
        .lean<ICourseBatch[]>();

    // Ensure all batches have the fields
    return batches.map((batch) => ({
        ...batch,
        facebookSecretGroup: batch.facebookSecretGroup || '',
        messengerSecretGroup: batch.messengerSecretGroup || '',
    }));
};

const getBatchById = async (id: string): Promise<ICourseBatch> => {
    const batch = await CourseBatch.findById(id).lean<ICourseBatch>(); // Add generic type here
    if (!batch) throw new Error('Batch not found');
    return batch;
};

const createBatch = async (batchData: Partial<ICourseBatch>): Promise<ICourseBatch> => {
    const batch = new CourseBatch(batchData);
    return await batch.save();
};

const updateBatch = async (id: string, batchData: Partial<ICourseBatch>): Promise<ICourseBatch> => {
    const batch = await CourseBatch.findByIdAndUpdate(id, batchData, {
        new: true,
        runValidators: true,
        lean: true,
    }).lean<ICourseBatch>(); // Add generic type here

    if (!batch) throw new Error('Batch not found');
    return batch;
};

const deleteBatch = async (id: string): Promise<void> => {
    const batch = await CourseBatch.findByIdAndDelete(id);
    if (!batch) throw new Error('Batch not found');
};

const changeStatus = async (id: string, isActive: boolean): Promise<ICourseBatch> => {
    // If activating a batch, deactivate all others
    if (isActive) {
        await CourseBatch.updateMany({ _id: { $ne: id } }, { isActive: false });
    }

    const batch = await CourseBatch.findByIdAndUpdate(
        id,
        { isActive },
        { new: true, lean: true },
    ).lean<ICourseBatch>(); // Add generic type here

    if (!batch) throw new Error('Batch not found');
    return batch;
};

const getActiveBatch = async (): Promise<ICourseBatch | null> => {
    const batch = await CourseBatch.findOne({ isActive: true }).lean<ICourseBatch>(); // Add generic type here
    return batch;
};

export const courseBatchService = {
    getAllBatches,
    getBatchById,
    createBatch,
    updateBatch,
    deleteBatch,
    changeStatus,
    getActiveBatch,
};

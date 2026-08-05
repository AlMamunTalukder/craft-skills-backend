import AppError from 'src/errors/AppError';
import redisClient from 'src/config/redis';
import { ExclusiveBatch } from './exclusive-batch.model';
import type { IExclusiveBatch } from './exclusive-batch.model';

const ACTIVE_BATCH_CACHE_KEY = 'exclusive:active-batch';
const ACTIVE_BATCH_CACHE_TTL = 30; // seconds

// Public list: the participants ObjectId array is unbounded (it grows with every
// registration). Never ship it to public list/active endpoints — the dashboard
// and public site only need the batch metadata.
const PUBLIC_BATCH_SELECT = '-participants';

const clearActiveBatchCache = async (): Promise<void> => {
    if (!redisClient?.isReady) return;
    try {
        await redisClient.del(ACTIVE_BATCH_CACHE_KEY);
    } catch {
        // Fail-open: cache invalidation is best-effort
    }
};

const getAllBatches = async (): Promise<IExclusiveBatch[]> => {
    try {
        const batches = await ExclusiveBatch.find()
            .select(PUBLIC_BATCH_SELECT)
            .sort({ batchNo: -1 })
            .lean();
        return batches as unknown as IExclusiveBatch[];
    } catch (error: any) {
        throw new AppError(500, 'Database error: ' + error.message);
    }
};

const getActiveBatch = async (): Promise<IExclusiveBatch | null> => {
    // Redis cache (short TTL) absorbs the thundering herd of page loads from
    // every visitor hitting /exclusive-batches/active. Fail-open to MongoDB.
    if (redisClient?.isReady) {
        try {
            const cached = await redisClient.get(ACTIVE_BATCH_CACHE_KEY);
            if (cached) {
                return JSON.parse(cached) as IExclusiveBatch;
            }
        } catch {
            // fall through to MongoDB
        }
    }

    try {
        const now = new Date();
        const batch = await ExclusiveBatch.findOne({
            isActive: true,
            registrationDeadline: { $gte: now },
        })
            .select(PUBLIC_BATCH_SELECT)
            .sort({ date: 1 })
            .lean();

        if (batch && redisClient?.isReady) {
            try {
                await redisClient.set(
                    ACTIVE_BATCH_CACHE_KEY,
                    JSON.stringify(batch),
                    { EX: ACTIVE_BATCH_CACHE_TTL },
                );
            } catch {
                // fail-open: cache write is best-effort
            }
        }
        return batch as unknown as IExclusiveBatch | null;
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
        await clearActiveBatchCache();
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
    await clearActiveBatchCache();
    return batch;
};

const deleteBatch = async (id: string): Promise<void> => {
    const batch = await ExclusiveBatch.findByIdAndDelete(id);
    if (!batch) {
        throw new AppError(404, 'Batch not found');
    }
    await clearActiveBatchCache();
};

const changeStatus = async (id: string, isActive: boolean): Promise<IExclusiveBatch> => {
    const batch = await ExclusiveBatch.findByIdAndUpdate(id, { isActive }, { new: true });
    if (!batch) {
        throw new AppError(404, 'Batch not found');
    }
    await clearActiveBatchCache();
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

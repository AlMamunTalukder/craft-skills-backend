"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exclusiveBatchService = void 0;
const AppError_1 = __importDefault(require("../../errors/AppError"));
const redis_1 = __importDefault(require("../../config/redis"));
const exclusive_batch_model_1 = require("./exclusive-batch.model");
const ACTIVE_BATCH_CACHE_KEY = 'exclusive:active-batch';
const ACTIVE_BATCH_CACHE_TTL = 30; // seconds
// Public list: the participants ObjectId array is unbounded (it grows with every
// registration). Never ship it to public list/active endpoints — the dashboard
// and public site only need the batch metadata.
const PUBLIC_BATCH_SELECT = '-participants';
const clearActiveBatchCache = async () => {
    if (!redis_1.default?.isReady)
        return;
    try {
        await redis_1.default.del(ACTIVE_BATCH_CACHE_KEY);
    }
    catch {
        // Fail-open: cache invalidation is best-effort
    }
};
const getAllBatches = async () => {
    try {
        const batches = await exclusive_batch_model_1.ExclusiveBatch.find()
            .select(PUBLIC_BATCH_SELECT)
            .sort({ batchNo: -1 })
            .lean();
        return batches;
    }
    catch (error) {
        throw new AppError_1.default(500, 'Database error: ' + error.message);
    }
};
const getActiveBatch = async () => {
    // Redis cache (short TTL) absorbs the thundering herd of page loads from
    // every visitor hitting /exclusive-batches/active. Fail-open to MongoDB.
    if (redis_1.default?.isReady) {
        try {
            const cached = await redis_1.default.get(ACTIVE_BATCH_CACHE_KEY);
            if (cached) {
                return JSON.parse(cached);
            }
        }
        catch {
            // fall through to MongoDB
        }
    }
    try {
        const now = new Date();
        const batch = await exclusive_batch_model_1.ExclusiveBatch.findOne({
            isActive: true,
            registrationDeadline: { $gte: now },
        })
            .select(PUBLIC_BATCH_SELECT)
            .sort({ date: 1 })
            .lean();
        if (batch && redis_1.default?.isReady) {
            try {
                await redis_1.default.set(ACTIVE_BATCH_CACHE_KEY, JSON.stringify(batch), { EX: ACTIVE_BATCH_CACHE_TTL });
            }
            catch {
                // fail-open: cache write is best-effort
            }
        }
        return batch;
    }
    catch (error) {
        return null;
    }
};
// ✅ FIX: Populate participants in getBatchById
const getBatchById = async (id) => {
    const batch = await exclusive_batch_model_1.ExclusiveBatch.findById(id).populate({
        path: 'participants',
        options: { sort: { createdAt: -1 } },
    });
    if (!batch) {
        throw new AppError_1.default(404, 'Batch not found');
    }
    return batch;
};
const createBatch = async (batchData) => {
    try {
        const existing = await exclusive_batch_model_1.ExclusiveBatch.findOne({
            batchNo: batchData.batchNo,
        });
        if (existing) {
            throw new AppError_1.default(400, `Batch number ${batchData.batchNo} already exists`);
        }
        const batch = new exclusive_batch_model_1.ExclusiveBatch(batchData);
        await batch.save();
        await clearActiveBatchCache();
        return batch;
    }
    catch (error) {
        if (error instanceof AppError_1.default)
            throw error;
        throw new AppError_1.default(400, 'Validation failed: ' + error.message);
    }
};
const updateBatch = async (id, batchData) => {
    const batch = await exclusive_batch_model_1.ExclusiveBatch.findByIdAndUpdate(id, batchData, {
        new: true,
        runValidators: true,
    });
    if (!batch) {
        throw new AppError_1.default(404, 'Batch not found');
    }
    await clearActiveBatchCache();
    return batch;
};
const deleteBatch = async (id) => {
    const batch = await exclusive_batch_model_1.ExclusiveBatch.findByIdAndDelete(id);
    if (!batch) {
        throw new AppError_1.default(404, 'Batch not found');
    }
    await clearActiveBatchCache();
};
const changeStatus = async (id, isActive) => {
    const batch = await exclusive_batch_model_1.ExclusiveBatch.findByIdAndUpdate(id, { isActive }, { new: true });
    if (!batch) {
        throw new AppError_1.default(404, 'Batch not found');
    }
    await clearActiveBatchCache();
    return batch;
};
exports.exclusiveBatchService = {
    getAllBatches,
    getActiveBatch,
    getBatchById,
    createBatch,
    updateBatch,
    deleteBatch,
    changeStatus,
};

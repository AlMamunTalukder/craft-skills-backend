import AppError from 'src/errors/AppError';
import { ExclusiveBatch } from './exclusive-batch.model';
import type { IExclusiveBatch } from './exclusive-batch.model';
import { exclusiveGiftQueue } from 'src/queues/exclusive-gift.queue';

const confirmGift = async (data: any): Promise<{ message: string; confirmation: any }> => {
    try {
        const { batchId, ...giftData } = data;

        // Validate batch exists if one was supplied
        let batch = null;
        if (batchId) {
            batch = await ExclusiveBatch.findById(batchId);
            if (!batch) {
                throw new AppError(404, 'Batch not found');
            }
        }

        // Sheet name always uses the LAST batch number (highest batchNo),
        // regardless of whether the batch is active or inactive.
        const lastBatch: IExclusiveBatch | null = await ExclusiveBatch.findOne()
            .sort({ batchNo: -1 })
            .select('batchNo title');

        const effectiveBatch: IExclusiveBatch | null = batch ?? lastBatch;
        if (!effectiveBatch) {
            throw new AppError(404, 'No batch found');
        }

        const sheetBatchNo = lastBatch?.batchNo ?? effectiveBatch.batchNo ?? '1';

        // Add job to queue for processing
        await exclusiveGiftQueue.add('confirm-gift', {
            giftData: {
                ...giftData,
                batchId: effectiveBatch._id.toString(),
                confirmedAt: new Date(),
            },
            batchTitle: effectiveBatch.title,
            sheetBatchNo,
        });

        return {
            message: 'Gift confirmation received! You will receive your gift shortly.',
            confirmation: giftData,
        };
    } catch (error: any) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError(500, error.message || 'Confirmation failed');
    }
};

export const exclusiveGiftService = { confirmGift };

import AppError from 'src/errors/AppError';
import { ExclusiveBatch } from './exclusive-batch.model';
import { exclusiveGiftQueue } from 'src/queues/exclusive-gift.queue';

const confirmGift = async (data: any): Promise<{ message: string; confirmation: any }> => {
    try {
        const { batchId, ...giftData } = data;

        // Validate batch exists
        const batch = await ExclusiveBatch.findById(batchId);
        if (!batch) {
            throw new AppError(404, 'Batch not found');
        }

        // Add job to queue for processing
        await exclusiveGiftQueue.add('confirm-gift', {
            giftData: {
                ...giftData,
                batchId,
                confirmedAt: new Date(),
            },
            batchTitle: batch.title,
            batchNo: batch.batchNo,
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
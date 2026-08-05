"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exclusiveGiftService = void 0;
const AppError_1 = __importDefault(require("../../errors/AppError"));
const exclusive_batch_model_1 = require("./exclusive-batch.model");
const exclusive_gift_queue_1 = require("../../queues/exclusive-gift.queue");
const confirmGift = async (data) => {
    try {
        const { batchId, ...giftData } = data;
        // Validate batch exists
        const batch = await exclusive_batch_model_1.ExclusiveBatch.findById(batchId);
        if (!batch) {
            throw new AppError_1.default(404, 'Batch not found');
        }
        // Add job to queue for processing
        await exclusive_gift_queue_1.exclusiveGiftQueue.add('confirm-gift', {
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
    }
    catch (error) {
        if (error instanceof AppError_1.default) {
            throw error;
        }
        throw new AppError_1.default(500, error.message || 'Confirmation failed');
    }
};
exports.exclusiveGiftService = { confirmGift };

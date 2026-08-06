"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const mongoose_1 = __importDefault(require("mongoose"));
const connection_1 = require("../queues/connection");
const googleSheets_1 = require("../utils/googleSheets");
const logger_1 = __importDefault(require("../shared/logger"));
const exclusive_gift_model_1 = require("../modules/exclusive/exclusive-gift.model");
const phoneSanitizer_1 = require("../utils/phoneSanitizer");
new bullmq_1.Worker('exclusive-gift-queue', async (job) => {
    const { giftData, sheetBatchNo } = job.data;
    const cleanPhone = (0, phoneSanitizer_1.sanitizePhoneNumber)(giftData.phone) || giftData.phone;
    const cleanWhatsapp = (0, phoneSanitizer_1.sanitizePhoneNumber)(giftData.whatsapp) || giftData.whatsapp;
    logger_1.default.info(`Processing exclusive gift for: ${cleanPhone}`);
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const [gift] = await exclusive_gift_model_1.ExclusiveGift.create([
            {
                ...giftData,
                phone: cleanPhone,
                whatsapp: cleanWhatsapp,
            },
        ], { session });
        await session.commitTransaction();
        session.endSession();
        const confirmationDate = new Date().toLocaleString('en-BD', {
            timeZone: 'Asia/Dhaka',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
        const sheetTitle = `Exclusive Gift Batch - ${sheetBatchNo ?? '1'}`;
        await (0, googleSheets_1.appendDataToGoogleSheet)(sheetTitle, ['Name', 'Phone', 'WhatsApp', 'Email', 'Occupation', 'Address', 'Confirmed At'], [
            gift.name || '',
            cleanPhone,
            cleanWhatsapp,
            gift.email || '',
            gift.occupation || '',
            gift.address || '',
            confirmationDate,
        ]);
        logger_1.default.info(`✅ Exclusive gift confirmed for: ${gift.name}`);
        return gift;
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        logger_1.default.error({ error }, `Error processing job ${job.id}: ${error.message}`);
        throw error;
    }
}, {
    connection: connection_1.redisConnection,
});

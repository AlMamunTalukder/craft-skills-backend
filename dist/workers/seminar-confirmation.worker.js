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
const seminar_confirmation_model_1 = require("../modules/seminar-confirmation/seminar-confirmation.model");
const phoneSanitizer_1 = require("../utils/phoneSanitizer");
new bullmq_1.Worker('seminar-confirmation-queue', async (job) => {
    const { confirmationData, seminarTitle } = job.data;
    // --- CLEAN NUMBERS ---
    const cleanPhone = (0, phoneSanitizer_1.sanitizePhoneNumber)(confirmationData.phone) || confirmationData.phone;
    const cleanWhatsapp = (0, phoneSanitizer_1.sanitizePhoneNumber)(confirmationData.whatsapp) || confirmationData.whatsapp;
    logger_1.default.info(`Processing confirmation for: ${cleanPhone}`);
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        // 1. Create confirmation record with CLEANED data
        const [confirmation] = await seminar_confirmation_model_1.SeminarConfirmation.create([
            {
                ...confirmationData,
                phone: cleanPhone,
                whatsapp: cleanWhatsapp,
            },
        ], { session });
        await session.commitTransaction();
        session.endSession();
        // 2. Append to Google Sheet
        const confirmationDate = new Date().toLocaleString('en-BD', {
            timeZone: 'Asia/Dhaka',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
        const sheetTitle = `${seminarTitle}-confirmation (pdf)`;
        await (0, googleSheets_1.appendDataToGoogleSheet)(sheetTitle, ['Name', 'Phone', 'WhatsApp', 'Email', 'Occupation', 'Address', 'Confirmed At'], [
            confirmation.name || '',
            cleanPhone, // Pure English Format (8801...)
            cleanWhatsapp, // Pure English Format (8801...)
            confirmation.email || '',
            confirmation.occupation || '',
            confirmation.address || '',
            confirmationDate,
        ]);
        return confirmation;
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

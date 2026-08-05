"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const mongoose_1 = __importDefault(require("mongoose"));
const connection_1 = require("../queues/connection");
const seminar_model_1 = require("../modules/seminar/seminar.model");
const googleSheets_1 = require("../utils/googleSheets");
const logger_1 = __importDefault(require("../shared/logger"));
const phoneSanitizer_1 = require("../utils/phoneSanitizer");
new bullmq_1.Worker('participant-queue', async (job) => {
    const { participantData } = job.data;
    // --- 1. CLEAN THE NUMBERS (ENGLISH ONLY & 880... FORMAT) ---
    const cleanPhone = (0, phoneSanitizer_1.sanitizePhoneNumber)(participantData.phone) || participantData.phone;
    const cleanWhatsapp = (0, phoneSanitizer_1.sanitizePhoneNumber)(participantData.whatsapp) || participantData.whatsapp;
    logger_1.default.info(`Processing registration for: ${participantData.email || cleanPhone}`);
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        // --- 2. CREATE PARTICIPANT WITH CLEANED DATA ---
        const [participant] = await seminar_model_1.Participant.create([
            {
                ...participantData,
                phone: cleanPhone,
                whatsapp: cleanWhatsapp,
            },
        ], { session });
        // 3. Verify seminar exists
        const seminar = await seminar_model_1.Seminar.findById(participantData.seminarId).session(session);
        if (!seminar) {
            throw new Error(`Seminar with ID ${participantData.seminarId} not found`);
        }
        await session.commitTransaction();
        session.endSession();
        logger_1.default.info(`Participant ${participant._id} saved to DB and linked to seminar ${seminar._id}`);
        // 4. Prepare registration date
        const registrationDate = new Date().toLocaleString('en-BD', {
            timeZone: 'Asia/Dhaka',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
        const sheetTitle = `${seminar.sl || 'Seminar'}- ফ্রি সেমিনার`;
        // --- 5. APPEND TO GOOGLE SHEET (PURE ENGLISH DATA) ---
        await (0, googleSheets_1.appendDataToGoogleSheet)(sheetTitle, ['Name', 'Phone', 'WhatsApp', 'Email', 'Occupation', 'Address', 'Registered At'], [
            participant.name || '',
            cleanPhone, // Final check: 8801306659464
            cleanWhatsapp, // Final check: 8801306659464
            participant.email || '',
            participant.occupation || '',
            participant.address || '',
            registrationDate,
        ]);
        logger_1.default.info(`Data successfully appended to Google Sheet: ${sheetTitle}`);
        return participant;
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

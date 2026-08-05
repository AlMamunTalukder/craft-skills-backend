"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const mongoose_1 = __importDefault(require("mongoose"));
const connection_1 = require("../queues/connection");
const logger_1 = __importDefault(require("../shared/logger"));
const googleSheets_1 = require("../utils/googleSheets");
const phoneSanitizer_1 = require("../utils/phoneSanitizer");
const exclusive_offer_model_1 = require("../modules/exclusive/exclusive-offer.model");
const exclusive_batch_model_1 = require("../modules/exclusive/exclusive-batch.model");
new bullmq_1.Worker('exclusive-offer-queue', async (job) => {
    logger_1.default.info({ jobId: job.id }, '🔁 Worker started for job');
    const { participantData } = job.data;
    logger_1.default.info(participantData, '📦 Received participantData');
    const cleanPhone = (0, phoneSanitizer_1.sanitizePhoneNumber)(participantData.phone) || participantData.phone;
    // ✅ Use findOneAndUpdate with upsert to avoid duplicate key errors
    const session = await mongoose_1.default.startSession();
    try {
        session.startTransaction();
        // Build the update object
        const updateData = {
            ...participantData,
            phone: cleanPhone,
            paymentStatus: participantData.paymentStatus || 'success',
        };
        // Upsert: if document exists, update; else create
        const participant = await exclusive_offer_model_1.ExclusiveOfferParticipant.findOneAndUpdate({ transactionId: participantData.transactionId }, { $set: updateData }, {
            new: true,
            upsert: true,
            session,
            setDefaultsOnInsert: true,
        });
        await session.commitTransaction();
        session.endSession();
        logger_1.default.info({ participantId: participant._id }, '💾 Participant saved/updated');
        // ============================
        // FETCH BATCH INFORMATION FOR SHEET NAME
        // ============================
        let batchNo = 'N/A';
        let batchTitle = 'Exclusive Offer Course';
        if (participantData.batchId) {
            try {
                // ✅ Use findById with proper typing
                const batchInfo = (await exclusive_batch_model_1.ExclusiveBatch.findById(participantData.batchId).lean());
                if (batchInfo) {
                    batchNo = batchInfo.batchNo?.toString() || 'N/A';
                    batchTitle = batchInfo.title || 'Exclusive Offer Course';
                    logger_1.default.info(`✅ Found batch: ${batchNo} - ${batchTitle}`);
                }
                else {
                    logger_1.default.warn(`⚠️ Batch not found for ID: ${participantData.batchId}`);
                }
            }
            catch (error) {
                logger_1.default.warn({
                    batchId: participantData.batchId,
                    error: error?.message || 'Unknown error',
                }, '⚠️ Could not fetch batch info');
            }
        }
        // ============================
        // GOOGLE SHEET - Dynamic Sheet Name
        // ============================
        const registrationDate = new Date().toLocaleString('en-BD', {
            timeZone: 'Asia/Dhaka',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
        // ✅ Dynamic sheet name: "Exclusive Offer Course Batch: 1"
        const sheetTitle = `Exclusive Offer Course Batch: ${batchNo}`;
        logger_1.default.info(`📤 Attempting to append to Google Sheet: ${sheetTitle}`);
        // ✅ Headers with only "Added By Admin" added
        const headers = [
            'Name',
            'Phone',
            'WhatsApp',
            'Email',
            'Occupation',
            'Course Title',
            'Offer Price',
            'Transaction ID',
            'Payment Status',
            'Registered At',
            'Added By Admin',
        ];
        // ✅ Data row matching headers
        const rowData = [
            participant.name || participantData.name || '',
            participant.phone || cleanPhone || '',
            participant.whatsapp || participantData.whatsapp || '',
            participant.email || participantData.email || '',
            participant.occupation || participantData.occupation || '',
            participant.courseTitle || batchTitle || 'Voice & Public Speaking Masterclass',
            String(participant.offerPrice || participantData.offerPrice || 199),
            participantData.transactionId || '',
            participantData.paymentStatus || 'success',
            registrationDate,
            participantData.addedByAdmin ? 'Yes' : 'No',
        ];
        // ✅ IDEMPOTENCY: atomically claim this transaction for the sheet append.
        // If a previous job already synced it (duplicate enqueue from ipn + payment
        // success, or a BullMQ re-process), the DB stays single but the sheet append
        // would duplicate. This claim makes the append run exactly once.
        const claim = await exclusive_offer_model_1.ExclusiveOfferParticipant.updateOne({ transactionId: participantData.transactionId, sheetSynced: { $ne: true } }, { $set: { sheetSynced: true } });
        if (claim.modifiedCount === 0) {
            logger_1.default.info({ transactionId: participantData.transactionId }, '⏭️ Skipping Google Sheet append (already synced)');
            return participant;
        }
        logger_1.default.info(`📤 Attempting to append to Google Sheet: ${sheetTitle}`);
        try {
            await (0, googleSheets_1.appendDataToGoogleSheet)(sheetTitle, headers, rowData);
        }
        catch (error) {
            // Release the claim so a retry can append the row
            await exclusive_offer_model_1.ExclusiveOfferParticipant.updateOne({ transactionId: participantData.transactionId }, { $set: { sheetSynced: false } }).catch(() => undefined);
            throw error;
        }
        logger_1.default.info(`✅ Google Sheet updated successfully: ${sheetTitle}`);
        return participant;
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        logger_1.default.error('❌ Worker error: ' + (error?.stack || error?.message || error));
        throw error; // BullMQ will retry
    }
}, { connection: connection_1.redisConnection });
// import { Worker } from 'bullmq';
// import mongoose from 'mongoose';
// import { redisConnection } from '../queues/connection';
// import logger from '../shared/logger';
// import { appendDataToGoogleSheet } from '../utils/googleSheets';
// import { sanitizePhoneNumber } from '../utils/phoneSanitizer';
// import { ExclusiveOfferParticipant } from '../modules/exclusive/exclusive-offer.model';
// new Worker(
//     'exclusive-offer-queue',
//     async (job) => {
//         logger.info({ jobId: job.id }, '🔁 Worker started for job');
//         const { participantData } = job.data;
//         logger.info(participantData, '📦 Received participantData');
//         const cleanPhone = sanitizePhoneNumber(participantData.phone) || participantData.phone;
//         // ✅ Use findOneAndUpdate with upsert to avoid duplicate key errors
//         const session = await mongoose.startSession();
//         try {
//             session.startTransaction();
//             // Build the update object
//             const updateData = {
//                 ...participantData,
//                 phone: cleanPhone,
//                 paymentStatus: participantData.paymentStatus || 'success',
//             };
//             // Upsert: if document exists, update; else create
//             const participant = await ExclusiveOfferParticipant.findOneAndUpdate(
//                 { transactionId: participantData.transactionId },
//                 { $set: updateData },
//                 {
//                     new: true,
//                     upsert: true,
//                     session,
//                     setDefaultsOnInsert: true,
//                 },
//             );
//             await session.commitTransaction();
//             session.endSession();
//             logger.info({ participantId: participant._id }, '💾 Participant saved/updated');
//             // ============================
//             // GOOGLE SHEET
//             // ============================
//             const registrationDate = new Date().toLocaleString('en-BD', {
//                 timeZone: 'Asia/Dhaka',
//             });
//             logger.info('📤 Attempting to append to Google Sheets...');
//             await appendDataToGoogleSheet(
//                 'Exclusive Offer Course',
//                 [
//                     'Name',
//                     'Phone',
//                     'WhatsApp',
//                     'Email',
//                     'Occupation',
//                     'Course',
//                     'Offer Price',
//                     'Transaction ID',
//                     'Payment Status',
//                     'Registered At',
//                 ],
//                 [
//                     participant.name || participantData.name,
//                     participant.phone || cleanPhone,
//                     participant.whatsapp || participantData.whatsapp || '',
//                     participant.email || participantData.email || '',
//                     participant.occupation || participantData.occupation || '',
//                     participant.courseTitle || 'Voice & Public Speaking Masterclass',
//                     String(participant.offerPrice || participantData.offerPrice || 199),
//                     participantData.transactionId || '',
//                     participantData.paymentStatus || 'success',
//                     registrationDate,
//                 ],
//             );
//             logger.info('✅ Google Sheet updated successfully');
//             return participant;
//         } catch (error: any) {
//             await session.abortTransaction();
//             session.endSession();
//             logger.error('❌ Worker error: ' + (error?.stack || error?.message || error));
//             throw error; // BullMQ will retry
//         }
//     },
//     { connection: redisConnection },
// );

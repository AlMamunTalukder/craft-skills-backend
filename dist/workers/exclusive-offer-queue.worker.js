"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exclusiveOfferWorker = void 0;
const bullmq_1 = require("bullmq");
const mongoose_1 = __importDefault(require("mongoose"));
const connection_1 = require("../queues/connection");
const logger_1 = __importDefault(require("../shared/logger"));
const googleSheets_1 = require("../utils/googleSheets");
const phoneSanitizer_1 = require("../utils/phoneSanitizer");
const exclusive_offer_model_1 = require("../modules/exclusive/exclusive-offer.model");
const exclusive_batch_model_1 = require("../modules/exclusive/exclusive-batch.model");
console.log('🔴🔴🔴 EXCLUSIVE OFFER WORKER: STARTING 🔴🔴🔴');
// ✅ Create worker and assign to variable to prevent garbage collection
const exclusiveOfferWorker = new bullmq_1.Worker('exclusive-offer-queue', async (job) => {
    console.log(`📦 JOB RECEIVED: ${job.id}`);
    logger_1.default.info({ jobId: job.id }, '🔁 Worker started for job');
    const { participantData } = job.data;
    logger_1.default.info(participantData, '📦 Received participantData');
    const cleanPhone = (0, phoneSanitizer_1.sanitizePhoneNumber)(participantData.phone) || participantData.phone;
    const session = await mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const updateData = {
            ...participantData,
            phone: cleanPhone,
            paymentStatus: participantData.paymentStatus || 'success',
        };
        const participant = await exclusive_offer_model_1.ExclusiveOfferParticipant.findOneAndUpdate({ transactionId: participantData.transactionId }, { $set: updateData }, {
            new: true,
            upsert: true,
            session,
            setDefaultsOnInsert: true,
        });
        await session.commitTransaction();
        session.endSession();
        logger_1.default.info({ participantId: participant._id }, '💾 Participant saved/updated');
        console.log(`✅ Participant saved: ${participant._id}`);
        // ============================
        // FETCH BATCH INFORMATION
        // ============================
        let batchNo = 'N/A';
        let batchTitle = 'Exclusive Offer Course';
        let batchFound = false;
        // ✅ Try to get batch from participantData
        if (participantData.batchId) {
            try {
                let batchInfo = null;
                let batchIdValue = participantData.batchId;
                logger_1.default.info(`🔍 Searching for batch with ID: ${batchIdValue}`);
                console.log(`🔍 Searching for batch: ${batchIdValue}`);
                // Method 1: Try as ObjectId
                if (typeof batchIdValue === 'string' && mongoose_1.default.Types.ObjectId.isValid(batchIdValue)) {
                    logger_1.default.info(`🔍 Trying to find batch by _id: ${batchIdValue}`);
                    batchInfo = await exclusive_batch_model_1.ExclusiveBatch.findById(batchIdValue).lean();
                }
                // Method 2: Try as batchNo
                if (!batchInfo) {
                    logger_1.default.info(`🔍 Trying to find batch by batchNo: ${batchIdValue}`);
                    batchInfo = await exclusive_batch_model_1.ExclusiveBatch.findOne({
                        batchNo: batchIdValue.toString()
                    }).lean();
                }
                if (batchInfo) {
                    batchNo = batchInfo.batchNo?.toString() || 'N/A';
                    batchTitle = batchInfo.title || 'Exclusive Offer Course';
                    batchFound = true;
                    logger_1.default.info(`✅ Found batch: ${batchNo} - ${batchTitle}`);
                    console.log(`✅ Found batch: ${batchNo}`);
                }
                else {
                    logger_1.default.warn(`⚠️ Batch not found for: ${batchIdValue}`);
                }
            }
            catch (error) {
                logger_1.default.warn({
                    batchId: participantData.batchId,
                    error: error?.message || 'Unknown error',
                }, '⚠️ Could not fetch batch info');
            }
        }
        // ✅ If no batch found, get active batch
        if (!batchFound) {
            logger_1.default.info('🔍 Looking for active batch...');
            console.log('🔍 Looking for active batch...');
            try {
                const activeBatch = await exclusive_batch_model_1.ExclusiveBatch.findOne({
                    isActive: true
                }).lean();
                if (activeBatch) {
                    batchNo = activeBatch.batchNo?.toString() || 'N/A';
                    batchTitle = activeBatch.title || 'Exclusive Offer Course';
                    batchFound = true;
                    logger_1.default.info(`✅ Found active batch: ${batchNo}`);
                    console.log(`✅ Found active batch: ${batchNo}`);
                }
            }
            catch (error) {
                logger_1.default.error('❌ Error finding active batch:', error);
            }
        }
        // ✅ If still no batch, try Batch 3
        if (!batchFound) {
            logger_1.default.info('🔍 Looking for Batch 3...');
            console.log('🔍 Looking for Batch 3...');
            try {
                const batch3 = await exclusive_batch_model_1.ExclusiveBatch.findOne({
                    batchNo: '3'
                }).lean();
                if (batch3) {
                    batchNo = '3';
                    batchTitle = batch3.title || 'Exclusive Offer Course';
                    batchFound = true;
                    logger_1.default.info(`✅ Found Batch 3`);
                    console.log(`✅ Found Batch 3`);
                }
            }
            catch (error) {
                logger_1.default.error('❌ Error finding Batch 3:', error);
            }
        }
        logger_1.default.info(`📋 Final batch: ${batchNo} - ${batchTitle}`);
        console.log(`📋 Final batch: ${batchNo}`);
        // ============================
        // GOOGLE SHEET - CREATE NEW SHEET
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
        // ✅ Sheet name with batch number
        const sheetTitle = `Exclusive Offer Course Batch: ${batchNo}`;
        logger_1.default.info(`📤 Creating/Updating Google Sheet: ${sheetTitle}`);
        console.log(`📤 Creating sheet: ${sheetTitle}`);
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
        // ✅ Only sync to Google Sheets if payment is successful
        const paymentStatus = participantData.paymentStatus || 'pending';
        if (paymentStatus !== 'success') {
            logger_1.default.info({ transactionId: participantData.transactionId, paymentStatus }, '⏭️ Skipping Google Sheet append (payment not successful)');
            console.log(`⏭️ Payment not success (${paymentStatus}), skipping sheet sync: ${participantData.transactionId}`);
            return participant;
        }
        // ✅ Check if already synced
        const claim = await exclusive_offer_model_1.ExclusiveOfferParticipant.updateOne({ transactionId: participantData.transactionId, sheetSynced: { $ne: true } }, { $set: { sheetSynced: true } });
        if (claim.modifiedCount === 0) {
            logger_1.default.info({ transactionId: participantData.transactionId }, '⏭️ Skipping Google Sheet append (already synced)');
            console.log(`⏭️ Already synced: ${participantData.transactionId}`);
            return participant;
        }
        // ✅ Append to Google Sheet
        try {
            console.log(`📤 Appending to Google Sheet: ${sheetTitle}`);
            // Use Transaction ID (column 7) for deduplication - unique per payment
            // Fallback to Phone (column 1) for admin entries without transactionId
            const transactionId = participantData.transactionId || '';
            const useTransactionId = !!transactionId;
            await (0, googleSheets_1.appendDataToGoogleSheet)(sheetTitle, headers, rowData, {
                dedupColumn: useTransactionId ? 7 : 1,
                dedupValue: useTransactionId ? transactionId : cleanPhone
            });
            logger_1.default.info(`✅ Google Sheet updated: ${sheetTitle}`);
            console.log(`✅ Google Sheet updated: ${sheetTitle}`);
        }
        catch (error) {
            console.error(`❌ Failed to append to sheet:`, error.message);
            // Release claim so retry can append
            await exclusive_offer_model_1.ExclusiveOfferParticipant.updateOne({ transactionId: participantData.transactionId }, { $set: { sheetSynced: false } }).catch(() => undefined);
            throw error;
        }
        return participant;
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        logger_1.default.error('❌ Worker error: ' + (error?.stack || error?.message || error));
        console.error('❌ Worker error:', error.message);
        throw error;
    }
}, {
    connection: connection_1.redisConnection,
    concurrency: 5,
});
exports.exclusiveOfferWorker = exclusiveOfferWorker;
console.log('✅✅✅ Exclusive Offer Worker created successfully ✅✅✅');
// ✅ Event listeners to keep worker alive and monitor
exclusiveOfferWorker.on('ready', () => {
    console.log('✅✅✅ Worker is READY and waiting for jobs!');
    logger_1.default.info('✅ Exclusive Offer Worker is ready');
});
exclusiveOfferWorker.on('completed', (job) => {
    if (job) {
        console.log(`✅ Job ${job.id} completed successfully`);
        logger_1.default.info({ jobId: job.id }, '✅ Job completed');
    }
    else {
        console.log('✅ Job completed (no job data)');
    }
});
exclusiveOfferWorker.on('failed', (job, err) => {
    if (job) {
        console.error(`❌ Job ${job.id} failed:`, err.message);
        logger_1.default.error({ jobId: job.id, error: err }, '❌ Job failed');
    }
    else {
        console.error('❌ Job failed:', err.message);
        logger_1.default.error({ error: err }, '❌ Job failed (no job data)');
    }
});
exclusiveOfferWorker.on('error', (err) => {
    console.error('❌ Worker error:', err.message);
    logger_1.default.error({ error: err }, '❌ Worker error');
});
console.log('🔴🔴🔴 EXCLUSIVE OFFER WORKER FINISHED LOADING 🔴🔴🔴');

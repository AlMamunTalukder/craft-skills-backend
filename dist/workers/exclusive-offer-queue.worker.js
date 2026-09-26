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
// ✅ Create worker and assign to variable to prevent garbage collection
const exclusiveOfferWorker = new bullmq_1.Worker('exclusive-offer-queue', async (job) => {
    logger_1.default.info({ jobId: job.id }, '🔁 Worker started for job');
    const { participantData } = job.data;
    logger_1.default.info(participantData, '📦 Received participantData');
    const incomingStatus = (participantData.paymentStatus || 'success').toLowerCase();
    const isIncomingFailed = incomingStatus === 'failed' || incomingStatus === 'cancelled';
    // 🛡️ Success is terminal — a late failed job must not downgrade a paid customer
    // or write them into the Failed sheet.
    if (isIncomingFailed && participantData.transactionId) {
        const existing = await exclusive_offer_model_1.ExclusiveOfferParticipant.findOne({ transactionId: participantData.transactionId })
            .select('paymentStatus')
            .lean();
        if (existing?.paymentStatus === 'success') {
            logger_1.default.warn({ transactionId: participantData.transactionId }, '🛡️ Skipping failed-sheet sync: transaction already succeeded');
            return existing;
        }
    }
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
                if (typeof batchIdValue === 'string' && mongoose_1.default.Types.ObjectId.isValid(batchIdValue)) {
                    logger_1.default.info(`🔍 Trying to find batch by _id: ${batchIdValue}`);
                    batchInfo = await exclusive_batch_model_1.ExclusiveBatch.findById(batchIdValue).lean();
                }
                if (!batchInfo) {
                    logger_1.default.info(`🔍 Trying to find batch by batchNo: ${batchIdValue}`);
                    batchInfo = await exclusive_batch_model_1.ExclusiveBatch.findOne({
                        batchNo: batchIdValue.toString(),
                    }).lean();
                }
                if (batchInfo) {
                    batchNo = batchInfo.batchNo?.toString() || 'N/A';
                    batchTitle = batchInfo.title || 'Exclusive Offer Course';
                    batchFound = true;
                    logger_1.default.info(`✅ Found batch: ${batchNo} - ${batchTitle}`);
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
        if (!batchFound) {
            logger_1.default.info('🔍 Looking for active batch...');
            try {
                const activeBatch = await exclusive_batch_model_1.ExclusiveBatch.findOne({
                    isActive: true,
                }).lean();
                if (activeBatch) {
                    batchNo = activeBatch.batchNo?.toString() || 'N/A';
                    batchTitle = activeBatch.title || 'Exclusive Offer Course';
                    batchFound = true;
                    logger_1.default.info(`✅ Found active batch: ${batchNo}`);
                }
            }
            catch (error) {
                logger_1.default.error('❌ Error finding active batch:', error);
            }
        }
        if (!batchFound) {
            logger_1.default.info('🔍 Looking for Batch 3...');
            try {
                const batch3 = await exclusive_batch_model_1.ExclusiveBatch.findOne({
                    batchNo: '3',
                }).lean();
                if (batch3) {
                    batchNo = '3';
                    batchTitle = batch3.title || 'Exclusive Offer Course';
                    batchFound = true;
                    logger_1.default.info('✅ Found Batch 3');
                }
            }
            catch (error) {
                logger_1.default.error('❌ Error finding Batch 3:', error);
            }
        }
        logger_1.default.info(`📋 Final batch: ${batchNo} - ${batchTitle}`);
        // ============================
        // GOOGLE SHEET - SUCCESS vs FAILED (separate tabs)
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
        const rawStatus = (participantData.paymentStatus || participant?.paymentStatus || 'pending').toLowerCase();
        const isSuccess = rawStatus === 'success';
        const isFailed = rawStatus === 'failed' || rawStatus === 'cancelled';
        // ⏭️ Don't sync pending payments to any sheet
        if (!isSuccess && !isFailed) {
            logger_1.default.info({ transactionId: participantData.transactionId, paymentStatus: rawStatus }, '⏭️ Skipping Google Sheet append (payment pending)');
            return participant;
        }
        // ✅ Separate tabs: success and failed never mix
        const sheetTitle = isSuccess
            ? `Exclusive Offer Course Batch: ${batchNo}`
            : `Exclusive Offer Course Batch: ${batchNo} - Failed`;
        logger_1.default.info(`📤 Creating/Updating Google Sheet: ${sheetTitle} (status=${rawStatus})`);
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
            String(participant.offerPrice || participantData.offerPrice || 299),
            participantData.transactionId || '',
            rawStatus,
            registrationDate,
            participantData.addedByAdmin ? 'Yes' : 'No',
        ];
        // ✅ Per-status idempotency flag so success + failed sync independently
        const syncField = isSuccess ? 'sheetSynced' : 'failedSheetSynced';
        const claim = await exclusive_offer_model_1.ExclusiveOfferParticipant.updateOne({ transactionId: participantData.transactionId, [syncField]: { $ne: true } }, { $set: { [syncField]: true } });
        if (claim.modifiedCount === 0) {
            logger_1.default.info({ transactionId: participantData.transactionId, status: rawStatus }, `⏭️ Skipping Google Sheet append (already synced to ${sheetTitle})`);
            return participant;
        }
        try {
            const transactionId = participantData.transactionId || '';
            const useTransactionId = !!transactionId;
            await (0, googleSheets_1.appendDataToGoogleSheet)(sheetTitle, headers, rowData, {
                dedupColumn: useTransactionId ? 7 : 1,
                dedupValue: useTransactionId ? transactionId : cleanPhone,
            });
            logger_1.default.info(`✅ Google Sheet updated: ${sheetTitle}`);
        }
        catch (error) {
            logger_1.default.error({ error: error?.message || error }, '❌ Failed to append to sheet');
            await exclusive_offer_model_1.ExclusiveOfferParticipant.updateOne({ transactionId: participantData.transactionId }, { $set: { [syncField]: false } }).catch(() => undefined);
            throw error;
        }
        return participant;
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        logger_1.default.error('❌ Worker error: ' + (error?.stack || error?.message || error));
        throw error;
    }
}, {
    connection: connection_1.redisConnection,
    concurrency: 5,
});
exports.exclusiveOfferWorker = exclusiveOfferWorker;
exclusiveOfferWorker.on('ready', () => {
    logger_1.default.info('✅ Exclusive Offer Worker is ready');
});
exclusiveOfferWorker.on('completed', (job) => {
    if (job) {
        logger_1.default.info({ jobId: job.id }, '✅ Job completed');
    }
});
exclusiveOfferWorker.on('failed', (job, err) => {
    if (job) {
        logger_1.default.error({ jobId: job.id, error: err }, '❌ Job failed');
    }
    else {
        logger_1.default.error({ error: err }, '❌ Job failed (no job data)');
    }
});
exclusiveOfferWorker.on('error', (err) => {
    logger_1.default.error({ error: err }, '❌ Worker error');
});

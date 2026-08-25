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
        // ✅ First, try to get batch from participantData
        if (participantData.batchId) {
            try {
                let batchInfo = null;
                let batchIdValue = participantData.batchId;
                logger_1.default.info(`🔍 Searching for batch with ID: ${batchIdValue}`);
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
                // Method 3: If batchId is object with _id
                if (!batchInfo && typeof batchIdValue === 'object' && batchIdValue._id) {
                    logger_1.default.info(`🔍 Trying to find batch by nested _id`);
                    batchInfo = await exclusive_batch_model_1.ExclusiveBatch.findById(batchIdValue._id).lean();
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
        // ✅ If no batch found, try to get the active batch (Batch 3)
        if (!batchFound) {
            logger_1.default.info('🔍 No batch found in participantData, looking for active batch...');
            try {
                const activeBatch = await exclusive_batch_model_1.ExclusiveBatch.findOne({
                    isActive: true
                }).lean();
                if (activeBatch) {
                    batchNo = activeBatch.batchNo?.toString() || 'N/A';
                    batchTitle = activeBatch.title || 'Exclusive Offer Course';
                    batchFound = true;
                    logger_1.default.info(`✅ Found active batch: ${batchNo} - ${batchTitle}`);
                }
                else {
                    logger_1.default.warn('⚠️ No active batch found in database');
                    // ✅ Try to find Batch 3 specifically (by batchNo)
                    const batch3 = await exclusive_batch_model_1.ExclusiveBatch.findOne({
                        batchNo: '3'
                    }).lean();
                    if (batch3) {
                        batchNo = '3';
                        batchTitle = batch3.title || 'Exclusive Offer Course';
                        batchFound = true;
                        logger_1.default.info(`✅ Found Batch 3 specifically: ${batchNo}`);
                    }
                }
            }
            catch (error) {
                logger_1.default.error('❌ Error finding active batch:', error);
            }
        }
        // ✅ Last resort: use Batch 2 or 3 by batchNo
        if (!batchFound) {
            logger_1.default.info('🔍 Trying to find Batch 2 or 3 by batchNo...');
            const batch2 = await exclusive_batch_model_1.ExclusiveBatch.findOne({ batchNo: '2' }).lean();
            const batch3 = await exclusive_batch_model_1.ExclusiveBatch.findOne({ batchNo: '3' }).lean();
            if (batch3) {
                batchNo = '3';
                batchTitle = batch3.title || 'Exclusive Offer Course';
                batchFound = true;
                logger_1.default.info(`✅ Using Batch 3: ${batchNo}`);
            }
            else if (batch2) {
                batchNo = '2';
                batchTitle = batch2.title || 'Exclusive Offer Course';
                batchFound = true;
                logger_1.default.info(`✅ Using Batch 2: ${batchNo}`);
            }
            else {
                logger_1.default.warn('⚠️ No batches found at all!');
            }
        }
        logger_1.default.info(`📋 Final batch: ${batchNo} - ${batchTitle}`);
        // ============================
        // GOOGLE SHEET
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
        // ✅ Use Batch Number in sheet name
        const sheetTitle = `Exclusive Offer Course Batch: ${batchNo}`;
        logger_1.default.info(`📤 Creating/Updating Google Sheet: ${sheetTitle}`);
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
        // ✅ Prevent duplicate entries
        const claim = await exclusive_offer_model_1.ExclusiveOfferParticipant.updateOne({ transactionId: participantData.transactionId, sheetSynced: { $ne: true } }, { $set: { sheetSynced: true } });
        if (claim.modifiedCount === 0) {
            logger_1.default.info({ transactionId: participantData.transactionId }, '⏭️ Skipping Google Sheet append (already synced)');
            return participant;
        }
        try {
            await (0, googleSheets_1.appendDataToGoogleSheet)(sheetTitle, headers, rowData, {
                dedupColumn: 2,
                dedupValue: cleanPhone
            });
            logger_1.default.info(`✅ Google Sheet updated: ${sheetTitle}`);
        }
        catch (error) {
            await exclusive_offer_model_1.ExclusiveOfferParticipant.updateOne({ transactionId: participantData.transactionId }, { $set: { sheetSynced: false } }).catch(() => undefined);
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
}, { connection: connection_1.redisConnection });

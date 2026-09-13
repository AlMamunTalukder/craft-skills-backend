import { Worker } from 'bullmq';
import mongoose from 'mongoose';

import { redisConnection } from '../queues/connection';
import logger from 'src/shared/logger';

import { appendDataToGoogleSheet } from 'src/utils/googleSheets';
import { sanitizePhoneNumber } from 'src/utils/phoneSanitizer';
import { ExclusiveOfferParticipant } from 'src/modules/exclusive/exclusive-offer.model';
import { ExclusiveBatch } from 'src/modules/exclusive/exclusive-batch.model';

// ✅ Define the Batch type
interface IBatch {
    _id: string;
    batchNo: string | number;
    title: string;
    description?: string;
    date?: Date;
    registrationDeadline?: Date;
    offerPrice?: number;
    regularPrice?: number;
    isActive?: boolean;
    maxSeats?: number;
    enrolledCount?: number;
}

// ✅ Create worker and assign to variable to prevent garbage collection
const exclusiveOfferWorker = new Worker(
    'exclusive-offer-queue',
    async (job: any) => {
        logger.info({ jobId: job.id }, '🔁 Worker started for job');

        const { participantData } = job.data;
        logger.info(participantData, '📦 Received participantData');

        const cleanPhone = sanitizePhoneNumber(participantData.phone) || participantData.phone;

        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            const updateData = {
                ...participantData,
                phone: cleanPhone,
                paymentStatus: participantData.paymentStatus || 'success',
            };

            const participant = await ExclusiveOfferParticipant.findOneAndUpdate(
                { transactionId: participantData.transactionId },
                { $set: updateData },
                {
                    new: true,
                    upsert: true,
                    session,
                    setDefaultsOnInsert: true,
                },
            );

            await session.commitTransaction();
            session.endSession();

            logger.info({ participantId: participant._id }, '💾 Participant saved/updated');

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

                    logger.info(`🔍 Searching for batch with ID: ${batchIdValue}`);

                    if (typeof batchIdValue === 'string' && mongoose.Types.ObjectId.isValid(batchIdValue)) {
                        logger.info(`🔍 Trying to find batch by _id: ${batchIdValue}`);
                        batchInfo = await ExclusiveBatch.findById(batchIdValue).lean() as IBatch | null;
                    }

                    if (!batchInfo) {
                        logger.info(`🔍 Trying to find batch by batchNo: ${batchIdValue}`);
                        batchInfo = await ExclusiveBatch.findOne({
                            batchNo: batchIdValue.toString(),
                        }).lean() as IBatch | null;
                    }

                    if (batchInfo) {
                        batchNo = batchInfo.batchNo?.toString() || 'N/A';
                        batchTitle = batchInfo.title || 'Exclusive Offer Course';
                        batchFound = true;
                        logger.info(`✅ Found batch: ${batchNo} - ${batchTitle}`);
                    } else {
                        logger.warn(`⚠️ Batch not found for: ${batchIdValue}`);
                    }
                } catch (error: any) {
                    logger.warn({
                        batchId: participantData.batchId,
                        error: error?.message || 'Unknown error',
                    }, '⚠️ Could not fetch batch info');
                }
            }

            if (!batchFound) {
                logger.info('🔍 Looking for active batch...');
                try {
                    const activeBatch = await ExclusiveBatch.findOne({
                        isActive: true,
                    }).lean() as IBatch | null;

                    if (activeBatch) {
                        batchNo = activeBatch.batchNo?.toString() || 'N/A';
                        batchTitle = activeBatch.title || 'Exclusive Offer Course';
                        batchFound = true;
                        logger.info(`✅ Found active batch: ${batchNo}`);
                    }
                } catch (error: any) {
                    logger.error('❌ Error finding active batch:', error);
                }
            }

            if (!batchFound) {
                logger.info('🔍 Looking for Batch 3...');
                try {
                    const batch3 = await ExclusiveBatch.findOne({
                        batchNo: '3',
                    }).lean() as IBatch | null;

                    if (batch3) {
                        batchNo = '3';
                        batchTitle = batch3.title || 'Exclusive Offer Course';
                        batchFound = true;
                        logger.info('✅ Found Batch 3');
                    }
                } catch (error: any) {
                    logger.error('❌ Error finding Batch 3:', error);
                }
            }

            logger.info(`📋 Final batch: ${batchNo} - ${batchTitle}`);

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

            logger.info(`📤 Creating/Updating Google Sheet: ${sheetTitle}`);

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
                logger.info(
                    { transactionId: participantData.transactionId, paymentStatus },
                    '⏭️ Skipping Google Sheet append (payment not successful)',
                );
                return participant;
            }

            // ✅ Check if already synced
            const claim = await ExclusiveOfferParticipant.updateOne(
                { transactionId: participantData.transactionId, sheetSynced: { $ne: true } },
                { $set: { sheetSynced: true } },
            );

            if (claim.modifiedCount === 0) {
                logger.info(
                    { transactionId: participantData.transactionId },
                    '⏭️ Skipping Google Sheet append (already synced)',
                );
                return participant;
            }

            try {
                const transactionId = participantData.transactionId || '';
                const useTransactionId = !!transactionId;
                await appendDataToGoogleSheet(sheetTitle, headers, rowData, {
                    dedupColumn: useTransactionId ? 7 : 1,
                    dedupValue: useTransactionId ? transactionId : cleanPhone,
                });
                logger.info(`✅ Google Sheet updated: ${sheetTitle}`);
            } catch (error: any) {
                logger.error({ error: error?.message || error }, '❌ Failed to append to sheet');
                await ExclusiveOfferParticipant.updateOne(
                    { transactionId: participantData.transactionId },
                    { $set: { sheetSynced: false } },
                ).catch(() => undefined);
                throw error;
            }

            return participant;
        } catch (error: any) {
            await session.abortTransaction();
            session.endSession();
            logger.error('❌ Worker error: ' + (error?.stack || error?.message || error));
            throw error;
        }
    },
    { 
        connection: redisConnection,
        concurrency: 5,
    }
);

exclusiveOfferWorker.on('ready', () => {
    logger.info('✅ Exclusive Offer Worker is ready');
});
 
exclusiveOfferWorker.on('completed', (job) => {
    if (job) {
        logger.info({ jobId: job.id }, '✅ Job completed');
    }
});

exclusiveOfferWorker.on('failed', (job, err) => {
    if (job) {
        logger.error({ jobId: job.id, error: err }, '❌ Job failed');
    } else {
        logger.error({ error: err }, '❌ Job failed (no job data)');
    }
});

exclusiveOfferWorker.on('error', (err) => {
    logger.error({ error: err }, '❌ Worker error');
});

export { exclusiveOfferWorker };
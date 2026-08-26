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

console.log('🔴🔴🔴 EXCLUSIVE OFFER WORKER: STARTING 🔴🔴🔴');

// ✅ Create worker and assign to variable to prevent garbage collection
const exclusiveOfferWorker = new Worker(
    'exclusive-offer-queue',
    async (job: any) => {
        console.log(`📦 JOB RECEIVED: ${job.id}`);
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

                    logger.info(`🔍 Searching for batch with ID: ${batchIdValue}`);
                    console.log(`🔍 Searching for batch: ${batchIdValue}`);

                    // Method 1: Try as ObjectId
                    if (typeof batchIdValue === 'string' && mongoose.Types.ObjectId.isValid(batchIdValue)) {
                        logger.info(`🔍 Trying to find batch by _id: ${batchIdValue}`);
                        batchInfo = await ExclusiveBatch.findById(batchIdValue).lean() as IBatch | null;
                    }

                    // Method 2: Try as batchNo
                    if (!batchInfo) {
                        logger.info(`🔍 Trying to find batch by batchNo: ${batchIdValue}`);
                        batchInfo = await ExclusiveBatch.findOne({ 
                            batchNo: batchIdValue.toString() 
                        }).lean() as IBatch | null;
                    }

                    if (batchInfo) {
                        batchNo = batchInfo.batchNo?.toString() || 'N/A';
                        batchTitle = batchInfo.title || 'Exclusive Offer Course';
                        batchFound = true;
                        logger.info(`✅ Found batch: ${batchNo} - ${batchTitle}`);
                        console.log(`✅ Found batch: ${batchNo}`);
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

            // ✅ If no batch found, get active batch
            if (!batchFound) {
                logger.info('🔍 Looking for active batch...');
                console.log('🔍 Looking for active batch...');
                try {
                    const activeBatch = await ExclusiveBatch.findOne({ 
                        isActive: true 
                    }).lean() as IBatch | null;
                    
                    if (activeBatch) {
                        batchNo = activeBatch.batchNo?.toString() || 'N/A';
                        batchTitle = activeBatch.title || 'Exclusive Offer Course';
                        batchFound = true;
                        logger.info(`✅ Found active batch: ${batchNo}`);
                        console.log(`✅ Found active batch: ${batchNo}`);
                    }
                } catch (error: any) {
                    logger.error('❌ Error finding active batch:', error);
                }
            }

            // ✅ If still no batch, try Batch 3
            if (!batchFound) {
                logger.info('🔍 Looking for Batch 3...');
                console.log('🔍 Looking for Batch 3...');
                try {
                    const batch3 = await ExclusiveBatch.findOne({ 
                        batchNo: '3' 
                    }).lean() as IBatch | null;
                    
                    if (batch3) {
                        batchNo = '3';
                        batchTitle = batch3.title || 'Exclusive Offer Course';
                        batchFound = true;
                        logger.info(`✅ Found Batch 3`);
                        console.log(`✅ Found Batch 3`);
                    }
                } catch (error: any) {
                    logger.error('❌ Error finding Batch 3:', error);
                }
            }

            logger.info(`📋 Final batch: ${batchNo} - ${batchTitle}`);
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

            logger.info(`📤 Creating/Updating Google Sheet: ${sheetTitle}`);
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
                logger.info(
                    { transactionId: participantData.transactionId, paymentStatus },
                    '⏭️ Skipping Google Sheet append (payment not successful)',
                );
                console.log(`⏭️ Payment not success (${paymentStatus}), skipping sheet sync: ${participantData.transactionId}`);
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
                await appendDataToGoogleSheet(sheetTitle, headers, rowData, { 
                    dedupColumn: useTransactionId ? 7 : 1, 
                    dedupValue: useTransactionId ? transactionId : cleanPhone 
                });
                logger.info(`✅ Google Sheet updated: ${sheetTitle}`);
                console.log(`✅ Google Sheet updated: ${sheetTitle}`);
            } catch (error: any) {
                console.error(`❌ Failed to append to sheet:`, error.message);
                // Release claim so retry can append
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
            console.error('❌ Worker error:', error.message);
            throw error;
        }
    },
    { 
        connection: redisConnection,
        concurrency: 5,
    }
);

console.log('✅✅✅ Exclusive Offer Worker created successfully ✅✅✅');

// ✅ Event listeners to keep worker alive and monitor
exclusiveOfferWorker.on('ready', () => {
    console.log('✅✅✅ Worker is READY and waiting for jobs!');
    logger.info('✅ Exclusive Offer Worker is ready');
});

exclusiveOfferWorker.on('completed', (job) => {
    if (job) {
        console.log(`✅ Job ${job.id} completed successfully`);
        logger.info({ jobId: job.id }, '✅ Job completed');
    } else {
        console.log('✅ Job completed (no job data)');
    }
});

exclusiveOfferWorker.on('failed', (job, err) => {
    if (job) {
        console.error(`❌ Job ${job.id} failed:`, err.message);
        logger.error({ jobId: job.id, error: err }, '❌ Job failed');
    } else {
        console.error('❌ Job failed:', err.message);
        logger.error({ error: err }, '❌ Job failed (no job data)');
    }
});

exclusiveOfferWorker.on('error', (err) => {
    console.error('❌ Worker error:', err.message);
    logger.error({ error: err }, '❌ Worker error');
});

console.log('🔴🔴🔴 EXCLUSIVE OFFER WORKER FINISHED LOADING 🔴🔴🔴');

// ✅ Export for external use
export { exclusiveOfferWorker };
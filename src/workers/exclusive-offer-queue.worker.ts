import { Worker } from 'bullmq';
import mongoose from 'mongoose';

import { redisConnection } from '../queues/connection';
import logger from 'src/shared/logger';

import { appendDataToGoogleSheet } from 'src/utils/googleSheets';
import { sanitizePhoneNumber } from 'src/utils/phoneSanitizer';
import { ExclusiveOfferParticipant } from 'src/modules/exclusive/exclusive-offer.model';
import { ExclusiveBatch } from 'src/modules/exclusive/exclusive-batch.model';

// ✅ Define the Batch type for TypeScript
interface IBatch {
    _id: string;
    batchNo: number;
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

new Worker(
    'exclusive-offer-queue',
    async (job) => {
        logger.info({ jobId: job.id }, '🔁 Worker started for job');

        const { participantData } = job.data;
        logger.info(participantData, '📦 Received participantData');

        const cleanPhone = sanitizePhoneNumber(participantData.phone) || participantData.phone;

        // ✅ Use findOneAndUpdate with upsert to avoid duplicate key errors
        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            // Build the update object
            const updateData = {
                ...participantData,
                phone: cleanPhone,
                paymentStatus: participantData.paymentStatus || 'success',
            };

            // Upsert: if document exists, update; else create
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
            // FETCH BATCH INFORMATION FOR SHEET NAME
            // ============================
            let batchNo = 'N/A';
            let batchTitle = 'Exclusive Offer Course';

            if (participantData.batchId) {
                try {
                    // ✅ Use findById with proper typing
                    const batchInfo = (await ExclusiveBatch.findById(
                        participantData.batchId,
                    ).lean()) as IBatch | null;

                    if (batchInfo) {
                        batchNo = batchInfo.batchNo?.toString() || 'N/A';
                        batchTitle = batchInfo.title || 'Exclusive Offer Course';
                        logger.info(`✅ Found batch: ${batchNo} - ${batchTitle}`);
                    } else {
                        logger.warn(`⚠️ Batch not found for ID: ${participantData.batchId}`);
                    }
                } catch (error: any) {
                    logger.warn({
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

            logger.info(`📤 Attempting to append to Google Sheet: ${sheetTitle}`);

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

            logger.info(`📤 Attempting to append to Google Sheet: ${sheetTitle}`);

            try {
                await appendDataToGoogleSheet(sheetTitle, headers, rowData);
            } catch (error) {
                // Release the claim so a retry can append the row
                await ExclusiveOfferParticipant.updateOne(
                    { transactionId: participantData.transactionId },
                    { $set: { sheetSynced: false } },
                ).catch(() => undefined);
                throw error;
            }

            logger.info(`✅ Google Sheet updated successfully: ${sheetTitle}`);
            return participant;
        } catch (error: any) {
            await session.abortTransaction();
            session.endSession();
            logger.error('❌ Worker error: ' + (error?.stack || error?.message || error));
            throw error; // BullMQ will retry
        }
    },
    { connection: redisConnection },
);

// import { Worker } from 'bullmq';
// import mongoose from 'mongoose';

// import { redisConnection } from '../queues/connection';
// import logger from 'src/shared/logger';

// import { appendDataToGoogleSheet } from 'src/utils/googleSheets';
// import { sanitizePhoneNumber } from 'src/utils/phoneSanitizer';
// import { ExclusiveOfferParticipant } from 'src/modules/exclusive/exclusive-offer.model';

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

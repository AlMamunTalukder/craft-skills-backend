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
        logger.info('🔁 Worker started for job', { jobId: job.id });

        const { participantData } = job.data;
        logger.info('📦 Received participantData', participantData);

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

            logger.info('💾 Participant saved/updated', { participantId: participant._id });

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
                    logger.warn('⚠️ Could not fetch batch info', {
                        batchId: participantData.batchId,
                        error: error?.message || 'Unknown error',
                    });
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

            // Append to Google Sheet
            await appendDataToGoogleSheet(sheetTitle, headers, rowData);

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
//         logger.info('🔁 Worker started for job', { jobId: job.id });

//         const { participantData } = job.data;
//         logger.info('📦 Received participantData', participantData);

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

//             logger.info('💾 Participant saved/updated', { participantId: participant._id });

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

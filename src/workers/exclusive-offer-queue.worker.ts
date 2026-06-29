import { Worker } from 'bullmq';
import mongoose from 'mongoose';

import { redisConnection } from '../queues/connection';
import logger from 'src/shared/logger';

import { appendDataToGoogleSheet } from 'src/utils/googleSheets';
import { sanitizePhoneNumber } from 'src/utils/phoneSanitizer';
import { ExclusiveOfferParticipant } from 'src/modules/exclusive/exclusive-offer.model';

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
            // GOOGLE SHEET
            // ============================
            const registrationDate = new Date().toLocaleString('en-BD', {
                timeZone: 'Asia/Dhaka',
            });

            logger.info('📤 Attempting to append to Google Sheets...');

            await appendDataToGoogleSheet(
                'Exclusive Offer Course',
                [
                    'Name',
                    'Phone',
                    'WhatsApp',
                    'Email',
                    'Occupation',
                    'Course',
                    'Offer Price',
                    'Transaction ID',
                    'Payment Status',
                    'Registered At',
                ],
                [
                    participant.name || participantData.name,
                    participant.phone || cleanPhone,
                    participant.whatsapp || participantData.whatsapp || '',
                    participant.email || participantData.email || '',
                    participant.occupation || participantData.occupation || '',
                    participant.courseTitle || 'Voice & Public Speaking Masterclass',
                    String(participant.offerPrice || participantData.offerPrice || 199),
                    participantData.transactionId || '',
                    participantData.paymentStatus || 'success',
                    registrationDate,
                ],
            );

            logger.info('✅ Google Sheet updated successfully');
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

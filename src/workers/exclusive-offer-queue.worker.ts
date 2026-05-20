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

        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            const [participant] = await ExclusiveOfferParticipant.create(
                [{ ...participantData, phone: cleanPhone }],
                { session },
            );

            await session.commitTransaction();
            session.endSession();
            logger.info('💾 Database insert successful', { participantId: participant._id });

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
                    'Email',
                    'Course',
                    'Offer Price',
                    'Transaction ID',
                    'Payment Status',
                    'Registered At',
                ],
                [
                    participant.name,
                    cleanPhone,
                    participant.email,
                    participant.courseTitle,
                    String(participant.offerPrice),
                    participantData.transactionId || '',
                    participantData.paymentStatus || 'pending',
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

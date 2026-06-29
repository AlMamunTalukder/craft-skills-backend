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

            // Check if participant already exists (in case of duplicate job)
            let participant = await ExclusiveOfferParticipant.findOne({
                transactionId: participantData.transactionId,
            });

            if (!participant) {
                // Create new participant
                const [newParticipant] = await ExclusiveOfferParticipant.create(
                    [{ ...participantData, phone: cleanPhone }],
                    { session },
                );
                participant = newParticipant;
                logger.info('💾 Database insert successful', { participantId: participant._id });
            } else {
                // Update existing participant
                await ExclusiveOfferParticipant.findOneAndUpdate(
                    { transactionId: participantData.transactionId },
                    {
                        ...participantData,
                        phone: cleanPhone,
                        paymentStatus: participantData.paymentStatus || 'success',
                    },
                    { session },
                );
                logger.info('💾 Database update successful', {
                    transactionId: participantData.transactionId,
                });
            }

            await session.commitTransaction();
            session.endSession();

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
                    cleanPhone || participantData.phone,
                    participant.whatsapp || participantData.whatsapp || '',
                    participant.email || participantData.email || '',
                    participant.occupation || participantData.occupation || '',
                    participant.courseTitle || 'Voice & Public Speaking Masterclass',
                    String((participant as any).price || participantData.offerPrice || 199),
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

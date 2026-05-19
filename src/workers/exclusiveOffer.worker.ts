// ============================================
// server/workers/exclusiveOffer.worker.ts
// ============================================

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
        const { participantData } = job.data;

        // ============================================
        // CLEAN PHONE NUMBER
        // ============================================

        const cleanPhone = sanitizePhoneNumber(participantData.phone) || participantData.phone;

        logger.info(
            `Processing Exclusive Offer Registration: ${participantData.email || cleanPhone}`,
        );

        const session = await mongoose.startSession();

        session.startTransaction();

        try {
            // ============================================
            // CREATE PARTICIPANT
            // ============================================

            const [participant] = await ExclusiveOfferParticipant.create(
                [
                    {
                        ...participantData,
                        phone: cleanPhone,
                    },
                ],
                { session },
            );

            await session.commitTransaction();

            session.endSession();

            logger.info(`Exclusive Offer Participant Saved: ${participant._id}`);

            // ============================================
            // REGISTRATION DATE
            // ============================================

            const registrationDate = new Date().toLocaleString('en-BD', {
                timeZone: 'Asia/Dhaka',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            });

            // ============================================
            // GOOGLE SHEET TITLE
            // ============================================

            const sheetTitle = 'Exclusive Offer Course';

            // ============================================
            // APPEND DATA TO GOOGLE SHEET
            // ============================================

            await appendDataToGoogleSheet(
                sheetTitle,

                [
                    'Name',
                    'Phone',
                    'Email',
                    'Course Title',
                    // 'Regular Price',
                    'Offer Price',
                    'Registered At',
                ],

                [
                    participant.name || '',
                    cleanPhone || '',
                    participant.email || '',
                    participant.courseTitle || 'Voice & Public Speaking Masterclass',
                    // String(participant.regularPrice || 5500),
                    String(participant.offerPrice || 190),
                    registrationDate,
                ],
            );

            logger.info(`Exclusive Offer data appended to Google Sheet: ${sheetTitle}`);

            return participant;
        } catch (error: any) {
            await session.abortTransaction();

            session.endSession();

            logger.error(`Exclusive Offer Worker Error (Job: ${job.id}): ${error.message}`, {
                error,
            });

            throw error;
        }
    },

    {
        connection: redisConnection,
    },
);

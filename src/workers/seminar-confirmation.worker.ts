import { Worker } from 'bullmq';
import mongoose from 'mongoose';
import { redisConnection } from '../queues/connection';
import { appendDataToGoogleSheet } from 'src/utils/googleSheets';
import logger from 'src/shared/logger';
import { SeminarConfirmation } from 'src/modules/seminar-confirmation/seminar-confirmation.model';
import { sanitizePhoneNumber } from 'src/utils/phoneSanitizer';

new Worker(
    'seminar-confirmation-queue',
    async (job) => {
        const { confirmationData, seminarTitle } = job.data;

        // --- CLEAN NUMBERS ---
        const cleanPhone = sanitizePhoneNumber(confirmationData.phone) || confirmationData.phone;
        const cleanWhatsapp =
            sanitizePhoneNumber(confirmationData.whatsapp) || confirmationData.whatsapp;

        logger.info(`Processing confirmation for: ${cleanPhone}`);

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Create confirmation record with CLEANED data
            const [confirmation] = await SeminarConfirmation.create(
                [
                    {
                        ...confirmationData,
                        phone: cleanPhone,
                        whatsapp: cleanWhatsapp,
                    },
                ],
                { session },
            );

            await session.commitTransaction();
            session.endSession();

            // 2. Append to Google Sheet
            const confirmationDate = new Date().toLocaleString('en-BD', {
                timeZone: 'Asia/Dhaka',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            });

            const sheetTitle = `${seminarTitle}-confirmation (pdf)`;

            await appendDataToGoogleSheet(
                sheetTitle,
                ['Name', 'Phone', 'WhatsApp', 'Email', 'Occupation', 'Address', 'Confirmed At'],
                [
                    confirmation.name || '',
                    cleanPhone, // Pure English Format (8801...)
                    cleanWhatsapp, // Pure English Format (8801...)
                    confirmation.email || '',
                    confirmation.occupation || '',
                    confirmation.address || '',
                    confirmationDate,
                ],
            );

            return confirmation;
        } catch (error: any) {
            await session.abortTransaction();
            session.endSession();
            logger.error(`Error processing job ${job.id}: ${error.message}`, { error });
            throw error;
        }
    },
    {
        connection: redisConnection,
    },
);

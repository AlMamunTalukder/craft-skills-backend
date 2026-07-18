import { Worker } from 'bullmq';
import mongoose from 'mongoose';
import { redisConnection } from '../queues/connection';
import { appendDataToGoogleSheet } from 'src/utils/googleSheets';
import logger from 'src/shared/logger';
import { ExclusiveGift } from 'src/modules/exclusive/exclusive-gift.model';
import { sanitizePhoneNumber } from 'src/utils/phoneSanitizer';

new Worker(
    'exclusive-gift-queue',
    async (job) => {
        const { giftData, batchTitle, batchNo } = job.data;

        const cleanPhone = sanitizePhoneNumber(giftData.phone) || giftData.phone;
        const cleanWhatsapp = sanitizePhoneNumber(giftData.whatsapp) || giftData.whatsapp;

        logger.info(`Processing exclusive gift for: ${cleanPhone}`);

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const [gift] = await ExclusiveGift.create(
                [
                    {
                        ...giftData,
                        phone: cleanPhone,
                        whatsapp: cleanWhatsapp,
                    },
                ],
                { session },
            );

            await session.commitTransaction();
            session.endSession();

            const confirmationDate = new Date().toLocaleString('en-BD', {
                timeZone: 'Asia/Dhaka',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            });

            const sheetTitle = `Exclusive Gift - ${batchTitle} (Batch ${batchNo})`;

            await appendDataToGoogleSheet(
                sheetTitle,
                ['Name', 'Phone', 'WhatsApp', 'Email', 'Occupation', 'Address', 'Confirmed At'],
                [
                    gift.name || '',
                    cleanPhone,
                    cleanWhatsapp,
                    gift.email || '',
                    gift.occupation || '',
                    gift.address || '',
                    confirmationDate,
                ],
            );

            logger.info(`✅ Exclusive gift confirmed for: ${gift.name}`);
            return gift;
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

// server/workers/seminar-confirmation.worker.ts
import { Worker } from 'bullmq';
import mongoose from 'mongoose';
import { redisConnection } from '../queues/connection';
import { appendDataToGoogleSheet } from 'src/utils/googleSheets';
import logger from 'src/shared/logger';
import { SeminarConfirmation } from 'src/modules/seminar-confirmation/seminar-confirmation.model';

new Worker(
    'seminar-confirmation-queue',
    async (job) => {
        const { confirmationData, seminarTitle } = job.data;
        logger.info(`Processing confirmation for: ${confirmationData.phone}`);

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Create confirmation record
            const [confirmation] = await SeminarConfirmation.create([confirmationData], {
                session,
            });

            // 2. Commit DB transaction
            await session.commitTransaction();
            session.endSession();

            logger.info(`Confirmation ${confirmation._id} saved to DB`);

            // 3. Append to Google Sheet
            const confirmationDate = new Date().toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            });

            const sheetTitle = `${seminarTitle}-confirmation`;

            await appendDataToGoogleSheet(
                sheetTitle,
                ['Name', 'Phone', 'WhatsApp', 'Email', 'Occupation', 'Address', 'Confirmed At'],
                [
                    confirmation.name || '',
                    confirmation.phone || '',
                    confirmation.whatsapp || '',
                    confirmation.email || '',
                    confirmation.occupation || '',
                    confirmation.address || '',
                    confirmationDate,
                ],
            );

            logger.info(`Data successfully appended to Google Sheet: ${sheetTitle}`);

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

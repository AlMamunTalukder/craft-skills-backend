import { Worker } from 'bullmq';
import mongoose from 'mongoose';
import { redisConnection } from '../queues/connection';
import { Participant, Seminar } from '../modules/seminar/seminar.model';
import { appendDataToGoogleSheet } from 'src/utils/googleSheets';
import logger from 'src/shared/logger';

new Worker(
    'participant-queue',
    async (job) => {
        const { participantData } = job.data;
        logger.info(
            `Processing registration for: ${participantData.email || participantData.phone}`,
        );

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Create participant
            const [participant] = await Participant.create([participantData], { session });

            // 2. Update seminar
            const seminar = await Seminar.findByIdAndUpdate(
                participantData.seminarId,
                { $push: { participants: participant._id } },
                { new: true, session },
            );

            if (!seminar) {
                throw new Error(`Seminar with ID ${participantData.seminarId} not found`);
            }

            // 3. Commit DB transaction first
            await session.commitTransaction();
            session.endSession();

            logger.info(
                `Participant ${participant._id} saved to DB and linked to seminar ${seminar._id}`,
            );

            // 4. Append to Google Sheet (OUTSIDE transaction)
            const registrationDate = new Date().toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            });

            const sheetTitle = `${seminar.sl || 'Seminar'}-রেজিস্ট্রেশন`;

            await appendDataToGoogleSheet(
                sheetTitle,
                ['Name', 'Phone', 'WhatsApp', 'Email', 'Occupation', 'Address', 'Registered At'],
                [
                    participant.name || '',
                    participant.phone || '',
                    participant.whatsapp || '',
                    participant.email || '',
                    participant.occupation || '',
                    participant.address || '',
                    registrationDate,
                ],
            );

            logger.info(`Data successfully appended to Google Sheet: ${sheetTitle}`);

            return participant;
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

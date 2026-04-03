import { Worker } from 'bullmq';
import mongoose from 'mongoose';
import { redisConnection } from '../queues/connection';
import { Participant, Seminar } from '../modules/seminar/seminar.model';
import { appendDataToGoogleSheet } from 'src/utils/googleSheets';
import logger from 'src/shared/logger';
import { sanitizePhoneNumber } from 'src/utils/phoneSanitizer';

new Worker(
    'participant-queue',
    async (job) => {
        const { participantData } = job.data;

        // --- 1. CLEAN THE NUMBERS (ENGLISH ONLY & 880... FORMAT) ---
        const cleanPhone = sanitizePhoneNumber(participantData.phone) || participantData.phone;
        const cleanWhatsapp =
            sanitizePhoneNumber(participantData.whatsapp) || participantData.whatsapp;

        logger.info(`Processing registration for: ${participantData.email || cleanPhone}`);

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // --- 2. CREATE PARTICIPANT WITH CLEANED DATA ---
            const [participant] = await Participant.create(
                [
                    {
                        ...participantData,
                        phone: cleanPhone, // Saved as 8801306659464
                        whatsapp: cleanWhatsapp, // Saved as 8801306659464
                    },
                ],
                { session },
            );

            // 3. Update seminar
            const seminar = await Seminar.findByIdAndUpdate(
                participantData.seminarId,
                { $push: { participants: participant._id } },
                { new: true, session },
            );

            if (!seminar) {
                throw new Error(`Seminar with ID ${participantData.seminarId} not found`);
            }

            await session.commitTransaction();
            session.endSession();

            logger.info(
                `Participant ${participant._id} saved to DB and linked to seminar ${seminar._id}`,
            );

            // 4. Prepare registration date
            const registrationDate = new Date().toLocaleString('en-BD', {
                timeZone: 'Asia/Dhaka',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            });

            const sheetTitle = `${seminar.sl || 'Seminar'}- ফ্রি সেমিনার`;

            // --- 5. APPEND TO GOOGLE SHEET (PURE ENGLISH DATA) ---
            await appendDataToGoogleSheet(
                sheetTitle,
                ['Name', 'Phone', 'WhatsApp', 'Email', 'Occupation', 'Address', 'Registered At'],
                [
                    participant.name || '',
                    cleanPhone, // Final check: 8801306659464
                    cleanWhatsapp, // Final check: 8801306659464
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

import { Worker } from 'bullmq';
import mongoose from 'mongoose';
import { redisConnection } from '../queues/connection';
import { Participant, Seminar } from '../modules/seminar/seminar.model';
import { appendDataToGoogleSheet } from 'src/utils/googleSheets';

new Worker(
    'participant-queue',
    async (job) => {
        const { participantData } = job.data;

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
                throw new Error('Seminar not found');
            }

            // 3. Commit DB transaction first
            await session.commitTransaction();
            session.endSession();

            // 4. Append to Google Sheet (OUTSIDE transaction)
            const registrationDate = new Date().toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            });

            await appendDataToGoogleSheet(
                `${seminar.sl}-রেজিস্ট্রেশন`,
                ['Name', 'Phone', 'WhatsApp', 'Email', 'Occupation', 'Address', 'Registered At'],
                [
                    participant.name,
                    participant.phone,
                    participant.whatsapp,
                    participant.email,
                    participant.occupation,
                    participant.address,
                    registrationDate,
                ],
            );

            return participant;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    },
    {
        connection: redisConnection,
    },
);

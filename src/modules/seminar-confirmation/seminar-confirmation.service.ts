// // server/services/seminar-confirmation.service.ts
// import AppError from 'src/errors/AppError';
// import { Seminar } from '../seminar/seminar.model';
// import { seminarConfirmationQueue } from 'src/queues/seminar-confirmation.queue';

// const confirmParticipation = async (data: any): Promise<{ message: string; confirmation: any }> => {
//     try {
//         const { seminarId, ...confirmationData } = data;

//         // Validate seminar exists
//         const seminar = await Seminar.findById(seminarId);
//         if (!seminar) {
//             throw new AppError(404, 'Seminar not found');
//         }

//         // Add job to queue for processing
//         await seminarConfirmationQueue.add('confirm-participation', {
//             confirmationData: {
//                 ...confirmationData,
//                 seminarId,
//                 confirmedAt: new Date(),
//             },
//             seminarTitle: seminar.sl || seminar.title,
//         });

//         return {
//             message:
//                 'PDF download link will be available shortly. Your confirmation is being processed.',
//             confirmation: confirmationData,
//         };
//     } catch (error: any) {
//         if (error instanceof AppError) {
//             throw error;
//         }
//         throw new AppError(500, error.message || 'Confirmation failed');
//     }
// };

// export const seminarConfirmationService = { confirmParticipation };
// server/services/seminar-confirmation.service.ts
import AppError from 'src/errors/AppError';
import { Seminar } from '../seminar/seminar.model';
import { seminarConfirmationQueue } from 'src/queues/seminar-confirmation.queue';

const confirmParticipation = async (data: any): Promise<{ message: string; confirmation: any }> => {
    try {
        const { seminarId, ...confirmationData } = data;

        // Validate seminar exists
        const seminar = await Seminar.findById(seminarId);
        if (!seminar) {
            throw new AppError(404, 'Seminar not found');
        }

        // Add job to queue for processing
        await seminarConfirmationQueue.add('confirm-participation', {
            confirmationData: {
                ...confirmationData,
                seminarId,
                confirmedAt: new Date(),
            },
            seminarTitle: seminar.sl || seminar.title,
        });

        return {
            message:
                'PDF download link will be available shortly. Your confirmation is being processed.',
            confirmation: confirmationData,
        };
    } catch (error: any) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError(500, error.message || 'Confirmation failed');
    }
};

export const seminarConfirmationService = { confirmParticipation };

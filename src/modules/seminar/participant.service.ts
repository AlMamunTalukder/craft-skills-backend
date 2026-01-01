import AppError from 'src/errors/AppError';
import { Seminar } from '../seminar/seminar.model';
import { participantQueue } from 'src/queues/participant.queue';

const registerParticipant = async (data: any): Promise<{ message: string; participant: any }> => {
    try {
        const { seminarId, ...participantData } = data;

        // Validate seminar exists and is active
        const seminar = await Seminar.findById(seminarId);
        if (!seminar) {
            throw new AppError(404, 'Seminar not found');
        }

        if (!seminar.isActive) {
            throw new AppError(400, 'This seminar is not active for registration');
        }

        // Check if registration deadline has passed
        const now = new Date();
        if (now > seminar.registrationDeadline) {
            throw new AppError(400, 'Registration deadline has passed');
        }

        // Add job to queue for processing
        await participantQueue.add('register-participant', {
            participantData: {
                ...participantData,
                seminarId,
                registeredAt: now,
            },
        });

        return {
            message:
                'Successfully registered for the seminar. Your registration is being processed.',
            participant: participantData,
        };
    } catch (error: any) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError(500, error.message || 'Registration failed');
    }
};

export const participantService = { registerParticipant };

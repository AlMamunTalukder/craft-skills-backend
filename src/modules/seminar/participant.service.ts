import { participantQueue } from 'src/queues/participant.queue';
import AppError from 'src/errors/AppError';
import { Seminar } from '../seminar/seminar.model';

const registerParticipant = async (data: any): Promise<{ message: string }> => {
    const seminar = await Seminar.findById(data.seminarId);
    if (!seminar) throw new AppError(404, 'Seminar not found');
    if (!seminar.isActive) throw new AppError(400, 'Seminar inactive');

    await participantQueue.add(
        'register-participant',
        { participantData: data },
        {
            attempts: 5,
            backoff: { type: 'exponential', delay: 3000 },
            removeOnComplete: true,
        },
    );

    return { message: 'Registration queued successfully' };
};

export const participantService = { registerParticipant };

// server/services/participant.service.ts
import AppError from 'src/errors/AppError';
import { Seminar, Participant } from '../seminar/seminar.model';

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

        // Create participant
        const participant = new Participant({
            ...participantData,
            seminarId,
            registeredAt: now,
        });

        await participant.save();

        // Add participant to seminar's participants array
        await Seminar.findByIdAndUpdate(seminarId, { $push: { participants: participant._id } });

        return {
            message: 'Successfully registered for the seminar',
            participant: {
                id: participant._id,
                name: participant.name,
                email: participant.email,
                phone: participant.phone,
                whatsapp: participant.whatsapp,
            },
        };
    } catch (error: any) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError(500, error.message || 'Registration failed');
    }
};

export const participantService = { registerParticipant };

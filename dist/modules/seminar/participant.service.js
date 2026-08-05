"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.participantService = void 0;
const AppError_1 = __importDefault(require("../../errors/AppError"));
const seminar_model_1 = require("../seminar/seminar.model");
const participant_queue_1 = require("../../queues/participant.queue");
const registerParticipant = async (data) => {
    try {
        const { seminarId, ...participantData } = data;
        // Validate seminar exists and is active
        const seminar = await seminar_model_1.Seminar.findById(seminarId);
        if (!seminar) {
            throw new AppError_1.default(404, 'Seminar not found');
        }
        if (!seminar.isActive) {
            throw new AppError_1.default(400, 'This seminar is not active for registration');
        }
        const now = new Date();
        const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        if (sixHoursAgo > seminar.registrationDeadline) {
            throw new AppError_1.default(400, 'Registration deadline has passed');
        }
        // Add job to queue for processing
        await participant_queue_1.participantQueue.add('register-participant', {
            participantData: {
                ...participantData,
                seminarId,
                registeredAt: now,
            },
        });
        return {
            message: 'Successfully registered for the seminar. Your registration is being processed.',
            participant: participantData,
        };
    }
    catch (error) {
        if (error instanceof AppError_1.default) {
            throw error;
        }
        throw new AppError_1.default(500, error.message || 'Registration failed');
    }
};
exports.participantService = { registerParticipant };

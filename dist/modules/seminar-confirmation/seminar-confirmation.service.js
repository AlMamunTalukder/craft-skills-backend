"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seminarConfirmationService = void 0;
// server/services/seminar-confirmation.service.ts
const AppError_1 = __importDefault(require("../../errors/AppError"));
const seminar_model_1 = require("../seminar/seminar.model");
const seminar_confirmation_queue_1 = require("../../queues/seminar-confirmation.queue");
const confirmParticipation = async (data) => {
    try {
        const { seminarId, ...confirmationData } = data;
        // Validate seminar exists
        const seminar = await seminar_model_1.Seminar.findById(seminarId);
        if (!seminar) {
            throw new AppError_1.default(404, 'Seminar not found');
        }
        // Add job to queue for processing
        await seminar_confirmation_queue_1.seminarConfirmationQueue.add('confirm-participation', {
            confirmationData: {
                ...confirmationData,
                seminarId,
                confirmedAt: new Date(),
            },
            seminarTitle: seminar.sl || seminar.title,
        });
        return {
            message: 'PDF download link will be available shortly. Your confirmation is being processed.',
            confirmation: confirmationData,
        };
    }
    catch (error) {
        if (error instanceof AppError_1.default) {
            throw error;
        }
        throw new AppError_1.default(500, error.message || 'Confirmation failed');
    }
};
exports.seminarConfirmationService = { confirmParticipation };

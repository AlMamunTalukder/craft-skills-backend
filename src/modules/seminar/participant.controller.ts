// server/controllers/participant.controller.ts
import type { Request, Response } from 'express';
import catchAsync from 'src/utils/catchAsync';
import { participantService } from './participant.service';

export const participantController = {
    register: catchAsync(async (req: Request, res: Response) => {
        const result = await participantService.registerParticipant(req.body);

        res.status(201).json({
            success: true,
            message: result.message,
            data: result.participant,
        });
    }),
};

// server/controllers/seminar-confirmation.controller.ts
import type { Request, Response } from 'express';
import catchAsync from 'src/utils/catchAsync';
import { seminarConfirmationService } from './seminar-confirmation.service';

export const seminarConfirmationController = {
    confirmParticipation: catchAsync(async (req: Request, res: Response) => {
        const result = await seminarConfirmationService.confirmParticipation(req.body);

        res.status(201).json({
            success: true,
            message: result.message,
            data: result.confirmation,
        });
    }),
};

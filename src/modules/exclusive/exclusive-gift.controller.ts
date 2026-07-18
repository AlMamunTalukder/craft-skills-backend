import type { Request, Response } from 'express';
import catchAsync from 'src/utils/catchAsync';
import { exclusiveGiftService } from './exclusive-gift.service';

export const exclusiveGiftController = {
    confirmGift: catchAsync(async (req: Request, res: Response) => {
        const result = await exclusiveGiftService.confirmGift(req.body);

        res.status(201).json({
            success: true,
            message: result.message,
            data: result.confirmation,
        });
    }),
};

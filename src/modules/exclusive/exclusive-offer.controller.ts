// ============================================
// server/modules/exclusive-offer/exclusive-offer.controller.ts
// ============================================

import catchAsync from 'src/utils/catchAsync';
import sendResponse from 'src/utils/sendResponse';

import { exclusiveOfferService } from './exclusive-offer.service';

const register = catchAsync(async (req, res) => {
    const result = await exclusiveOfferService.registerParticipant(req.body);

    sendResponse(res, {
        success: true,
        statusCode: 201,
        message: 'Successfully registered',
        data: result,
    });
});

export const exclusiveOfferController = {
    register,
};

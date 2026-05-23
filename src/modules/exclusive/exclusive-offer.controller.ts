// ============================================
// server/modules/exclusive-offer/exclusive-offer.controller.ts
// ============================================

import catchAsync from 'src/utils/catchAsync';
import sendResponse from 'src/utils/sendResponse';

import { exclusiveOfferService } from './exclusive-offer.service';
import { ExclusiveOfferParticipant } from './exclusive-offer.model';
import config from 'src/config';

const register = catchAsync(async (req, res) => {
    const result = await exclusiveOfferService.registerParticipant(req.body);

    sendResponse(res, {
        success: true,
        statusCode: 201,
        message: 'Successfully registered',
        data: result,
    });
});

const paymentSuccess = catchAsync(async (req, res) => {
    // console.log('PAYMENT SUCCESS', req.body);

    res.redirect(`${config.frontendUrl}/exclusive/success`);
});

const paymentFail = catchAsync(async (req, res) => {
    // console.log('PAYMENT FAILED');

    res.redirect(`${config.frontendUrl}/exclusive/fail`);
});

const paymentCancel = catchAsync(async (req, res) => {
    // console.log('PAYMENT CANCELLED');

    res.redirect(`${config.frontendUrl}/exclusive/cancel`);
});

const ipn = async (req: any, res: any) => {
    const { tran_id, status } = req.body;

    await ExclusiveOfferParticipant.findOneAndUpdate(
        { transactionId: tran_id },
        {
            paymentStatus: status === 'VALID' ? 'success' : 'failed',
        },
    );

    res.sendStatus(200);
};

const getParticipants = catchAsync(async (req, res) => {
    const participants = await ExclusiveOfferParticipant.find().sort({ createdAt: -1 });
    sendResponse(res, {
        success: true,
        statusCode: 200,
        data: participants,
    });
});

export const exclusiveOfferController = {
    register,
    paymentSuccess,
    paymentFail,
    paymentCancel,
    ipn,
    getParticipants,
};

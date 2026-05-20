// ============================================
// server/modules/exclusive-offer/exclusive-offer.controller.ts
// ============================================

import catchAsync from 'src/utils/catchAsync';
import sendResponse from 'src/utils/sendResponse';

import { exclusiveOfferService } from './exclusive-offer.service';
import { ExclusiveOfferParticipant } from './exclusive-offer.model';

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

    res.redirect(`${process.env.CLIENT_URL}/exclusive/success`);
});

const paymentFail = catchAsync(async (req, res) => {
    // console.log('PAYMENT FAILED');

    res.redirect(`${process.env.CLIENT_URL}/exclusive`);
});

const paymentCancel = catchAsync(async (req, res) => {
    // console.log('PAYMENT CANCELLED');

    res.redirect(`${process.env.CLIENT_URL}/exclusive`);
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

export const exclusiveOfferController = {
    register,
    paymentSuccess,
    paymentFail,
    paymentCancel,
    ipn,
};

// ============================================
// server/modules/exclusive-offer/exclusive-offer.controller.ts
// ============================================

import catchAsync from 'src/utils/catchAsync';
import sendResponse from 'src/utils/sendResponse';

import { exclusiveOfferService } from './exclusive-offer.service';
import { ExclusiveOfferParticipant } from './exclusive-offer.model';
import config from 'src/config';
import { exclusiveOfferQueue } from 'src/queues/exclusiveOffer.queue';

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
    try {
        const { tran_id, val_id, amount, card_type, value_a, value_b, value_c, value_d } = req.body;

        const extraData = JSON.parse(value_d || '{}');

        const participantData = {
            name: value_a,
            phone: value_b,
            email: value_c,

            whatsapp: extraData.whatsapp,
            occupation: extraData.occupation,

            batchId: extraData.batchId,
            batchNo: extraData.batchNo,

            transactionId: tran_id,

            paymentStatus: 'success',
            paymentMethod: card_type || 'sslcommerz',

            amount,

            courseTitle: extraData.courseTitle,
            regularPrice: extraData.regularPrice,
            offerPrice: extraData.offerPrice,

            sslValidationId: val_id,
        };
        // const participantData = {
        //     name: value_a,
        //     phone: value_b,
        //     email: value_c,

        //     transactionId: tran_id,
        //     paymentStatus: 'success',
        //     paymentMethod: card_type || 'sslcommerz',

        //     amount,

        //     courseTitle: extraData.courseTitle,
        //     regularPrice: extraData.regularPrice,
        //     offerPrice: extraData.offerPrice,

        //     sslValidationId: val_id,
        // };

        // SAVE ONLY AFTER SUCCESS
        await exclusiveOfferQueue.add('register', {
            participantData,
        });

        return res.redirect(
            `${config.frontendUrl}/exclusive/success?name=${encodeURIComponent(
                value_a,
            )}&phone=${value_b}&email=${value_c}`,
        );
    } catch (error) {
        return res.redirect(`${config.frontendUrl}/exclusive/fail`);
    }
});
// const paymentSuccess = catchAsync(async (req, res) => {
//     // console.log('PAYMENT SUCCESS', req.body);

//     res.redirect(`${config.frontendUrl}/exclusive/success`);
// });

const paymentFail = catchAsync(async (req, res) => {
    return res.redirect(`${config.frontendUrl}/exclusive/fail`);
});

// const paymentFail = catchAsync(async (req, res) => {
//     // console.log('PAYMENT FAILED');

//     res.redirect(`${config.frontendUrl}/exclusive/fail`);
// });

const paymentCancel = catchAsync(async (req, res) => {
    return res.redirect(`${config.frontendUrl}/exclusive/cancel`);
});
// const paymentCancel = catchAsync(async (req, res) => {
//     // console.log('PAYMENT CANCELLED');

//     res.redirect(`${config.frontendUrl}/exclusive/cancel`);
// });

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

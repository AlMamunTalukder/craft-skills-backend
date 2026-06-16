import catchAsync from 'src/utils/catchAsync';
import sendResponse from 'src/utils/sendResponse';
import { exclusiveOfferService } from './exclusive-offer.service';
import { ExclusiveOfferParticipant } from './exclusive-offer.model';
import config from 'src/config';
import { ExclusiveVisitor } from './exclusive-visitor.model';

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
        const { tran_id, val_id, value_a, value_b, value_c, value_d } = req.body;

        // Parse extra data
        const extraData = JSON.parse(value_d || '{}');

        // Update participant
        await ExclusiveOfferParticipant.findOneAndUpdate(
            { transactionId: tran_id },
            {
                paymentStatus: 'success',
                sslValidationId: val_id,
            },
        );

        // Mark visitor as registered
        if (extraData.visitorId) {
            await ExclusiveVisitor.findOneAndUpdate(
                { visitorId: extraData.visitorId },
                { registered: true, isBlocked: false },
            );
        }

        return res.redirect(
            `${config.frontendUrl}/exclusive/success?name=${encodeURIComponent(
                value_a,
            )}&phone=${value_b}&email=${value_c}`,
        );
    } catch (error) {
        return res.redirect(`${config.frontendUrl}/exclusive/fail`);
    }
});

const paymentFail = catchAsync(async (req, res) => {
    const { tran_id } = req.body;
    if (tran_id) {
        await ExclusiveOfferParticipant.findOneAndUpdate(
            { transactionId: tran_id },
            { paymentStatus: 'failed' },
        );
    }
    return res.redirect(`${config.frontendUrl}/exclusive/fail`);
});

const paymentCancel = catchAsync(async (req, res) => {
    return res.redirect(`${config.frontendUrl}/exclusive/cancel`);
});

const ipn = async (req: any, res: any) => {
    const { tran_id, status } = req.body;
    await ExclusiveOfferParticipant.findOneAndUpdate(
        { transactionId: tran_id },
        { paymentStatus: status === 'VALID' ? 'success' : 'failed' },
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

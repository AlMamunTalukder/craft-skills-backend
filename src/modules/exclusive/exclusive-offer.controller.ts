import catchAsync from 'src/utils/catchAsync';
import sendResponse from 'src/utils/sendResponse';
import { exclusiveOfferService } from './exclusive-offer.service';
import { ExclusiveOfferParticipant } from './exclusive-offer.model';
import { ExclusiveOfferSettings } from './exclusive-offer-settings.model';
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
        const extraData = JSON.parse(value_d || '{}');

        await ExclusiveOfferParticipant.findOneAndUpdate(
            { transactionId: tran_id },
            {
                paymentStatus: 'success',
                sslValidationId: val_id,
                price: extraData.price || 199,
            },
        );

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

// ✅ GET all participants
const getParticipants = catchAsync(async (req, res) => {
    const participants = await ExclusiveOfferParticipant.find().sort({ createdAt: -1 });
    sendResponse(res, {
        success: true,
        statusCode: 200,
        data: participants,
    });
});

// ✅ GET single participant
const getParticipantById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const participant = await ExclusiveOfferParticipant.findById(id);
    if (!participant) {
        return sendResponse(res, {
            success: false,
            statusCode: 404,
            message: 'Participant not found',
            data: null,
        });
    }
    sendResponse(res, {
        success: true,
        statusCode: 200,
        data: participant,
    });
});

// ✅ CREATE participant (admin)
const createParticipant = catchAsync(async (req, res) => {
    const participant = await ExclusiveOfferParticipant.create({
        ...req.body,
        addedByAdmin: true,
        paymentStatus: 'success',
    });

    // Send to Google Sheets
    try {
        await exclusiveOfferService.sendToGoogleSheets(participant);
    } catch (error) {
        console.error('Google Sheets error:', error);
    }

    sendResponse(res, {
        success: true,
        statusCode: 201,
        message: 'Participant added successfully',
        data: participant,
    });
});

// ✅ UPDATE participant
const updateParticipant = catchAsync(async (req, res) => {
    const { id } = req.params;
    const participant = await ExclusiveOfferParticipant.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
    });
    if (!participant) {
        return sendResponse(res, {
            success: false,
            statusCode: 404,
            message: 'Participant not found',
            data: null,
        });
    }
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Participant updated successfully',
        data: participant,
    });
});

// ✅ DELETE participant
const deleteParticipant = catchAsync(async (req, res) => {
    const { id } = req.params;
    const participant = await ExclusiveOfferParticipant.findByIdAndDelete(id);
    if (!participant) {
        return sendResponse(res, {
            success: false,
            statusCode: 404,
            message: 'Participant not found',
            data: null,
        });
    }
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Participant deleted successfully',
        data: null,
    });
});

// ✅ Get Price Setting
const getPrice = catchAsync(async (req, res) => {
    const settings = await ExclusiveOfferSettings.findOne();
    sendResponse(res, {
        success: true,
        statusCode: 200,
        data: settings || { price: 199 },
    });
});

// ✅ Update Price Setting
const updatePrice = catchAsync(async (req, res) => {
    const { price } = req.body;
    const settings = await ExclusiveOfferSettings.findOneAndUpdate(
        {},
        { price },
        { upsert: true, new: true },
    );
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Price updated successfully',
        data: settings,
    });
});

export const exclusiveOfferController = {
    register,
    paymentSuccess,
    paymentFail,
    paymentCancel,
    ipn,
    getParticipants,
    getParticipantById,
    createParticipant,
    updateParticipant,
    deleteParticipant,
    getPrice,
    updatePrice,
};

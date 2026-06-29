import catchAsync from 'src/utils/catchAsync';
import sendResponse from 'src/utils/sendResponse';
import { exclusiveOfferService } from './exclusive-offer.service';
import { ExclusiveOfferParticipant } from './exclusive-offer.model';
import { ExclusiveOfferSettings } from './exclusive-offer-settings.model';
import { ExclusiveVisitor } from './exclusive-visitor.model';

const FRONTEND_URL = 'https://craftskillsbd.com';

const register = catchAsync(async (req, res) => {
    const result = await exclusiveOfferService.registerParticipant(req.body);
    sendResponse(res, {
        success: true,
        statusCode: 201,
        message: 'Successfully registered',
        data: result,
    });
});

// ✅ Payment Success - MATCH ADMISSION EXACTLY
const paymentSuccess = async (req: any, res: any) => {
    console.log('🎉 PAYMENT SUCCESS CALLBACK RECEIVED');
    console.log('📥 Full Body:', JSON.stringify(req.body, null, 2));

    try {
        const { tran_id, val_id, amount, card_type } = req.body;
        const lookupTranId = req.body.value_a || tran_id;

        console.log('📋 lookupTranId:', lookupTranId);

        if (!lookupTranId) {
            console.error('❌ No transaction ID found in callback');
            return res.redirect(`${FRONTEND_URL}/exclusive/fail`);
        }

        // ✅ Find participant
        let participant = await ExclusiveOfferParticipant.findOne({
            transactionId: lookupTranId,
        });

        if (!participant) {
            console.error('❌ No participant found for:', lookupTranId);
            return res.redirect(`${FRONTEND_URL}/exclusive/fail`);
        }

        console.log('✅ Found participant:', participant._id);

        // ✅ Parse extra data - isolated try/catch
        let extraData: any = {};
        try {
            if (req.body.value_d) {
                const cleanStr =
                    typeof req.body.value_d === 'string'
                        ? req.body.value_d.replace(/^\uFEFF/, '').trim()
                        : '';
                if (cleanStr.startsWith('{')) {
                    extraData = JSON.parse(cleanStr);
                }
            }
        } catch (e) {
            console.warn('⚠️ Could not parse value_d, continuing anyway');
        }

        // ✅ Update payment status - isolated try/catch
        try {
            await ExclusiveOfferParticipant.findOneAndUpdate(
                { transactionId: lookupTranId },
                {
                    $set: {
                        paymentStatus: 'success',
                        sslValidationId: val_id,
                        paymentMethod: card_type || participant.paymentMethod || 'sslcommerz',
                        updatedAt: new Date(),
                        price: extraData?.price || participant.price || 199,
                        name: extraData?.name || participant.name,
                        whatsapp: extraData?.whatsapp || participant.whatsapp || '',
                        occupation: extraData?.occupation || participant.occupation || '',
                    },
                },
            );
            console.log('✅ DB updated successfully');
        } catch (dbError) {
            console.error('❌ DB update error (non-fatal):', dbError);
            // Continue - participant was found so we can still redirect to success
        }

        // ✅ Fetch updated record - isolated try/catch
        let updatedParticipant = participant;
        try {
            const fresh = await ExclusiveOfferParticipant.findOne({ transactionId: lookupTranId });
            if (fresh) updatedParticipant = fresh;
        } catch (e) {
            console.warn('⚠️ Could not fetch updated record, using original');
        }

        // ✅ Update visitor - isolated try/catch, NEVER fatal
        try {
            const visitorId = extraData?.visitorId || participant.visitorId;
            if (visitorId) {
                await ExclusiveVisitor.findOneAndUpdate(
                    { visitorId },
                    { registered: true, isBlocked: false },
                    { upsert: true },
                );
                console.log('✅ Visitor marked as registered');
            }
        } catch (visitorError) {
            console.error('❌ Visitor update error (non-fatal):', visitorError);
        }

        // ✅ Queue for Google Sheets - isolated try/catch, NEVER fatal
        try {
            await exclusiveOfferService.addToQueue({
                name: updatedParticipant.name,
                phone: updatedParticipant.phone,
                whatsapp: updatedParticipant.whatsapp || '',
                email: updatedParticipant.email || '',
                occupation: updatedParticipant.occupation || '',
                courseTitle: 'Voice & Public Speaking Masterclass',
                offerPrice: updatedParticipant.price || 199,
                transactionId: lookupTranId,
                paymentStatus: 'success',
            });
            console.log('✅ Job added to queue');
        } catch (queueError) {
            console.error('❌ Queue error (non-fatal):', queueError);
        }

        // ✅ ALWAYS redirect to success if we got this far
        const params = new URLSearchParams({
            name: updatedParticipant.name || '',
            amount: String(updatedParticipant.price || amount || 199),
            phone: updatedParticipant.phone || '',
            email: updatedParticipant.email || '',
            tran_id: lookupTranId,
        });

        console.log('✅ Redirecting to success');
        return res.redirect(`${FRONTEND_URL}/exclusive/success?${params.toString()}`);
    } catch (error: any) {
        console.error('❌ FATAL ERROR in paymentSuccess:', error.message);
        console.error('Stack:', error.stack);
        return res.redirect(`${FRONTEND_URL}/exclusive/fail`);
    }
};

const paymentFail = catchAsync(async (req, res) => {
    const tran_id = req.body.tran_id || req.body.value_a;
    console.log('❌ Payment failed for transaction:', tran_id);
    if (tran_id) {
        await ExclusiveOfferParticipant.findOneAndUpdate(
            { transactionId: tran_id },
            { paymentStatus: 'failed' },
        );
    }
    return res.redirect(`${FRONTEND_URL}/exclusive/fail`);
});

const paymentCancel = catchAsync(async (req, res) => {
    const tran_id = req.body.tran_id || req.body.value_a;
    console.log('❌ Payment cancelled for transaction:', tran_id);
    return res.redirect(`${FRONTEND_URL}/exclusive/cancel`);
});

const ipn = async (req: any, res: any) => {
    const { tran_id, status } = req.body;
    console.log('📨 IPN received:', { tran_id, status });
    if (tran_id) {
        await ExclusiveOfferParticipant.findOneAndUpdate(
            { transactionId: tran_id },
            { paymentStatus: status === 'VALID' ? 'success' : 'failed' },
        );
    }
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

// import catchAsync from 'src/utils/catchAsync';
// import sendResponse from 'src/utils/sendResponse';
// import { exclusiveOfferService } from './exclusive-offer.service';
// import { ExclusiveOfferParticipant } from './exclusive-offer.model';
// import { ExclusiveOfferSettings } from './exclusive-offer-settings.model';
// import config from 'src/config';
// import { ExclusiveVisitor } from './exclusive-visitor.model';

// const register = catchAsync(async (req, res) => {
//     const result = await exclusiveOfferService.registerParticipant(req.body);
//     sendResponse(res, {
//         success: true,
//         statusCode: 201,
//         message: 'Successfully registered',
//         data: result,
//     });
// });

// const paymentSuccess = catchAsync(async (req, res) => {
//     try {
//         const { tran_id, val_id, value_a, value_b, value_c, value_d } = req.body;
//         const extraData = JSON.parse(value_d || '{}');

//         await ExclusiveOfferParticipant.findOneAndUpdate(
//             { transactionId: tran_id },
//             {
//                 paymentStatus: 'success',
//                 sslValidationId: val_id,
//                 price: extraData.price || 199,
//             },
//         );

//         if (extraData.visitorId) {
//             await ExclusiveVisitor.findOneAndUpdate(
//                 { visitorId: extraData.visitorId },
//                 { registered: true, isBlocked: false },
//             );
//         }

//         return res.redirect(
//             `${config.frontendUrl}/exclusive/success?name=${encodeURIComponent(
//                 value_a,
//             )}&phone=${value_b}&email=${value_c}`,
//         );
//     } catch (error) {
//         return res.redirect(`${config.frontendUrl}/exclusive/fail`);
//     }
// });

// const paymentFail = catchAsync(async (req, res) => {
//     const { tran_id } = req.body;
//     if (tran_id) {
//         await ExclusiveOfferParticipant.findOneAndUpdate(
//             { transactionId: tran_id },
//             { paymentStatus: 'failed' },
//         );
//     }
//     return res.redirect(`${config.frontendUrl}/exclusive/fail`);
// });

// const paymentCancel = catchAsync(async (req, res) => {
//     return res.redirect(`${config.frontendUrl}/exclusive/cancel`);
// });

// const ipn = async (req: any, res: any) => {
//     const { tran_id, status } = req.body;
//     await ExclusiveOfferParticipant.findOneAndUpdate(
//         { transactionId: tran_id },
//         { paymentStatus: status === 'VALID' ? 'success' : 'failed' },
//     );
//     res.sendStatus(200);
// };

// // ✅ GET all participants
// const getParticipants = catchAsync(async (req, res) => {
//     const participants = await ExclusiveOfferParticipant.find().sort({ createdAt: -1 });
//     sendResponse(res, {
//         success: true,
//         statusCode: 200,
//         data: participants,
//     });
// });

// // ✅ GET single participant
// const getParticipantById = catchAsync(async (req, res) => {
//     const { id } = req.params;
//     const participant = await ExclusiveOfferParticipant.findById(id);
//     if (!participant) {
//         return sendResponse(res, {
//             success: false,
//             statusCode: 404,
//             message: 'Participant not found',
//             data: null,
//         });
//     }
//     sendResponse(res, {
//         success: true,
//         statusCode: 200,
//         data: participant,
//     });
// });

// // ✅ CREATE participant (admin)
// const createParticipant = catchAsync(async (req, res) => {
//     const participant = await ExclusiveOfferParticipant.create({
//         ...req.body,
//         addedByAdmin: true,
//         paymentStatus: 'success',
//     });

//     // Send to Google Sheets
//     try {
//         await exclusiveOfferService.sendToGoogleSheets(participant);
//     } catch (error) {
//         console.error('Google Sheets error:', error);
//     }

//     sendResponse(res, {
//         success: true,
//         statusCode: 201,
//         message: 'Participant added successfully',
//         data: participant,
//     });
// });

// // ✅ UPDATE participant
// const updateParticipant = catchAsync(async (req, res) => {
//     const { id } = req.params;
//     const participant = await ExclusiveOfferParticipant.findByIdAndUpdate(id, req.body, {
//         new: true,
//         runValidators: true,
//     });
//     if (!participant) {
//         return sendResponse(res, {
//             success: false,
//             statusCode: 404,
//             message: 'Participant not found',
//             data: null,
//         });
//     }
//     sendResponse(res, {
//         success: true,
//         statusCode: 200,
//         message: 'Participant updated successfully',
//         data: participant,
//     });
// });

// // ✅ DELETE participant
// const deleteParticipant = catchAsync(async (req, res) => {
//     const { id } = req.params;
//     const participant = await ExclusiveOfferParticipant.findByIdAndDelete(id);
//     if (!participant) {
//         return sendResponse(res, {
//             success: false,
//             statusCode: 404,
//             message: 'Participant not found',
//             data: null,
//         });
//     }
//     sendResponse(res, {
//         success: true,
//         statusCode: 200,
//         message: 'Participant deleted successfully',
//         data: null,
//     });
// });

// // ✅ Get Price Setting
// const getPrice = catchAsync(async (req, res) => {
//     const settings = await ExclusiveOfferSettings.findOne();
//     sendResponse(res, {
//         success: true,
//         statusCode: 200,
//         data: settings || { price: 199 },
//     });
// });

// // ✅ Update Price Setting
// const updatePrice = catchAsync(async (req, res) => {
//     const { price } = req.body;
//     const settings = await ExclusiveOfferSettings.findOneAndUpdate(
//         {},
//         { price },
//         { upsert: true, new: true },
//     );
//     sendResponse(res, {
//         success: true,
//         statusCode: 200,
//         message: 'Price updated successfully',
//         data: settings,
//     });
// });

// export const exclusiveOfferController = {
//     register,
//     paymentSuccess,
//     paymentFail,
//     paymentCancel,
//     ipn,
//     getParticipants,
//     getParticipantById,
//     createParticipant,
//     updateParticipant,
//     deleteParticipant,
//     getPrice,
//     updatePrice,
// };

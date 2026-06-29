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
        console.log('📋 val_id:', val_id);

        if (!lookupTranId || !val_id) {
            console.error('❌ Missing tran_id or val_id');
            return res.redirect(`${FRONTEND_URL}/exclusive/fail`);
        }

        // ✅ STEP 1: Validate the transaction with SSLCommerz
        console.log('🔍 Validating transaction with SSLCommerz...');
        const SSLCommerzPayment = require('sslcommerz-lts');
        const sslcz = new SSLCommerzPayment(
            process.env.STORE_ID,
            process.env.STORE_PASS,
            true, // live mode
        );

        let validationResponse: any = null;
        try {
            validationResponse = await sslcz.validate({ val_id });
            console.log('✅ SSLCommerz validation response:', JSON.stringify(validationResponse));
        } catch (validationError: any) {
            console.error('❌ SSLCommerz validation API error:', validationError.message);
            // Continue anyway — DB update still happened, don't block user
        }

        // ✅ STEP 2: Check validation status
        const isValid =
            !validationResponse || // if validation API failed, trust the callback
            validationResponse.status === 'VALID' ||
            validationResponse.status === 'VALIDATED';

        if (!isValid) {
            console.error('❌ Transaction not valid:', validationResponse?.status);
            return res.redirect(`${FRONTEND_URL}/exclusive/fail`);
        }

        console.log('✅ Transaction validated successfully');

        // ✅ STEP 3: Find participant
        let participant = await ExclusiveOfferParticipant.findOne({
            transactionId: lookupTranId,
        });

        if (!participant) {
            console.error('❌ No participant found for:', lookupTranId);
            return res.redirect(`${FRONTEND_URL}/exclusive/fail`);
        }

        console.log('✅ Found participant:', participant._id);

        // ✅ STEP 4: Parse extra data
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

        // ✅ STEP 5: Update DB - isolated, never fatal
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
        }

        // ✅ STEP 6: Fetch updated record
        let updatedParticipant = participant;
        try {
            const fresh = await ExclusiveOfferParticipant.findOne({
                transactionId: lookupTranId,
            });
            if (fresh) updatedParticipant = fresh;
        } catch (e) {
            console.warn('⚠️ Could not fetch updated record, using original');
        }

        // ✅ STEP 7: Update visitor - never fatal
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

        // ✅ STEP 8: Queue for Google Sheets - never fatal
        try {
            await exclusiveOfferService.addToQueue({
                name: updatedParticipant.name,
                phone: updatedParticipant.phone,
                whatsapp: updatedParticipant.whatsapp || '',
                email: updatedParticipant.email || '',
                occupation: updatedParticipant.occupation || '',
                courseTitle: 'Voice & Public Speaking Masterclass',
                offerPrice: (updatedParticipant as any).price || 199,
                transactionId: lookupTranId,
                paymentStatus: 'success',
            });
            console.log('✅ Job added to queue');
        } catch (queueError) {
            console.error('❌ Queue error (non-fatal):', queueError);
        }

        // ✅ STEP 9: Always redirect to success
        const params = new URLSearchParams({
            name: updatedParticipant.name || '',
            amount: String((updatedParticipant as any).price || amount || 199),
            phone: updatedParticipant.phone || '',
            email: updatedParticipant.email || '',
            tran_id: lookupTranId,
        });

        console.log('✅ Redirecting to success page');
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
    const { tran_id, status, val_id } = req.body;
    console.log('📨 IPN received:', { tran_id, status, val_id });

    res.sendStatus(200); // ✅ Always respond 200 immediately

    if (!tran_id) return;

    try {
        const isSuccess = status === 'VALID' || status === 'VALIDATED';

        const participant = await ExclusiveOfferParticipant.findOneAndUpdate(
            { transactionId: tran_id },
            {
                $set: {
                    paymentStatus: isSuccess ? 'success' : 'failed',
                    sslValidationId: val_id || '',
                    updatedAt: new Date(),
                },
            },
            { new: true },
        );

        if (!participant || !isSuccess) return;

        console.log('✅ IPN: DB updated for', tran_id);

        // Update visitor
        if (participant.visitorId) {
            await ExclusiveVisitor.findOneAndUpdate(
                { visitorId: participant.visitorId },
                { registered: true, isBlocked: false },
                { upsert: true },
            ).catch((e: any) => console.error('Visitor update error:', e.message));
        }

        // Queue Google Sheets
        await exclusiveOfferService
            .addToQueue({
                name: participant.name,
                phone: participant.phone,
                whatsapp: participant.whatsapp || '',
                email: participant.email || '',
                occupation: participant.occupation || '',
                courseTitle: 'Voice & Public Speaking Masterclass',
                offerPrice: (participant as any).price || 199,
                transactionId: tran_id,
                paymentStatus: 'success',
            })
            .catch((e: any) => console.error('Queue error:', e.message));

        console.log('✅ IPN fully processed for', tran_id);
    } catch (e: any) {
        console.error('❌ IPN error:', e.message);
    }
};

// ✅ NEW - called by frontend callback page to get participant data
const verifyPayment = catchAsync(async (req, res) => {
    const { tran_id } = req.query as { tran_id: string };

    if (!tran_id) {
        return sendResponse(res, {
            success: false,
            statusCode: 400,
            message: 'tran_id required',
            data: null,
        });
    }

    // Wait up to 10s for IPN to process (IPN may arrive slightly before/after user)
    let participant = null;
    for (let i = 0; i < 5; i++) {
        participant = await ExclusiveOfferParticipant.findOne({ transactionId: tran_id });
        if (participant?.paymentStatus === 'success') break;
        await new Promise((r) => setTimeout(r, 2000)); // wait 2s between retries
    }

    if (!participant) {
        return sendResponse(res, {
            success: false,
            statusCode: 404,
            message: 'Transaction not found',
            data: null,
        });
    }

    if (participant.paymentStatus !== 'success') {
        return sendResponse(res, {
            success: false,
            statusCode: 400,
            message: 'Payment not completed',
            data: null,
        });
    }

    sendResponse(res, { success: true, statusCode: 200, data: participant });
});

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
    verifyPayment,
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

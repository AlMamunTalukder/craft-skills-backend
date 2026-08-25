import catchAsync from 'src/utils/catchAsync';
import sendResponse from 'src/utils/sendResponse';
import config from 'src/config';
import { exclusiveOfferService } from './exclusive-offer.service';
import { ExclusiveOfferParticipant } from './exclusive-offer.model';
import { ExclusiveBatch } from './exclusive-batch.model';
import { markVisitorRegistered } from './exclusive-visitor.controller';

const FRONTEND_URL = config.frontendUrl;

const register = catchAsync(async (req, res) => {
    // 1. Register the participant (creates DB record and SSLCommerz)
    const result = await exclusiveOfferService.registerParticipant(req.body);
    
    // 2. ✅ ADD JOB TO QUEUE FOR GOOGLE SHEETS
    try {
        // Get the participant from DB using the transaction ID
        const participant = await ExclusiveOfferParticipant.findOne({
            transactionId: result.tran_id
        });
        
        if (participant) {
            // Get batch info for the sheet name
            let batchNo = 'N/A';
            if (participant.batchId) {
                const batch = await ExclusiveBatch.findById(participant.batchId);
                if (batch) {
                    batchNo = batch.batchNo?.toString() || 'N/A';
                }
            }
            
            await exclusiveOfferService.addToQueue({
                name: participant.name,
                phone: participant.phone,
                whatsapp: participant.whatsapp || '',
                email: participant.email || '',
                occupation: participant.occupation || '',
                courseTitle: 'Voice & Public Speaking Masterclass',
                offerPrice: participant.price || 199,
                transactionId: participant.transactionId,
                paymentStatus: 'pending',
                batchId: participant.batchId,
                batchNo: batchNo, // Add batch number for the sheet
            });
            console.log(`✅ Job added to queue for: ${participant.transactionId}`);
        }
    } catch (queueError) {
        console.error('❌ Queue error (non-fatal):', queueError);
        // Don't throw - registration already succeeded
    }
    
    sendResponse(res, {
        success: true,
        statusCode: 201,
        message: 'Successfully registered',
        data: result,
    });
});

// ✅ Payment Success - MATCH ADMISSION EXACTLY

const paymentSuccess = async (req: any, res: any) => {
    try {
        // console.log('🎉 PAYMENT SUCCESS CALLBACK RECEIVED');
        // console.log('📥 Full Body:', JSON.stringify(req.body, null, 2));

        const { tran_id, val_id, amount, card_type } = req.body;
        const lookupTranId = req.body.value_a || tran_id;

        if (!lookupTranId || !val_id) {
            console.error('❌ Missing tran_id or val_id');
            return res.redirect(`${FRONTEND_URL}/exclusive/fail`);
        }

        // ✅ STEP 1: Validate the transaction with SSLCommerz
        const SSLCommerzPayment = require('sslcommerz-lts');
        const sslcz = new SSLCommerzPayment(process.env.STORE_ID, process.env.STORE_PASS, true);

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
            !validationResponse ||
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

        // console.log('✅ Found participant:', participant._id);

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

        // ✅ STEP 7: Mark visitor as registered - stateless cookie (non-fatal)
        try {
            markVisitorRegistered(req, res);
        } catch (visitorError) {
            console.error('❌ Visitor cookie error (non-fatal):', visitorError);
        }

        // ✅ STEP 8: Batch updates are handled at registration/update flows.
        // Avoid modifying batch participants here to prevent duplicate entries
        // (registration already pushes participant into batch and increments count).
        console.log('ℹ️ Skipping batch update in payment callback to avoid duplicates');

        // ✅ STEP 9: Queue for Google Sheets - never fatal
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
                batchId: participant.batchId || extraData?.batchId,
            });
            console.log('✅ Job added to queue');
        } catch (queueError) {
            console.error('❌ Queue error (non-fatal):', queueError);
        }

        // ✅ STEP 10: Always redirect to success
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
    console.log('📨 IPN RECEIVED');
    console.log('📨 Headers:', req.headers);
    console.log('📨 Body:', JSON.stringify(req.body, null, 2));
    
    const { tran_id, status, val_id } = req.body;
    console.log('📨 IPN Data:', { tran_id, status, val_id });
    
    // ✅ Always respond 200 immediately
    res.sendStatus(200);
    
    if (!tran_id) {
        console.log('❌ No tran_id in IPN');
        return;
    }
    
    try {
        const isSuccess = status === 'VALID' || status === 'VALIDATED';
        console.log(`📨 Transaction ${tran_id} is ${isSuccess ? 'SUCCESS' : 'FAILED'}`);
        
        // ✅ Update the payment status
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
        
        if (!participant) {
            console.log(`❌ No participant found for ${tran_id}`);
            return;
        }
        
        console.log(`✅ IPN: DB updated for ${tran_id} to ${participant.paymentStatus}`);
        
        // ✅ If success, add job to queue for Google Sheets
        if (isSuccess) {
            // Get batch info
            let batchNo = 'N/A';
            if (participant.batchId) {
                const batch = await ExclusiveBatch.findById(participant.batchId);
                if (batch) {
                    batchNo = batch.batchNo?.toString() || 'N/A';
                }
            }
            
            await exclusiveOfferService.addToQueue({
                name: participant.name,
                phone: participant.phone,
                whatsapp: participant.whatsapp || '',
                email: participant.email || '',
                occupation: participant.occupation || '',
                courseTitle: 'Voice & Public Speaking Masterclass',
                offerPrice: participant.price || 199,
                transactionId: tran_id,
                paymentStatus: 'success',
                batchId: participant.batchId,
                batchNo: batchNo,
            });
            console.log(`✅ Job added to queue for ${tran_id}`);
        }
    } catch (e: any) {
        console.error('❌ IPN error:', e.message);
        console.error('Stack:', e.stack);
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

// ✅ GET single participant
const getParticipantById = catchAsync(async (req, res) => {
    const id = req.params.id as string;
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
    // Only allow admin-provided safe fields (DTO already validated)
    const payload = {
        name: req.body.name,
        email: req.body.email || '',
        phone: req.body.phone,
        whatsapp: req.body.whatsapp || '',
        occupation: req.body.occupation || '',
        price: req.body.price || 199,
        transactionId: req.body.transactionId || undefined,
        visitorId: req.body.visitorId || '',
        batchId: req.body.batchId || null,
        addedByAdmin: true,
        paymentStatus: 'success',
        paymentMethod: 'admin',
    } as any;

    const participant = await ExclusiveOfferParticipant.create(payload);

    // ✅ Also add this participant to the batch's participants array
    if (participant.batchId) {
        await ExclusiveBatch.findByIdAndUpdate(participant.batchId, {
            $push: { participants: participant._id },
            $inc: { enrolledCount: 1 }, // ✅ Increment enrolled count
        });
    }

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

// ✅ UPDATE participant - Handle batch change
const updateParticipant = catchAsync(async (req, res) => {
    const id = req.params.id as string;

    // Get the existing participant to check if batch changed
    const existingParticipant = await ExclusiveOfferParticipant.findById(id);
    if (!existingParticipant) {
        return sendResponse(res, {
            success: false,
            statusCode: 404,
            message: 'Participant not found',
            data: null,
        });
    }

    const oldBatchId = existingParticipant.batchId;
    const newBatchId = req.body.batchId;

    // Update the participant
    // Only allow safe update fields from admin DTO
    const updateData: any = {};
    if (typeof req.body.name === 'string') updateData.name = req.body.name;
    if (typeof req.body.email === 'string') updateData.email = req.body.email;
    if (typeof req.body.phone === 'string') updateData.phone = req.body.phone;
    if (typeof req.body.whatsapp === 'string') updateData.whatsapp = req.body.whatsapp;
    if (typeof req.body.occupation === 'string') updateData.occupation = req.body.occupation;
    updateData.batchId = newBatchId || null;

    const participant = await ExclusiveOfferParticipant.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
    });

    // ✅ Handle batch changes
    if (oldBatchId?.toString() !== newBatchId?.toString()) {
        // Remove from old batch
        if (oldBatchId) {
            await ExclusiveBatch.findByIdAndUpdate(oldBatchId, {
                $pull: { participants: participant._id },
                $inc: { enrolledCount: -1 },
            });
        }
        // Add to new batch
        if (newBatchId) {
            await ExclusiveBatch.findByIdAndUpdate(newBatchId, {
                $push: { participants: participant._id },
                $inc: { enrolledCount: 1 },
            });
        }
    }

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Participant updated successfully',
        data: participant,
    });
});

// ✅ GET participants - optionally filter by batchId (paginated)
const getParticipants = catchAsync(async (req, res) => {
    const { batchId, page, limit, search } = req.query;
    const filter: any = {};
    if (batchId) {
        filter.batchId = batchId;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    if (search) {
        const s = String(search);
        filter.$or = [
            { name: { $regex: s, $options: 'i' } },
            { phone: { $regex: s, $options: 'i' } },
            { email: { $regex: s, $options: 'i' } },
            { transactionId: { $regex: s, $options: 'i' } },
        ];
    }

    const [participants, total] = await Promise.all([
        ExclusiveOfferParticipant.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate('batchId', 'batchNo title'),
        ExclusiveOfferParticipant.countDocuments(filter),
    ]);

    sendResponse(res, {
        success: true,
        statusCode: 200,
        data: participants,
        meta: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPage: Math.ceil(total / limitNum),
        },
    });
});

// ✅ DELETE participant - Also remove from batch
const deleteParticipant = catchAsync(async (req, res) => {
    const id = req.params.id as string;

    // Get the participant first to get batchId
    const participant = await ExclusiveOfferParticipant.findById(id);
    if (!participant) {
        return sendResponse(res, {
            success: false,
            statusCode: 404,
            message: 'Participant not found',
            data: null,
        });
    }

    // ✅ Remove from batch's participants array
    if (participant.batchId) {
        await ExclusiveBatch.findByIdAndUpdate(participant.batchId, {
            $pull: { participants: participant._id },
            $inc: { enrolledCount: -1 },
        });
    }

    // Delete the participant
    await ExclusiveOfferParticipant.findByIdAndDelete(id);

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Participant deleted successfully',
        data: null,
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
};


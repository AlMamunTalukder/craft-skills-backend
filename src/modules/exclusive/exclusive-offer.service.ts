import AppError from 'src/errors/AppError';
import SSLCommerzPayment from 'sslcommerz-lts';
import config from 'src/config';
import { sanitizePhoneNumber } from 'src/utils/phoneSanitizer';
import { ExclusiveOfferParticipant } from './exclusive-offer.model';
import { appendDataToGoogleSheet } from 'src/utils/googleSheets';
import { exclusiveOfferQueue } from 'src/queues/exclusiveOffer.queue';
import { ExclusiveBatch } from './exclusive-batch.model';
import redisClient from 'src/config/redis';

const FRONTEND_URL = config.frontendUrl;

const registerParticipant = async (payload: any) => {
    try {
        // 1. Get price from settings
        const settings = await ExclusiveBatch.findById(payload.batchId);
        const price = settings?.offerPrice || 299;

        // 2. Sanitize phone
        const cleanPhone = sanitizePhoneNumber(payload.phone) || payload.phone;
        const cleanWhatsapp = payload.whatsapp
            ? sanitizePhoneNumber(payload.whatsapp) || payload.whatsapp
            : '';

        // 3. Generate transaction ID
        const tran_id = `EXCL_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

        // 4. Create participant record (pending)
        const participant = await ExclusiveOfferParticipant.create({
            name: payload.name,
            email: payload.email || '',
            phone: cleanPhone,
            whatsapp: cleanWhatsapp,
            occupation: payload.occupation || '',
            price: price,
            transactionId: tran_id,
            paymentStatus: 'pending',
            paymentMethod: 'sslcommerz',
            visitorId: payload.visitorId || '',
            batchId: payload.batchId || null,
        });

        // 5. Add to batch's participants array
        if (payload.batchId) {
            await ExclusiveBatch.findByIdAndUpdate(payload.batchId, {
                $push: { participants: participant._id },
                $inc: { enrolledCount: 1 },
            });
        }

        // 6. ✅ DO NOT add to queue here - payment is still pending
        // Queue will be added after successful payment via paymentSuccess callback or IPN
        // console.log(`⏭️ Skipping queue add for pending payment: ${tran_id}`);

        // 7. Prepare SSLCommerz data
        const sslData = {
            total_amount: price,
            currency: 'BDT',
            tran_id,

            success_url: `${FRONTEND_URL}/exclusive/payment-callback?tran_id=${tran_id}&status=success`,
            fail_url: `${FRONTEND_URL}/exclusive/payment-callback?tran_id=${tran_id}&status=fail`,
            cancel_url: `${FRONTEND_URL}/exclusive/payment-callback?tran_id=${tran_id}&status=cancel`,
            ipn_url: `${config.apiUrl}/exclusive-offer/ipn`,

            value_a: tran_id,
            value_b: cleanPhone,
            value_c: payload.email || '',
            value_d: JSON.stringify({
                participantId: participant._id.toString(),
                whatsapp: cleanWhatsapp,
                occupation: payload.occupation || '',
                visitorId: payload.visitorId || '',
                price: price,
                name: payload.name,
                batchId: payload.batchId || null,
            }),
            shipping_method: 'NO',
            product_name: 'Voice & Public Speaking Masterclass',
            product_category: 'Education',
            product_profile: 'general',
            cus_name: payload.name,
            cus_email: payload.email || 'noemail@example.com',
            cus_add1: 'Dhaka',
            cus_city: 'Dhaka',
            cus_country: 'Bangladesh',
            cus_phone: cleanPhone,
            ship_name: payload.name,
            ship_add1: 'Dhaka',
            ship_city: 'Dhaka',
            ship_country: 'Bangladesh',
        };

        // 8. Initialize SSLCommerz
        const sslcz = new SSLCommerzPayment(
            process.env.STORE_ID as string,
            process.env.STORE_PASS as string,
            true,
        );

        const apiResponse = await sslcz.init(sslData);

        if (!apiResponse || !apiResponse.GatewayPageURL) {
            // Rollback: remove participant and batch entry
            if (payload.batchId) {
                await ExclusiveBatch.findByIdAndUpdate(payload.batchId, {
                    $pull: { participants: participant._id },
                    $inc: { enrolledCount: -1 },
                });
            }
            await ExclusiveOfferParticipant.findByIdAndDelete(participant._id);
            throw new AppError(500, 'SSLCommerz initialization failed');
        }

        return {
            paymentUrl: apiResponse.GatewayPageURL,
            tran_id,
        };
    } catch (error: any) {
        throw new AppError(500, error.message);
    }
};


// ✅ Send to Google Sheets via queue (batch-specific sheet)
const sendToGoogleSheets = async (participant: any) => {
    // Get batch info for sheet name
    let batchNo = 'N/A';
    if (participant.batchId) {
        const batch = await ExclusiveBatch.findById(participant.batchId);
        if (batch) {
            batchNo = batch.batchNo?.toString() || 'N/A';
        }
    }

    await addToQueue({
        name: participant.name,
        phone: participant.phone,
        whatsapp: participant.whatsapp || '',
        email: participant.email || '',
        occupation: participant.occupation || '',
        courseTitle: 'Voice & Public Speaking Masterclass',
        offerPrice: participant.price || 299,
        transactionId: participant.transactionId,
        paymentStatus: participant.paymentStatus || 'success',
        batchId: participant.batchId,
        batchNo: batchNo,
        addedByAdmin: participant.addedByAdmin || false,
    });
};

// ✅ Add job to queue for background processing
// Deduplicated by transactionId + status so IPN + payment-success cannot
// enqueue twice, but success and failed are tracked independently
// (separate sheets).
const addToQueue = async (participantData: any) => {
    const tranId = participantData?.transactionId;
    const status = (participantData?.paymentStatus || 'success').toLowerCase();
    if (tranId && redisClient?.isReady) {
        try {
            const dedupeKey = `exclusive:sheet-enqueued:${tranId}:${status}`;
            const claimed = await redisClient.set(dedupeKey, '1', {
                NX: true,
                EX: 48 * 60 * 60, // 48h — payments can't be revalidated beyond this
            });
            if (claimed !== 'OK') {
                console.log(`⏭️ Skipping duplicate queue add for ${tranId}:${status}`);
                return;
            }
        } catch (e) {
            // Redis down → fall through; worker-level sheetSynced claim still dedupes
        }
    }
    await exclusiveOfferQueue.add('register', { participantData });
};

export const exclusiveOfferService = {
    registerParticipant,
    sendToGoogleSheets,
    addToQueue,
};

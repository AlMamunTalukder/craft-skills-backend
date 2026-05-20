// ============================================
// server/modules/exclusive-offer/exclusive-offer.service.ts
// ============================================

import AppError from 'src/errors/AppError';
import SSLCommerzPayment from 'sslcommerz-lts';
import config from 'src/config';
import { sanitizePhoneNumber } from 'src/utils/phoneSanitizer';
import { exclusiveOfferQueue } from 'src/queues/exclusiveOffer.queue';

const registerParticipant = async (payload: any) => {
    try {
        // 1. Sanitize phone number
        const cleanPhone = sanitizePhoneNumber(payload.phone) || payload.phone;

        // 2. Generate a unique transaction ID
        const tran_id = `EXCL_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

        // 3. Prepare data for the queue (worker will save to DB and update Google Sheet)
        const participantData = {
            ...payload,
            phone: cleanPhone,
            paymentStatus: 'pending',
            paymentMethod: 'sslcommerz',
            transactionId: tran_id, // worker will use this
            courseTitle: payload.courseTitle || 'Exclusive Offer Masterclass',
            regularPrice: payload.regularPrice || 5500,
            offerPrice: payload.offerPrice || 190,
        };

        // 4. Add job to BullMQ queue (non-blocking)
        await exclusiveOfferQueue.add('register', { participantData });

        // 5. Prepare SSLCommerz data
        const sslData = {
            total_amount: Number(payload.offerPrice || 190),
            currency: 'BDT',
            tran_id,

            // success_url: `${process.env.CLIENT_URL}/exclusive-offer/success`,
            // fail_url: `${CLIENT_URL}/exclusive-offer/fail`,
            // cancel_url: `${FRONTEND_URL}/exclusive-offer/cancel`,
            // ipn_url: `${BACKEND_URL}/api/v1/payment/ipn`,

            success_url: `${config.frontendUrl}/exclusive/success`,
            fail_url: `${config.frontendUrl}/exclusive/fail`,
            cancel_url: `${config.frontendUrl}/exclusive/cancel`,
            ipn_url: `${config.apiUrl}/exclusive-offer/ipn`,

            shipping_method: 'NO',
            product_name: payload.courseTitle || 'Exclusive Offer',
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

        // 6. Initialize SSLCommerz payment (sandbox mode)
        const sslcz = new SSLCommerzPayment(
            process.env.STORE_ID as string,
            process.env.STORE_PASS as string,
            true, // false = sandbox, true = live
        );

        const apiResponse = await sslcz.init(sslData);

        // console.log('SSL RESPONSE:', apiResponse);

        if (!apiResponse || !apiResponse.GatewayPageURL) {
            throw new AppError(500, 'SSLCommerz initialization failed');
        }

        // 7. Return payment URL to the controller
        return {
            paymentUrl: apiResponse.GatewayPageURL,
            tran_id,
        };
    } catch (error: any) {
        throw new AppError(500, error.message);
    }
};

export const exclusiveOfferService = {
    registerParticipant,
};

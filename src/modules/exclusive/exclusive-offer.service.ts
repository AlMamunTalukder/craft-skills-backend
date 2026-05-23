import AppError from 'src/errors/AppError';
import SSLCommerzPayment from 'sslcommerz-lts';
import config from 'src/config';
import { sanitizePhoneNumber } from 'src/utils/phoneSanitizer';
import { exclusiveOfferQueue } from 'src/queues/exclusiveOffer.queue';
import { ExclusiveBatch } from './exclusive-batch.model';

const registerParticipant = async (payload: any) => {
    try {
        // 1. Get the batch details
        const batch = await ExclusiveBatch.findById(payload.batchId);
        if (!batch) {
            throw new AppError(404, 'Batch not found');
        }

        // 2. Check if batch is active and not expired
        if (!batch.isActive) {
            throw new AppError(400, 'This batch is currently inactive');
        }

        const now = new Date();
        if (now > batch.endDate) {
            throw new AppError(400, 'Registration deadline has passed for this batch');
        }

        // 3. Sanitize phone numbers
        const cleanPhone = sanitizePhoneNumber(payload.phone) || payload.phone;
        const cleanWhatsapp = payload.whatsapp
            ? sanitizePhoneNumber(payload.whatsapp) || payload.whatsapp
            : '';

        // 4. Generate a unique transaction ID
        const tran_id = `EXCL_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

        // 5. Prepare data for the queue (worker will save to DB and update Google Sheet)
        const participantData = {
            name: payload.name,
            email: payload.email || '',
            phone: cleanPhone,
            whatsapp: cleanWhatsapp,
            occupation: payload.occupation || '',
            batchId: batch._id,
            batchNo: batch.batchNo,
            courseTitle: batch.title,
            regularPrice: 5500,
            offerPrice: batch.offerPrice,
            paymentStatus: 'pending',
            paymentMethod: 'sslcommerz',
            transactionId: tran_id,
        };

        // 6. Add job to BullMQ queue
        await exclusiveOfferQueue.add('register', { participantData });

        // 7. Prepare SSLCommerz data
        const sslData = {
            total_amount: Number(batch.offerPrice),
            currency: 'BDT',
            tran_id,
            success_url: `${config.frontendUrl}/exclusive/success`,
            fail_url: `${config.frontendUrl}/exclusive/fail`,
            cancel_url: `${config.frontendUrl}/exclusive/cancel`,
            ipn_url: `${config.apiUrl}/exclusive-offer/ipn`,
            shipping_method: 'NO',
            product_name: batch.title,
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

        // 8. Initialize SSLCommerz payment
        const sslcz = new SSLCommerzPayment(
            process.env.STORE_ID as string,
            process.env.STORE_PASS as string,
            true,
        );

        const apiResponse = await sslcz.init(sslData);

        if (!apiResponse || !apiResponse.GatewayPageURL) {
            throw new AppError(500, 'SSLCommerz initialization failed');
        }

        // 9. Return payment URL
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

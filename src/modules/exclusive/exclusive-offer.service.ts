import AppError from 'src/errors/AppError';
import SSLCommerzPayment from 'sslcommerz-lts';
import config from 'src/config';
import { sanitizePhoneNumber } from 'src/utils/phoneSanitizer';
import { ExclusiveVisitor } from './exclusive-visitor.model';
import { ExclusiveOfferParticipant } from './exclusive-offer.model';

const registerParticipant = async (payload: any) => {
    try {
        // 1. Check if visitor is blocked
        if (payload.visitorId) {
            const visitor = await ExclusiveVisitor.findOne({ visitorId: payload.visitorId });
            if (visitor?.isBlocked) {
                throw new AppError(403, 'Your time has expired. Please contact admin.');
            }
        }

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
            transactionId: tran_id,
            paymentStatus: 'pending',
            paymentMethod: 'sslcommerz',
        });

        // 5. Prepare SSLCommerz data
        const sslData = {
            total_amount: 199,
            currency: 'BDT',
            tran_id,
            success_url: `${config.apiUrl}/exclusive-offer/payment-success`,
            fail_url: `${config.apiUrl}/exclusive-offer/payment-fail`,
            cancel_url: `${config.apiUrl}/exclusive-offer/payment-cancel`,
            ipn_url: `${config.apiUrl}/exclusive-offer/ipn`,
            value_a: payload.name,
            value_b: cleanPhone,
            value_c: payload.email || '',
            value_d: JSON.stringify({
                participantId: participant._id.toString(),
                whatsapp: cleanWhatsapp,
                occupation: payload.occupation || '',
                visitorId: payload.visitorId,
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

        // 6. Initialize SSLCommerz
        const sslcz = new SSLCommerzPayment(
            process.env.STORE_ID as string,
            process.env.STORE_PASS as string,
            true,
        );

        const apiResponse = await sslcz.init(sslData);

        if (!apiResponse || !apiResponse.GatewayPageURL) {
            // Delete pending participant if SSL fails
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

export const exclusiveOfferService = {
    registerParticipant,
};

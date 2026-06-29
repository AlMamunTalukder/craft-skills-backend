import AppError from 'src/errors/AppError';
import SSLCommerzPayment from 'sslcommerz-lts';
import config from 'src/config';
import { sanitizePhoneNumber } from 'src/utils/phoneSanitizer';
import { ExclusiveVisitor } from './exclusive-visitor.model';
import { ExclusiveOfferParticipant } from './exclusive-offer.model';
import { ExclusiveOfferSettings } from './exclusive-offer-settings.model';
import { appendDataToGoogleSheet } from 'src/utils/googleSheets';
import { exclusiveOfferQueue } from 'src/queues/exclusiveOffer.queue';

const FRONTEND_URL = 'https://craftskillsbd.com';

const registerParticipant = async (payload: any) => {
    try {
        // 1. Get price from settings
        const settings = await ExclusiveOfferSettings.findOne();
        const price = settings?.price || 199;

        // 2. Check if visitor is blocked
        if (payload.visitorId) {
            const visitor = await ExclusiveVisitor.findOne({ visitorId: payload.visitorId });
            if (visitor?.isBlocked) {
                throw new AppError(403, 'Your time has expired. Please contact admin.');
            }
        }

        // 3. Sanitize phone
        const cleanPhone = sanitizePhoneNumber(payload.phone) || payload.phone;
        const cleanWhatsapp = payload.whatsapp
            ? sanitizePhoneNumber(payload.whatsapp) || payload.whatsapp
            : '';

        // 4. Generate transaction ID
        const tran_id = `EXCL_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

        // 5. Create participant record (pending) - MATCH ADMISSION
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
        });

        // 6. Prepare SSLCommerz data - MATCH ADMISSION
        const sslData = {
            total_amount: price,
            currency: 'BDT',
            tran_id,

            success_url: `${FRONTEND_URL}/exclusive/payment-callback?tran_id=${tran_id}&status=success`,
            fail_url: `${FRONTEND_URL}/exclusive/payment-callback?tran_id=${tran_id}&status=fail`,
            cancel_url: `${FRONTEND_URL}/exclusive/payment-callback?tran_id=${tran_id}&status=cancel`,
            // ipn_url stays pointing to backend - this is correct
            ipn_url: `${config.apiUrl}/exclusive-offer/ipn`,

            // success_url: `${config.apiUrl}/exclusive-offer/payment-success`,
            // fail_url: `${config.apiUrl}/exclusive-offer/payment-fail`,
            // cancel_url: `${config.apiUrl}/exclusive-offer/payment-cancel`,
            // ipn_url: `${config.apiUrl}/exclusive-offer/ipn`,

            value_a: tran_id, // ✅ FIX: Use tran_id like admission
            value_b: cleanPhone,
            value_c: payload.email || '',
            value_d: JSON.stringify({
                participantId: participant._id.toString(),
                whatsapp: cleanWhatsapp,
                occupation: payload.occupation || '',
                visitorId: payload.visitorId || '',
                price: price,
                name: payload.name,
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

        // 7. Initialize SSLCommerz
        const sslcz = new SSLCommerzPayment(
            process.env.STORE_ID as string,
            process.env.STORE_PASS as string,
            true,
        );

        const apiResponse = await sslcz.init(sslData);

        if (!apiResponse || !apiResponse.GatewayPageURL) {
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

// ✅ Send to Google Sheets
const sendToGoogleSheets = async (participant: any) => {
    const registrationDate = new Date().toLocaleString('en-BD', {
        timeZone: 'Asia/Dhaka',
    });

    await appendDataToGoogleSheet(
        'Exclusive Offer Students',
        [
            'Name',
            'Phone',
            'WhatsApp',
            'Email',
            'Occupation',
            'Price',
            'Payment Status',
            'Added By',
            'Registered At',
            'Transaction ID',
        ],
        [
            participant.name || '',
            participant.phone || '',
            participant.whatsapp || '',
            participant.email || '',
            participant.occupation || '',
            String(participant.price || 199),
            participant.paymentStatus || 'success',
            participant.addedByAdmin ? 'Admin' : 'Student',
            registrationDate,
            participant.transactionId || '',
        ],
    );
};

// ✅ Add job to queue for background processing
const addToQueue = async (participantData: any) => {
    await exclusiveOfferQueue.add('register', { participantData });
};

export const exclusiveOfferService = {
    registerParticipant,
    sendToGoogleSheets,
    addToQueue,
};

// import AppError from 'src/errors/AppError';
// import SSLCommerzPayment from 'sslcommerz-lts';
// import config from 'src/config';
// import { sanitizePhoneNumber } from 'src/utils/phoneSanitizer';
// import { ExclusiveVisitor } from './exclusive-visitor.model';
// import { ExclusiveOfferParticipant } from './exclusive-offer.model';
// import { ExclusiveOfferSettings } from './exclusive-offer-settings.model';
// import { appendDataToGoogleSheet } from 'src/utils/googleSheets';

// const registerParticipant = async (payload: any) => {
//     try {
//         // 1. Get price from settings
//         const settings = await ExclusiveOfferSettings.findOne();
//         const price = settings?.price || 199;

//         // 2. Check if visitor is blocked
//         if (payload.visitorId) {
//             const visitor = await ExclusiveVisitor.findOne({ visitorId: payload.visitorId });
//             if (visitor?.isBlocked) {
//                 throw new AppError(403, 'Your time has expired. Please contact admin.');
//             }
//         }

//         // 3. Sanitize phone
//         const cleanPhone = sanitizePhoneNumber(payload.phone) || payload.phone;
//         const cleanWhatsapp = payload.whatsapp
//             ? sanitizePhoneNumber(payload.whatsapp) || payload.whatsapp
//             : '';

//         // 4. Generate transaction ID
//         const tran_id = `EXCL_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

//         // 5. Create participant record (pending)
//         const participant = await ExclusiveOfferParticipant.create({
//             name: payload.name,
//             email: payload.email || '',
//             phone: cleanPhone,
//             whatsapp: cleanWhatsapp,
//             occupation: payload.occupation || '',
//             price: price,
//             transactionId: tran_id,
//             paymentStatus: 'pending',
//             paymentMethod: 'sslcommerz',
//         });

//         // 6. Prepare SSLCommerz data
//         const sslData = {
//             total_amount: price,
//             currency: 'BDT',
//             tran_id,
//             success_url: `${config.apiUrl}/exclusive-offer/payment-success`,
//             fail_url: `${config.apiUrl}/exclusive-offer/payment-fail`,
//             cancel_url: `${config.apiUrl}/exclusive-offer/payment-cancel`,
//             ipn_url: `${config.apiUrl}/exclusive-offer/ipn`,
//             value_a: payload.name,
//             value_b: cleanPhone,
//             value_c: payload.email || '',
//             value_d: JSON.stringify({
//                 participantId: participant._id.toString(),
//                 whatsapp: cleanWhatsapp,
//                 occupation: payload.occupation || '',
//                 visitorId: payload.visitorId,
//                 price: price,
//             }),
//             shipping_method: 'NO',
//             product_name: 'Voice & Public Speaking Masterclass',
//             product_category: 'Education',
//             product_profile: 'general',
//             cus_name: payload.name,
//             cus_email: payload.email || 'noemail@example.com',
//             cus_add1: 'Dhaka',
//             cus_city: 'Dhaka',
//             cus_country: 'Bangladesh',
//             cus_phone: cleanPhone,
//             ship_name: payload.name,
//             ship_add1: 'Dhaka',
//             ship_city: 'Dhaka',
//             ship_country: 'Bangladesh',
//         };

//         // 7. Initialize SSLCommerz
//         const sslcz = new SSLCommerzPayment(
//             process.env.STORE_ID as string,
//             process.env.STORE_PASS as string,
//             true,
//         );

//         const apiResponse = await sslcz.init(sslData);

//         if (!apiResponse || !apiResponse.GatewayPageURL) {
//             await ExclusiveOfferParticipant.findByIdAndDelete(participant._id);
//             throw new AppError(500, 'SSLCommerz initialization failed');
//         }

//         return {
//             paymentUrl: apiResponse.GatewayPageURL,
//             tran_id,
//         };
//     } catch (error: any) {
//         throw new AppError(500, error.message);
//     }
// };

// // ✅ Send to Google Sheets
// const sendToGoogleSheets = async (participant: any) => {
//     const registrationDate = new Date().toLocaleString('en-BD', {
//         timeZone: 'Asia/Dhaka',
//     });

//     await appendDataToGoogleSheet(
//         'Exclusive Offer Students',
//         [
//             'Name',
//             'Phone',
//             'WhatsApp',
//             'Email',
//             'Occupation',
//             'Price',
//             'Payment Status',
//             'Added By',
//             'Registered At',
//         ],
//         [
//             participant.name || '',
//             participant.phone || '',
//             participant.whatsapp || '',
//             participant.email || '',
//             participant.occupation || '',
//             String(participant.price || 199),
//             participant.paymentStatus || 'success',
//             participant.addedByAdmin ? 'Admin' : 'Student',
//             registrationDate,
//         ],
//     );
// };

// export const exclusiveOfferService = {
//     registerParticipant,
//     sendToGoogleSheets,
// };

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exclusiveOfferService = void 0;
const AppError_1 = __importDefault(require("../../errors/AppError"));
const sslcommerz_lts_1 = __importDefault(require("sslcommerz-lts"));
const config_1 = __importDefault(require("../../config"));
const phoneSanitizer_1 = require("../../utils/phoneSanitizer");
const exclusive_offer_model_1 = require("./exclusive-offer.model");
const googleSheets_1 = require("../../utils/googleSheets");
const exclusiveOffer_queue_1 = require("../../queues/exclusiveOffer.queue");
const exclusive_batch_model_1 = require("./exclusive-batch.model");
const redis_1 = __importDefault(require("../../config/redis"));
const FRONTEND_URL = config_1.default.frontendUrl;
const registerParticipant = async (payload) => {
    try {
        // 1. Get price from settings
        const settings = await exclusive_batch_model_1.ExclusiveBatch.findById(payload.batchId);
        const price = settings?.offerPrice;
        // 2. Sanitize phone
        const cleanPhone = (0, phoneSanitizer_1.sanitizePhoneNumber)(payload.phone) || payload.phone;
        const cleanWhatsapp = payload.whatsapp
            ? (0, phoneSanitizer_1.sanitizePhoneNumber)(payload.whatsapp) || payload.whatsapp
            : '';
        // 4. Generate transaction ID
        const tran_id = `EXCL_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
        // 5. Create participant record (pending) - MATCH ADMISSION
        const participant = await exclusive_offer_model_1.ExclusiveOfferParticipant.create({
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
            batchId: payload.batchId || null, // ✅ Save batchId
        });
        if (payload.batchId) {
            await exclusive_batch_model_1.ExclusiveBatch.findByIdAndUpdate(payload.batchId, {
                $push: { participants: participant._id },
                $inc: { enrolledCount: 1 },
            });
        }
        // 6. Prepare SSLCommerz data - MATCH ADMISSION
        const sslData = {
            total_amount: price,
            currency: 'BDT',
            tran_id,
            success_url: `${FRONTEND_URL}/exclusive/payment-callback?tran_id=${tran_id}&status=success`,
            fail_url: `${FRONTEND_URL}/exclusive/payment-callback?tran_id=${tran_id}&status=fail`,
            cancel_url: `${FRONTEND_URL}/exclusive/payment-callback?tran_id=${tran_id}&status=cancel`,
            // ipn_url stays pointing to backend - this is correct
            ipn_url: `${config_1.default.apiUrl}/exclusive-offer/ipn`,
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
        const sslcz = new sslcommerz_lts_1.default(process.env.STORE_ID, process.env.STORE_PASS, true);
        const apiResponse = await sslcz.init(sslData);
        if (!apiResponse || !apiResponse.GatewayPageURL) {
            await exclusive_offer_model_1.ExclusiveOfferParticipant.findByIdAndDelete(participant._id);
            throw new AppError_1.default(500, 'SSLCommerz initialization failed');
        }
        return {
            paymentUrl: apiResponse.GatewayPageURL,
            tran_id,
        };
    }
    catch (error) {
        throw new AppError_1.default(500, error.message);
    }
};
// ✅ Send to Google Sheets
const sendToGoogleSheets = async (participant) => {
    const registrationDate = new Date().toLocaleString('en-BD', {
        timeZone: 'Asia/Dhaka',
    });
    await (0, googleSheets_1.appendDataToGoogleSheet)('Exclusive Offer Students', [
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
    ], [
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
    ]);
};
// ✅ Add job to queue for background processing
// Deduplicated by transactionId so IPN + payment-success cannot enqueue twice.
const addToQueue = async (participantData) => {
    const tranId = participantData?.transactionId;
    if (tranId && redis_1.default?.isReady) {
        try {
            const dedupeKey = `exclusive:sheet-enqueued:${tranId}`;
            const claimed = await redis_1.default.set(dedupeKey, '1', {
                NX: true,
                EX: 48 * 60 * 60, // 48h — payments can't be revalidated beyond this
            });
            if (claimed !== 'OK') {
                console.log(`⏭️ Skipping duplicate queue add for ${tranId}`);
                return;
            }
        }
        catch (e) {
            // Redis down → fall through; worker-level sheetSynced claim still dedupes
        }
    }
    await exclusiveOffer_queue_1.exclusiveOfferQueue.add('register', { participantData });
};
exports.exclusiveOfferService = {
    registerParticipant,
    sendToGoogleSheets,
    addToQueue,
};
// import AppError from '../../errors/AppError';
// import SSLCommerzPayment from 'sslcommerz-lts';
// import config from '../../config';
// import { sanitizePhoneNumber } from '../../utils/phoneSanitizer';
// import { ExclusiveVisitor } from './exclusive-visitor.model';
// import { ExclusiveOfferParticipant } from './exclusive-offer.model';
// import { ExclusiveOfferSettings } from './exclusive-offer-settings.model';
// import { appendDataToGoogleSheet } from '../../utils/googleSheets';
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

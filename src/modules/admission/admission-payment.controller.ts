// server/modules/admission/admission-payment.controller.ts
import type { Request, Response } from 'express';
import catchAsync from 'src/utils/catchAsync';
import SSLCommerzPayment from 'sslcommerz-lts';
import config from 'src/config';
import { Course } from '../course/course.model';
import { CourseBatch } from '../coursebatch/coursebatch.model';
import AppError from 'src/errors/AppError';
import { Admission } from './admission.model';
import { Coupon } from '../coupon/coupon.model';

const FRONTEND_URL = 'https://craftskillsbd.com';

export const admissionPaymentController = {
    initiatePayment: catchAsync(async (req: Request, res: Response) => {
        const {
            name,
            phone,
            email,
            whatsapp,
            facebook,
            courseId,
            batchId,
            couponCode,
            senderNumber,
            paymentMethod,
        } = req.body;

        console.log('🚀 Payment Init:', { name, phone, courseId, batchId });

        const course = await Course.findById(courseId);
        if (!course) throw new AppError(404, 'Course not found');

        const batch = await CourseBatch.findById(batchId);
        if (!batch) throw new AppError(404, 'Batch not found');

        if (!batch.isActive) throw new AppError(400, 'Registration closed');

        const now = new Date();
        if (batch.registrationEnd && now > batch.registrationEnd) {
            throw new AppError(400, 'Registration deadline passed');
        }

        let finalAmount = Math.round(
            course.price -
                (course.price * (course.discount || 0)) / 100 +
                (course.paymentCharge || 0),
        );

        let discountAmount = 0;
        let appliedCoupon = null;

        if (couponCode) {
            try {
                const coupon = await Coupon.findOne({
                    code: couponCode.toUpperCase(),
                    isActive: true,
                });
                if (coupon) {
                    const validFrom = new Date(coupon.validFrom as string);
                    const validTo = new Date(coupon.validTo as string);
                    if (now >= validFrom && now <= validTo) {
                        if (!coupon.maxUsage || coupon.usedCount < coupon.maxUsage) {
                            if (coupon.discountType === 'PERCENTAGE') {
                                discountAmount = (finalAmount * coupon.discount) / 100;
                            } else {
                                discountAmount = coupon.discount;
                            }
                            discountAmount = Math.min(discountAmount, finalAmount);
                            finalAmount = Math.max(0, finalAmount - discountAmount);
                            appliedCoupon = couponCode;
                        }
                    }
                }
            } catch (error) {
                console.log('Invalid coupon:', couponCode);
            }
        }

        if (finalAmount < 10) finalAmount = 10;

        const tran_id = `ADM_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

        const sslData = {
            total_amount: finalAmount,
            currency: 'BDT',
            tran_id,
            success_url: `${config.apiUrl}/admissions/payment/success`,
            fail_url: `${config.apiUrl}/admissions/payment/fail`,
            cancel_url: `${config.apiUrl}/admissions/payment/cancel`,
            ipn_url: `${config.apiUrl}/admissions/payment/ipn`,
            value_a: name,
            value_b: phone,
            value_c: email || '',
            value_d: JSON.stringify({
                whatsapp: whatsapp || '',
                facebook: facebook || '',
                courseId,
                batchId,
                batchName: batch.name,
                batchCode: batch.code,
                courseName: course.name,
                originalAmount: finalAmount,
                discountAmount,
                couponCode: appliedCoupon || '',
                senderNumber: senderNumber || '',
                paymentMethod: paymentMethod || 'sslcommerz',
            }),
            shipping_method: 'NO',
            product_name: course.name,
            product_category: 'Education',
            product_profile: 'general',
            cus_name: name,
            cus_email: email || 'noemail@example.com',
            cus_add1: 'Dhaka',
            cus_city: 'Dhaka',
            cus_country: 'Bangladesh',
            cus_phone: phone,
            ship_name: name,
            ship_add1: 'Dhaka',
            ship_city: 'Dhaka',
            ship_country: 'Bangladesh',
        };

        const sslcz = new SSLCommerzPayment(
            process.env.STORE_ID as string,
            process.env.STORE_PASS as string,
            true,
        );

        try {
            const apiResponse = await sslcz.init(sslData);
            if (!apiResponse?.GatewayPageURL) {
                throw new AppError(500, 'Payment gateway initialization failed');
            }
            console.log('✅ Payment URL:', apiResponse.GatewayPageURL);

            res.status(200).json({
                success: true,
                message: 'Payment initiated',
                data: {
                    paymentUrl: apiResponse.GatewayPageURL,
                    tran_id,
                    amount: finalAmount,
                },
            });
        } catch (error: any) {
            console.error('❌ SSL Error:', error.message);
            throw new AppError(500, error.message);
        }
    }),

    // Payment success callback - COMPLETELY FIXED
    paymentSuccess: async (req: Request, res: Response) => {
        console.log('🎉 ========== PAYMENT SUCCESS ==========');

        try {
            console.log('📦 Body:', JSON.stringify(req.body).substring(0, 1000));

            const { tran_id, val_id, amount, card_type } = req.body;
            const value_a = req.body.value_a || '';
            const value_b = req.body.value_b || '';
            const value_c = req.body.value_c || '';
            const value_d = req.body.value_d || '{}';

            console.log('📋 Data:', {
                value_a,
                value_b,
                value_c,
                value_d: value_d.substring(0, 100),
            });

            // Parse value_d
            let extraData: any = {};

            if (value_d && value_d !== '{}') {
                try {
                    extraData = JSON.parse(value_d);
                    console.log('✅ Parsed value_d');
                } catch (e: any) {
                    console.error('❌ JSON parse error:', e.message);
                    // Try to extract manually
                    const matches = value_d.match(/"([^"]+)"\s*:\s*"([^"]*)"/g) || [];
                    matches.forEach((match: string) => {
                        const [key, value] = match.split('":"');
                        const cleanKey = key.replace(/"/g, '');
                        const cleanValue = value.replace(/"/g, '');
                        extraData[cleanKey] = cleanValue;
                    });
                    console.log('✅ Manual extraction:', extraData);
                }
            } else {
                console.log('⚠️ value_d is empty - data not preserved by SSLCommerz');
            }

            // Build admission data with fallbacks
            const admissionData = {
                name: value_a || 'Unknown',
                phone: value_b || '',
                email: value_c || '',
                whatsapp: extraData.whatsapp || '',
                facebook: extraData.facebook || '',
                courseId: extraData.courseId || null,
                batchId: extraData.batchId || null,
                amount: Number(extraData.originalAmount || amount || 0),
                discountAmount: Number(extraData.discountAmount || 0),
                couponCode: extraData.couponCode || '',
                senderNumber: extraData.senderNumber || value_b || '',
                paymentMethod: extraData.paymentMethod || card_type || 'sslcommerz',
                paymentStatus: 'paid',
                status: 'pending',
                transactionId: tran_id,
                sslValidationId: val_id,
                registeredAt: new Date(),
            };

            console.log('💾 Saving:', JSON.stringify(admissionData));

            // Validate payment
            const sslcz = new SSLCommerzPayment(
                process.env.STORE_ID as string,
                process.env.STORE_PASS as string,
                false,
            );

            const validation = await sslcz.validate({ val_id });
            console.log('🔍 Validation:', validation.status);

            if (validation.status !== 'VALID' && validation.status !== 'VALIDATED') {
                console.error('❌ Payment not valid!');
                return res.redirect(`${FRONTEND_URL}/admission-registration/fail`);
            }

            // Delete any partial IPN record
            await Admission.deleteOne({
                transactionId: tran_id,
                name: { $exists: false },
            });

            // Save to database
            const admission = await Admission.create(admissionData);
            console.log('✅ Saved to DB:', admission._id);

            // Update coupon
            if (extraData.couponCode) {
                await Coupon.findOneAndUpdate(
                    { code: extraData.couponCode.toUpperCase() },
                    { $inc: { usedCount: 1 } },
                );
            }

            // Google Sheets
            try {
                const { appendDataToGoogleSheet } = await import('@/utils/googleSheets');
                const { sanitizePhoneNumber } = await import('@/utils/phoneSanitizer');

                const batch = extraData.batchId
                    ? await CourseBatch.findById(extraData.batchId)
                    : null;
                const course = extraData.courseId
                    ? await Course.findById(extraData.courseId)
                    : null;

                const cleanPhone = sanitizePhoneNumber(value_b) || value_b;
                const cleanWhatsapp = sanitizePhoneNumber(extraData.whatsapp) || '';

                const registrationDate = new Date().toLocaleString('en-BD', {
                    timeZone: 'Asia/Dhaka',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                });

                await appendDataToGoogleSheet(
                    `${batch?.name || extraData.batchName || 'Admission'} - admission`,
                    [
                        'Name',
                        'Phone',
                        'WhatsApp',
                        'Email',
                        'Facebook',
                        'Course',
                        'Batch',
                        'Coupon Code',
                        'Amount',
                        'Payment Method',
                        'Sender Number',
                        'Payment Status',
                        'Transaction ID',
                        'Registered At',
                    ],
                    [
                        value_a,
                        cleanPhone,
                        cleanWhatsapp,
                        value_c,
                        extraData.facebook || '',
                        course?.name || extraData.courseName || '',
                        batch?.name || extraData.batchName || '',
                        extraData.couponCode || '',
                        String(extraData.originalAmount || amount),
                        extraData.paymentMethod || card_type || 'sslcommerz',
                        extraData.senderNumber || value_b || '',
                        'paid',
                        tran_id,
                        registrationDate,
                    ],
                );
                console.log('✅ Google Sheet updated');
            } catch (sheetError: any) {
                console.error('❌ Sheet error:', sheetError.message);
            }

            // Redirect to success
            const params = new URLSearchParams({
                name: value_a,
                amount: String(extraData.originalAmount || amount),
                paid: String(amount),
                courseId: extraData.courseId || '',
                phone: value_b,
                email: value_c,
                tran_id: tran_id,
            });

            const redirectUrl = `${FRONTEND_URL}/admission-registration/success?${params.toString()}`;
            console.log('🔗 Redirect:', redirectUrl);
            return res.redirect(redirectUrl);
        } catch (error: any) {
            console.error('❌ FATAL ERROR:', error.message);
            console.error('❌ Stack:', error.stack);
            return res.redirect(`${FRONTEND_URL}/admission-registration/fail`);
        }
    },

    paymentFail: async (req: Request, res: Response) => {
        console.log('❌ Payment Failed');
        return res.redirect(`${FRONTEND_URL}/admission-registration/fail`);
    },

    paymentCancel: async (req: Request, res: Response) => {
        console.log('🚫 Payment Cancelled');
        return res.redirect(`${FRONTEND_URL}/admission-registration/cancel`);
    },

    ipn: async (req: Request, res: Response) => {
        console.log('📨 IPN:', JSON.stringify(req.body).substring(0, 200));
        const { tran_id, status, val_id } = req.body;

        if (status === 'VALID' || status === 'VALIDATED') {
            const existing = await Admission.findOne({ transactionId: tran_id });
            if (existing) {
                await Admission.findOneAndUpdate(
                    { transactionId: tran_id },
                    { paymentStatus: 'paid', sslValidationId: val_id },
                );
                console.log('✅ IPN updated');
            } else {
                console.log('⚠️ IPN: No record yet, waiting for success callback');
            }
        }
        res.status(200).send('OK');
    },
};

// server/modules/admission/admission-payment.controller.ts
import type { Request, Response } from 'express';
import catchAsync from 'src/utils/catchAsync';
import SSLCommerzPayment from 'sslcommerz-lts';
import config from 'src/config';
import { Course } from '../course/course.model';
import { CourseBatch } from '../coursebatch/coursebatch.model';
import AppError from 'src/errors/AppError';
import logger from 'src/shared/logger';
import { Admission } from './admission.model';
import { Coupon } from '../coupon/coupon.model';

export const admissionPaymentController = {
    // Initiate payment
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

        console.log('🚀 Payment Initiation Request:', { name, phone, courseId, batchId });

        // 1. Validate course and batch exist and are active
        const course = await Course.findById(courseId);
        if (!course) {
            throw new AppError(404, 'Course not found');
        }

        const batch = await CourseBatch.findById(batchId);
        if (!batch) {
            throw new AppError(404, 'Batch not found');
        }

        if (!batch.isActive) {
            throw new AppError(400, 'Registration is closed for this batch');
        }

        // Check registration deadline
        const now = new Date();
        if (batch.registrationEnd && now > batch.registrationEnd) {
            throw new AppError(400, 'Registration deadline has passed');
        }

        // 2. Calculate actual price
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
                            console.log('✅ Coupon applied:', {
                                couponCode,
                                discountAmount,
                                finalAmount,
                            });
                        }
                    }
                }
            } catch (error) {
                console.log('⚠️ Invalid coupon:', couponCode);
            }
        }

        // Ensure minimum amount for SSLCommerz
        if (finalAmount < 10) {
            finalAmount = 10;
        }

        console.log(
            '💰 Final Amount:',
            finalAmount,
            'TK (Original:',
            Math.round(
                course.price -
                    (course.price * (course.discount || 0)) / 100 +
                    (course.paymentCharge || 0),
            ),
            'TK)',
        );

        // 3. Generate unique transaction ID
        const tran_id = `ADM_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

        // 4. Prepare SSLCommerz data
        const sslData = {
            total_amount: finalAmount,
            currency: 'BDT',
            tran_id,

            // Callback URLs
            success_url: `${config.apiUrl}/admissions/payment/success`,
            fail_url: `${config.apiUrl}/admissions/payment/fail`,
            cancel_url: `${config.apiUrl}/admissions/payment/cancel`,
            ipn_url: `${config.apiUrl}/admissions/payment/ipn`,

            // Store all data needed after payment
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

        // 5. Initialize SSLCommerz
        const sslcz = new SSLCommerzPayment(
            process.env.STORE_ID as string,
            process.env.STORE_PASS as string,
            false, // false = LIVE mode
        );

        try {
            const apiResponse = await sslcz.init(sslData);

            if (!apiResponse || !apiResponse.GatewayPageURL) {
                console.error('❌ SSLCommerz init failed: No Gateway URL');
                throw new AppError(500, 'Payment gateway initialization failed');
            }

            console.log('✅ Payment URL generated:', apiResponse.GatewayPageURL);

            // Return payment URL to frontend
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
            console.error('❌ SSLCommerz init error:', error.message);
            logger.error('SSLCommerz init failed:', error);
            throw new AppError(500, 'Payment initialization failed: ' + error.message);
        }
    }),

    // Payment success callback
    paymentSuccess: catchAsync(async (req: Request, res: Response) => {
        console.log('🎉 ========== PAYMENT SUCCESS CALLBACK ==========');
        console.log('📦 Full body keys:', Object.keys(req.body));
        console.log('📦 Content-Type:', req.headers['content-type']);

        const { tran_id, val_id, amount, card_type } = req.body;

        const value_a = req.body.value_a || '';
        const value_b = req.body.value_b || '';
        const value_c = req.body.value_c || '';
        const value_d = req.body.value_d || '{}';

        console.log('📋 Values:', { value_a, value_b, value_c, value_d_length: value_d.length });

        // Parse value_d
        let extraData: any = {};

        if (value_d && value_d !== '{}') {
            try {
                extraData = JSON.parse(value_d);
                console.log('✅ value_d parsed:', extraData);
            } catch (e: any) {
                console.error('❌ JSON parse failed:', e.message);
                console.error('❌ Raw value_d (first 200 chars):', value_d.substring(0, 200));

                // Try URL decode
                try {
                    const decoded = decodeURIComponent(value_d);
                    extraData = JSON.parse(decoded);
                    console.log('✅ Parsed after URL decode:', extraData);
                } catch (e2: any) {
                    console.error('❌ URL decode also failed:', e2.message);

                    // Manual extraction
                    try {
                        const getVal = (key: string) => {
                            const match = value_d.match(new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`));
                            return match ? match[1] : '';
                        };
                        extraData = {
                            courseId: getVal('courseId'),
                            batchId: getVal('batchId'),
                            courseName: getVal('courseName'),
                            batchName: getVal('batchName'),
                            originalAmount: parseFloat(getVal('originalAmount')) || 0,
                            discountAmount: parseFloat(getVal('discountAmount')) || 0,
                            couponCode: getVal('couponCode'),
                            whatsapp: getVal('whatsapp'),
                            facebook: getVal('facebook'),
                            senderNumber: getVal('senderNumber'),
                            paymentMethod: getVal('paymentMethod'),
                        };
                        console.log('✅ Manually extracted:', extraData);
                    } catch (e3: any) {
                        console.error('❌ Manual extraction failed:', e3.message);
                    }
                }
            }
        } else {
            console.error('❌ value_d is EMPTY!');
        }

        // Build admission data
        const admissionData = {
            name: value_a || 'Unknown',
            phone: value_b || '',
            email: value_c || '',
            whatsapp: extraData?.whatsapp || '',
            facebook: extraData?.facebook || '',
            courseId: extraData?.courseId || null,
            batchId: extraData?.batchId || null,
            amount: extraData?.originalAmount || parseFloat(amount) || 0,
            discountAmount: extraData?.discountAmount || 0,
            couponCode: extraData?.couponCode || '',
            senderNumber: extraData?.senderNumber || value_b || '',
            paymentMethod: extraData?.paymentMethod || card_type || 'sslcommerz',
            paymentStatus: 'paid',
            status: 'pending',
            transactionId: tran_id,
            sslValidationId: val_id,
            registeredAt: new Date(),
        };

        console.log('💾 Saving:', admissionData);

        if (!admissionData.courseId || !admissionData.batchId) {
            console.error('❌ MISSING courseId or batchId!');
        }

        try {
            // Validate payment
            const sslcz = new SSLCommerzPayment(
                process.env.STORE_ID as string,
                process.env.STORE_PASS as string,
                false,
            );

            console.log('🔍 Validating payment...');
            const validation = await sslcz.validate({ val_id });
            console.log('✅ Validation:', validation.status);

            if (validation.status !== 'VALID' && validation.status !== 'VALIDATED') {
                console.error('❌ Payment invalid!');
                return res.redirect(`${config.apiUrl}/admission-registration/fail`);
            }

            // Save to database
            const admission = await Admission.create(admissionData);
            console.log('✅ Saved! ID:', admission._id);

            // Update coupon
            if (extraData?.couponCode) {
                await Coupon.findOneAndUpdate(
                    { code: extraData.couponCode.toUpperCase() },
                    { $inc: { usedCount: 1 } },
                );
                console.log('✅ Coupon updated');
            }

            // Google Sheets
            try {
                const { appendDataToGoogleSheet } = await import('@/utils/googleSheets');
                const { sanitizePhoneNumber } = await import('@/utils/phoneSanitizer');

                const batch = extraData?.batchId
                    ? await CourseBatch.findById(extraData.batchId)
                    : null;
                const course = extraData?.courseId
                    ? await Course.findById(extraData.courseId)
                    : null;

                await appendDataToGoogleSheet(
                    `${batch?.name || extraData?.batchName || 'Admission'} - admission`,
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
                        sanitizePhoneNumber(value_b) || value_b,
                        sanitizePhoneNumber(extraData?.whatsapp) || '',
                        value_c,
                        extraData?.facebook || '',
                        course?.name || extraData?.courseName || '',
                        batch?.name || extraData?.batchName || '',
                        extraData?.couponCode || '',
                        (extraData?.originalAmount || amount).toString(),
                        extraData?.paymentMethod || card_type || 'sslcommerz',
                        extraData?.senderNumber || value_b || '',
                        'paid',
                        tran_id,
                        new Date().toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' }),
                    ],
                );
                console.log('✅ Google Sheet updated');
            } catch (sheetError: any) {
                console.error('❌ Google Sheet error:', sheetError.message);
            }

            // Redirect
            const successUrl = new URL(`${config.apiUrl}/admission-registration/success`);
            successUrl.searchParams.set('name', encodeURIComponent(value_a));
            successUrl.searchParams.set('amount', extraData?.originalAmount?.toString() || amount);
            successUrl.searchParams.set('paid', amount);
            successUrl.searchParams.set('courseId', extraData?.courseId || '');
            successUrl.searchParams.set('phone', value_b || '');
            successUrl.searchParams.set('email', value_c || '');
            successUrl.searchParams.set('tran_id', tran_id);

            console.log('🔗 Redirecting to:', successUrl.toString());
            return res.redirect(successUrl.toString());
        } catch (error: any) {
            console.error('❌ CRITICAL ERROR:', error.message);
            console.error('❌ Stack:', error.stack);
            return res.redirect(`${config.apiUrl}/admission-registration/fail`);
        }
    }),

    // Payment fail callback
    paymentFail: catchAsync(async (req: Request, res: Response) => {
        console.log('❌ Payment Failed:', req.body);
        return res.redirect(`${config.apiUrl}/admission-registration/fail`);
    }),

    // Payment cancel callback
    paymentCancel: catchAsync(async (req: Request, res: Response) => {
        console.log('🚫 Payment Cancelled:', req.body);
        return res.redirect(`${config.apiUrl}/admission-registration/cancel`);
    }),

    // IPN (Instant Payment Notification)
    ipn: catchAsync(async (req: Request, res: Response) => {
        console.log('📨 IPN Received:', req.body);
        const { tran_id, status, val_id } = req.body;

        if (status === 'VALID' || status === 'VALIDATED') {
            console.log('✅ IPN: Payment confirmed for', tran_id);

            const existingAdmission = await Admission.findOne({ transactionId: tran_id });

            if (existingAdmission) {
                await Admission.findOneAndUpdate(
                    { transactionId: tran_id },
                    { paymentStatus: 'paid', sslValidationId: val_id },
                );
                console.log('✅ IPN: Updated existing admission');
            } else {
                console.log('⚠️ IPN: No existing admission found for', tran_id);
            }
        }

        res.status(200).send('OK');
    }),
};

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

        // 2. Calculate original price (for record keeping)
        const originalPrice = Math.round(
            course.price -
                (course.price * (course.discount || 0)) / 100 +
                (course.paymentCharge || 0),
        );

        let discountAmount = 0;
        let appliedCoupon = null;

        if (couponCode) {
            try {
                // Validate coupon directly instead of using validateCoupon function
                const coupon = await Coupon.findOne({
                    code: couponCode.toUpperCase(),
                    isActive: true,
                });

                if (coupon) {
                    // Check validity dates
                    const validFrom = new Date(coupon.validFrom as string);
                    const validTo = new Date(coupon.validTo as string);

                    if (now >= validFrom && now <= validTo) {
                        // Check max usage
                        if (!coupon.maxUsage || coupon.usedCount < coupon.maxUsage) {
                            // Calculate discount on original price
                            if (coupon.discountType === 'PERCENTAGE') {
                                discountAmount = (originalPrice * coupon.discount) / 100;
                            } else {
                                discountAmount = coupon.discount;
                            }

                            // Ensure discount doesn't exceed total amount
                            discountAmount = Math.min(discountAmount, originalPrice);
                            appliedCoupon = couponCode;
                        }
                    }
                }
            } catch (error) {
                // If coupon invalid, continue without coupon
                logger.warn(`Invalid coupon attempted: ${couponCode}`);
            }
        }

        // ============ TESTING MODE ============
        // FOR TESTING: Set amount to 1 TK
        // REMOVE THIS IN PRODUCTION
        const finalAmount = 10; // FIXED: Only declare once
        logger.info(
            `🧪 TESTING MODE: Payment amount set to 10 TK (Original: ${originalPrice} TK, Discount: ${discountAmount} TK)`,
        );
        // =====================================

        // 3. Generate unique transaction ID
        const tran_id = `ADM_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

        // 4. Prepare SSLCommerz data
        const sslData = {
            total_amount: finalAmount, // 1 TK for testing
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
                originalAmount: originalPrice, // Store original price for records
                discountAmount,
                couponCode: appliedCoupon,
                senderNumber: senderNumber || '',
                paymentMethod: paymentMethod || '',
                isTestPayment: true, // Flag for testing
            }),

            shipping_method: 'NO',
            product_name: `[TEST] ${course.name}`, // Mark as test
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
            true,
            // true // or false for production
        );

        try {
            const apiResponse = await sslcz.init(sslData);

            if (!apiResponse || !apiResponse.GatewayPageURL) {
                throw new AppError(500, 'Payment gateway initialization failed');
            }

            // Return payment URL to frontend
            res.status(200).json({
                success: true,
                message: 'Test payment initiated (1 TK)',
                data: {
                    paymentUrl: apiResponse.GatewayPageURL,
                    tran_id,
                    amount: finalAmount,
                    originalAmount: originalPrice,
                    isTestPayment: true,
                },
            });
        } catch (error: any) {
            logger.error('SSLCommerz init failed:', error);
            throw new AppError(500, 'Payment initialization failed: ' + error.message);
        }
    }),

    // Payment success callback
    paymentSuccess: catchAsync(async (req: Request, res: Response) => {
        const { tran_id, val_id, amount, card_type } = req.body;
        const { value_a, value_b, value_c, value_d } = req.body;

        // Parse stored data
        const extraData = JSON.parse(value_d || '{}');

        // Validate payment with SSLCommerz (IMPORTANT!)
        const sslcz = new SSLCommerzPayment(
            process.env.STORE_ID as string,
            process.env.STORE_PASS as string,
            config.env !== 'production',
        );

        try {
            // Verify the payment is valid
            const validation = await sslcz.validate({ val_id });

            if (validation.status !== 'VALID' && validation.status !== 'VALIDATED') {
                logger.error('Payment validation failed:', { tran_id, validation });
                return res.redirect(`${config.frontendUrl}/admission-registration/fail`);
            }

            // Payment verified - now save directly to database
            const admissionData = {
                name: value_a,
                phone: value_b,
                email: value_c || '',
                whatsapp: extraData.whatsapp || '',
                facebook: extraData.facebook || '',
                courseId: extraData.courseId,
                batchId: extraData.batchId,
                amount: extraData.originalAmount || amount, // Store original price
                discountAmount: extraData.discountAmount || 0,
                couponCode: extraData.couponCode || '',
                senderNumber: extraData.senderNumber || '',
                paymentMethod: extraData.paymentMethod || card_type || 'sslcommerz',
                paymentStatus: 'paid',
                status: 'pending',
                transactionId: tran_id,
                sslValidationId: val_id,
                notes: extraData.isTestPayment
                    ? `Test payment: Paid 1 TK (Original price: ${extraData.originalAmount} TK)`
                    : '',
            };

            // Save to database directly
            const admission = await Admission.create(admissionData);

            // Increment coupon usage count if coupon was used
            if (extraData.couponCode) {
                await Coupon.findOneAndUpdate(
                    { code: extraData.couponCode.toUpperCase() },
                    { $inc: { usedCount: 1 } },
                );
            }

            logger.info(
                `Admission created after payment: ${admission._id} | Test: ${extraData.isTestPayment || false}`,
            );

            // Redirect to success page
            const successUrl = new URL(`${config.frontendUrl}/admission-registration/success`);
            successUrl.searchParams.set('name', value_a);
            successUrl.searchParams.set('amount', extraData.originalAmount?.toString() || amount);
            successUrl.searchParams.set('courseId', extraData.courseId);
            successUrl.searchParams.set('phone', value_b);
            successUrl.searchParams.set('email', value_c || '');
            successUrl.searchParams.set('tran_id', tran_id);

            return res.redirect(successUrl.toString());
        } catch (error) {
            logger.error('Payment success processing failed:', error);
            return res.redirect(`${config.frontendUrl}/admission-registration/fail`);
        }
    }),

    // Payment fail callback
    paymentFail: catchAsync(async (req: Request, res: Response) => {
        return res.redirect(`${config.frontendUrl}/admission-registration/fail`);
    }),

    // Payment cancel callback
    paymentCancel: catchAsync(async (req: Request, res: Response) => {
        return res.redirect(`${config.frontendUrl}/admission-registration/cancel`);
    }),

    // IPN (Instant Payment Notification)
    ipn: catchAsync(async (req: Request, res: Response) => {
        const { tran_id, status, val_id } = req.body;

        if (status === 'VALID' || status === 'VALIDATED') {
            // Payment confirmed via IPN - update if not already created
            await Admission.findOneAndUpdate(
                { transactionId: tran_id },
                {
                    paymentStatus: 'paid',
                    sslValidationId: val_id,
                },
                { upsert: true }, // Create if doesn't exist
            );
        }

        res.status(200).send('OK');
    }),
};

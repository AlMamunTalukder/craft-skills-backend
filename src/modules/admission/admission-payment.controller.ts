// server/modules/admission/admission-payment.controller.ts
import type { Request, Response } from 'express';
import SSLCommerzPayment from 'sslcommerz-lts';
import config from 'src/config';
import { Course } from '../course/course.model';
import { CourseBatch } from '../coursebatch/coursebatch.model';
import AppError from 'src/errors/AppError';
import { admissionPaymentService } from './admission-payment.service';
import { Admission } from './admission.model';
import { Coupon } from '../coupon/coupon.model';

const FRONTEND_URL = 'https://craftskillsbd.com';

export const admissionPaymentController = {
    initiatePayment: async (req: Request, res: Response) => {
        try {
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
                const coupon = await Coupon.findOne({
                    code: couponCode.toUpperCase(),
                    isActive: true,
                });
                if (coupon) {
                    const validFrom = new Date(coupon.validFrom as string);
                    const validTo = new Date(coupon.validTo as string);
                    if (
                        now >= validFrom &&
                        now <= validTo &&
                        (!coupon.maxUsage || coupon.usedCount < coupon.maxUsage)
                    ) {
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

            if (finalAmount < 10) finalAmount = 10;
            const tran_id = `ADM_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

            // ✅ Save pending admission - USE INSERTONE TO BYPASS VALIDATION
            try {
                const mongoose = require('mongoose');
                await mongoose.connection.db.collection('admissions').insertOne({
                    name,
                    phone,
                    email: email || '',
                    whatsapp: whatsapp || '',
                    facebook: facebook || '',
                    courseId: new mongoose.Types.ObjectId(courseId),
                    batchId: new mongoose.Types.ObjectId(batchId),
                    amount: finalAmount,
                    discountAmount,
                    couponCode: appliedCoupon || '',
                    senderNumber: senderNumber || '',
                    paymentMethod: paymentMethod || 'sslcommerz',
                    paymentStatus: 'pending',
                    status: 'pending',
                    transactionId: tran_id,
                    registeredAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                console.log('✅ Pending admission saved:', tran_id);
            } catch (saveError: any) {
                console.error('❌ Failed to save pending:', saveError.message);
                // Continue with payment even if save fails
            }

            const sslData = {
                total_amount: finalAmount,
                currency: 'BDT',
                tran_id,
                success_url: `${config.apiUrl}/admissions/payment/success`,
                fail_url: `${config.apiUrl}/admissions/payment/fail`,
                cancel_url: `${config.apiUrl}/admissions/payment/cancel`,
                ipn_url: `${config.apiUrl}/admissions/payment/ipn`,
                value_a: tran_id,
                value_b: phone,
                value_c: email || '',
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
            const apiResponse = await sslcz.init(sslData);

            if (!apiResponse?.GatewayPageURL)
                throw new AppError(500, 'Gateway initialization failed');

            console.log('✅ Payment URL generated');
            res.status(200).json({
                success: true,
                message: 'Payment initiated',
                data: { paymentUrl: apiResponse.GatewayPageURL, tran_id, amount: finalAmount },
            });
        } catch (error: any) {
            console.error('❌ Init error:', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    paymentSuccess: async (req: Request, res: Response) => {
        console.log('🎉 PAYMENT SUCCESS');

        try {
            const { tran_id, val_id, amount, card_type } = req.body;
            const lookupTranId = req.body.value_a || tran_id;

            console.log('📋 Looking up:', lookupTranId);

            // ✅ Find using collection (bypasses model validation)
            const mongoose = require('mongoose');
            const collection = mongoose.connection.db.collection('admissions');

            const existingAdmission = await collection.findOne({ transactionId: lookupTranId });

            if (!existingAdmission) {
                console.error('❌ No pending admission found for:', lookupTranId);

                // Try to create a basic record anyway
                try {
                    await collection.insertOne({
                        name: req.body.value_b ? 'Unknown' : 'Unknown',
                        phone: req.body.value_b || '',
                        email: req.body.value_c || '',
                        transactionId: lookupTranId,
                        sslValidationId: val_id,
                        amount: parseFloat(amount) || 0,
                        paymentMethod: card_type || 'sslcommerz',
                        paymentStatus: 'paid',
                        status: 'pending',
                        registeredAt: new Date(),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                    console.log('✅ Created basic record');
                } catch (e: any) {
                    console.error('❌ Could not create:', e.message);
                }

                return res.redirect(`${FRONTEND_URL}/admission-registration/fail`);
            }

            console.log('✅ Found admission:', existingAdmission._id);

            // ✅ Update payment status
            await collection.updateOne(
                { transactionId: lookupTranId },
                {
                    $set: {
                        paymentStatus: 'paid',
                        sslValidationId: val_id,
                        paymentMethod: card_type || existingAdmission.paymentMethod,
                        updatedAt: new Date(),
                    },
                },
            );

            console.log('✅ Updated to paid');

            // Update coupon
            if (existingAdmission.couponCode) {
                await Coupon.findOneAndUpdate(
                    { code: existingAdmission.couponCode.toUpperCase() },
                    { $inc: { usedCount: 1 } },
                );
            }

            // Google Sheets
            try {
                const { appendDataToGoogleSheet } = await import('@/utils/googleSheets');
                const { sanitizePhoneNumber } = await import('@/utils/phoneSanitizer');

                const batch = existingAdmission.batchId
                    ? await CourseBatch.findById(existingAdmission.batchId)
                    : null;
                const course = existingAdmission.courseId
                    ? await Course.findById(existingAdmission.courseId)
                    : null;

                await appendDataToGoogleSheet(
                    `${batch?.name || 'Admission'} - admission`,
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
                        existingAdmission.name || '',
                        sanitizePhoneNumber(existingAdmission.phone) || '',
                        sanitizePhoneNumber(existingAdmission.whatsapp) || '',
                        existingAdmission.email || '',
                        existingAdmission.facebook || '',
                        course?.name || '',
                        batch?.name || '',
                        existingAdmission.couponCode || '',
                        String(existingAdmission.amount || amount),
                        card_type || existingAdmission.paymentMethod || 'sslcommerz',
                        existingAdmission.senderNumber || '',
                        'paid',
                        lookupTranId,
                        new Date().toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' }),
                    ],
                );
                console.log('✅ Sheet updated');
            } catch (sheetError: any) {
                console.error('❌ Sheet error:', sheetError.message);
            }

            // Success!
            const params = new URLSearchParams({
                name: existingAdmission.name || '',
                amount: String(existingAdmission.amount || amount),
                paid: String(amount),
                courseId: existingAdmission.courseId?.toString() || '',
                phone: existingAdmission.phone || '',
                email: existingAdmission.email || '',
                tran_id: lookupTranId,
            });

            console.log('🔗 SUCCESS');
            return res.redirect(
                `${FRONTEND_URL}/admission-registration/success?${params.toString()}`,
            );
        } catch (error: any) {
            console.error('❌ ERROR:', error.message);
            return res.redirect(`${FRONTEND_URL}/admission-registration/fail`);
        }
    },

    paymentFail: async (req: Request, res: Response) => {
        return res.redirect(`${FRONTEND_URL}/admission-registration/fail`);
    },

    paymentCancel: async (req: Request, res: Response) => {
        return res.redirect(`${FRONTEND_URL}/admission-registration/cancel`);
    },

    ipn: async (req: Request, res: Response) => {
        console.log('📨 IPN received');
        const { tran_id, status, val_id } = req.body;

        if ((status === 'VALID' || status === 'VALIDATED') && tran_id) {
            try {
                await admissionPaymentService.saveAdmission({
                    transactionId: tran_id,
                    sslValidationId: val_id,
                    paymentStatus: 'paid',
                    status: 'pending',
                    name: 'Pending (IPN)',
                    registeredAt: new Date(),
                });
                console.log('✅ IPN processed:', tran_id);
            } catch (e: any) {
                console.error('❌ IPN error:', e.message);
            }
        }
        res.status(200).send('OK');
    },
};

// server/modules/admission/admission-payment.controller.ts
import type { Request, Response } from 'express';
import SSLCommerzPayment from 'sslcommerz-lts';
import config from 'src/config';
import { Course } from '../course/course.model';
import { CourseBatch } from '../coursebatch/coursebatch.model';
import AppError from 'src/errors/AppError';
import { admissionPaymentService } from './admission-payment.service';

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

            // Use service to calculate price
            const { finalAmount, discountAmount, appliedCoupon } =
                await admissionPaymentService.calculatePrice(courseId, couponCode);

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
            const apiResponse = await sslcz.init(sslData);

            if (!apiResponse?.GatewayPageURL) {
                throw new AppError(500, 'Gateway initialization failed');
            }

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
        console.log('📦 Body:', JSON.stringify(req.body));

        try {
            const { tran_id, val_id, amount, card_type } = req.body;
            const value_a = req.body.value_a || '';
            const value_b = req.body.value_b || '';
            const value_c = req.body.value_c || '';
            const value_d = req.body.value_d || '{}';

            // Parse value_d using service
            const extraData = admissionPaymentService.parseValueD(value_d, { amount });

            // Build admission data
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

            console.log('💾 Saving:', admissionData.name, admissionData.phone);

            // Save to database
            await admissionPaymentService.saveAdmission(admissionData);

            // Update coupon
            await admissionPaymentService.updateCouponUsage(extraData.couponCode);

            // Save to Google Sheets
            await admissionPaymentService.saveToGoogleSheet({
                ...admissionData,
                batchName: extraData.batchName,
                courseName: extraData.courseName,
                phone: value_b,
                email: value_c,
                facebook: extraData.facebook,
            });

            // Build success URL
            const successUrl = admissionPaymentService.buildSuccessUrl({
                name: value_a,
                amount: extraData.originalAmount || amount,
                paid: amount,
                courseId: extraData.courseId,
                phone: value_b,
                email: value_c,
                tran_id: tran_id,
            });

            console.log('🔗 Redirecting to SUCCESS');
            return res.redirect(successUrl);
        } catch (error: any) {
            console.error('❌ ERROR:', error.message);

            // Fallback: save basic data
            try {
                if (req.body.tran_id) {
                    await admissionPaymentService.saveAdmission({
                        name: req.body.value_a || 'Unknown',
                        phone: req.body.value_b || '',
                        email: req.body.value_c || '',
                        transactionId: req.body.tran_id,
                        sslValidationId: req.body.val_id,
                        amount: Number(req.body.amount) || 0,
                        paymentStatus: 'paid',
                        status: 'pending',
                        registeredAt: new Date(),
                    });
                }
                return res.redirect(
                    `${FRONTEND_URL}/admission-registration/success?tran_id=${req.body.tran_id || ''}`,
                );
            } catch (e: any) {
                return res.redirect(`${FRONTEND_URL}/admission-registration/fail`);
            }
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

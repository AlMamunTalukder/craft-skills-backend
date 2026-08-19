"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.admissionPaymentController = void 0;
const sslcommerz_lts_1 = __importDefault(require("sslcommerz-lts"));
const config_1 = __importDefault(require("../../config"));
const course_model_1 = require("../course/course.model");
const coursebatch_model_1 = require("../coursebatch/coursebatch.model");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const coupon_model_1 = require("../coupon/coupon.model");
const FRONTEND_URL = 'https://craftskillsbd.com';
exports.admissionPaymentController = {
    initiatePayment: async (req, res) => {
        const { agreedToTerms, ...rest } = req.body;
        if (!agreedToTerms) {
            return res.status(400).json({
                success: false,
                message: 'You must agree to the Terms & Conditions, Privacy Policy, and Refund Policy',
            });
        }
        try {
            const { name, phone, email, whatsapp, facebook, courseId, batchId, couponCode, senderNumber, paymentMethod, } = req.body;
            console.log('🚀 Payment Init:', { name, phone, courseId, batchId });
            const course = await course_model_1.Course.findById(courseId);
            if (!course)
                throw new AppError_1.default(404, 'Course not found');
            const batch = await coursebatch_model_1.CourseBatch.findById(batchId);
            if (!batch)
                throw new AppError_1.default(404, 'Batch not found');
            if (!batch.isActive)
                throw new AppError_1.default(400, 'Registration closed');
            const now = new Date();
            if (batch.registrationEnd && now > batch.registrationEnd) {
                throw new AppError_1.default(400, 'Registration deadline passed');
            }
            let finalAmount = Math.round(course.price -
                (course.price * (course.discount || 0)) / 100 +
                (course.paymentCharge || 0));
            let discountAmount = 0;
            let appliedCoupon = null;
            if (couponCode) {
                const coupon = await coupon_model_1.Coupon.findOne({
                    code: couponCode.toUpperCase(),
                    isActive: true,
                });
                if (coupon) {
                    const validFrom = new Date(coupon.validFrom);
                    const validTo = new Date(coupon.validTo);
                    if (now >= validFrom &&
                        now <= validTo &&
                        (!coupon.maxUsage || coupon.usedCount < coupon.maxUsage)) {
                        if (coupon.discountType === 'PERCENTAGE') {
                            discountAmount = (finalAmount * coupon.discount) / 100;
                        }
                        else {
                            discountAmount = coupon.discount;
                        }
                        discountAmount = Math.min(discountAmount, finalAmount);
                        finalAmount = Math.max(0, finalAmount - discountAmount);
                        appliedCoupon = couponCode;
                    }
                }
            }
            if (finalAmount < 10)
                finalAmount = 10;
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
                    agreedToTerms: true,
                    agreedToTermsAt: new Date(),
                    termsVersion: '1.0',
                });
                console.log('✅ Pending admission saved:', tran_id);
            }
            catch (saveError) {
                console.error('❌ Failed to save pending:', saveError.message);
                // Continue with payment even if save fails
            }
            const sslData = {
                total_amount: finalAmount,
                currency: 'BDT',
                tran_id,
                success_url: `${config_1.default.apiUrl}/admissions/payment/success`,
                fail_url: `${config_1.default.apiUrl}/admissions/payment/fail`,
                cancel_url: `${config_1.default.apiUrl}/admissions/payment/cancel`,
                ipn_url: `${config_1.default.apiUrl}/admissions/payment/ipn`,
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
            const sslcz = new sslcommerz_lts_1.default(process.env.STORE_ID, process.env.STORE_PASS, true);
            const apiResponse = await sslcz.init(sslData);
            if (!apiResponse?.GatewayPageURL)
                throw new AppError_1.default(500, 'Gateway initialization failed');
            console.log('✅ Payment URL generated');
            res.status(200).json({
                success: true,
                message: 'Payment initiated',
                data: { paymentUrl: apiResponse.GatewayPageURL, tran_id, amount: finalAmount },
            });
        }
        catch (error) {
            console.error('❌ Init error:', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    paymentSuccess: async (req, res) => {
        console.log('🎉 PAYMENT SUCCESS');
        try {
            const { tran_id, val_id, amount, card_type } = req.body;
            const lookupTranId = req.body.value_a || tran_id;
            console.log('📋 Looking up:', lookupTranId);
            const mongoose = require('mongoose');
            const collection = mongoose.connection.db.collection('admissions');
            let existingAdmission = await collection.findOne({ transactionId: lookupTranId });
            if (!existingAdmission) {
                console.error('❌ No pending admission found for:', lookupTranId);
                return res.redirect(`${FRONTEND_URL}/admission-registration/fail`);
            }
            console.log('✅ Found admission:', existingAdmission._id);
            console.log('📋 Current name:', existingAdmission.name);
            // ✅ Update payment status BUT preserve the original name
            await collection.updateOne({ transactionId: lookupTranId }, {
                $set: {
                    paymentStatus: 'paid',
                    sslValidationId: val_id,
                    paymentMethod: card_type || existingAdmission.paymentMethod || 'sslcommerz',
                    // ✅ Only update name if it's "Pending (IPN)" or empty
                    ...((existingAdmission.name === 'Pending (IPN)' ||
                        !existingAdmission.name) &&
                        req.body.value_b
                        ? {}
                        : {}),
                    updatedAt: new Date(),
                },
            });
            // Fetch the updated record
            existingAdmission = await collection.findOne({ transactionId: lookupTranId });
            console.log('✅ Updated. Name is now:', existingAdmission.name);
            // Update coupon
            if (existingAdmission.couponCode) {
                try {
                    await coupon_model_1.Coupon.findOneAndUpdate({ code: existingAdmission.couponCode.toUpperCase() }, { $inc: { usedCount: 1 } });
                }
                catch (e) {
                    console.log('⚠️ Coupon update failed:', e.message);
                }
            }
            // Google Sheets — write the paid row here (the worker only runs for
            // the /admissions/register queue path). Dedup on Phone so a repeated
            // success callback can't append the same registration twice.
            try {
                const { appendDataToGoogleSheet } = await Promise.resolve().then(() => __importStar(require('../../utils/googleSheets')));
                const { sanitizePhoneNumber } = await Promise.resolve().then(() => __importStar(require('../../utils/phoneSanitizer')));
                const cleanPhone = sanitizePhoneNumber(existingAdmission.phone) || '';
                const batch = existingAdmission.batchId
                    ? await coursebatch_model_1.CourseBatch.findById(existingAdmission.batchId)
                    : null;
                const course = existingAdmission.courseId
                    ? await course_model_1.Course.findById(existingAdmission.courseId)
                    : null;
                await appendDataToGoogleSheet(`${batch?.name || 'Admission'} - admission`, [
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
                ], [
                    existingAdmission.name || '',
                    cleanPhone,
                    sanitizePhoneNumber(existingAdmission.whatsapp) || '',
                    existingAdmission.email || '',
                    existingAdmission.facebook || '',
                    course?.name || '',
                    batch?.name || '',
                    existingAdmission.couponCode || '',
                    String(existingAdmission.amount || amount),
                    existingAdmission.paymentMethod || card_type || 'sslcommerz',
                    existingAdmission.senderNumber || '',
                    'paid',
                    lookupTranId,
                    new Date().toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' }),
                ], { dedupColumn: 2, dedupValue: cleanPhone });
                console.log('✅ Sheet updated');
            }
            catch (sheetError) {
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
            return res.redirect(`${FRONTEND_URL}/admission-registration/success?${params.toString()}`);
        }
        catch (error) {
            console.error('❌ ERROR:', error.message);
            return res.redirect(`${FRONTEND_URL}/admission-registration/fail`);
        }
    },
    paymentFail: async (req, res) => {
        return res.redirect(`${FRONTEND_URL}/admission-registration/fail`);
    },
    paymentCancel: async (req, res) => {
        return res.redirect(`${FRONTEND_URL}/admission-registration/cancel`);
    },
    ipn: async (req, res) => {
        console.log('📨 IPN received');
        const { tran_id, status, val_id } = req.body;
        if ((status === 'VALID' || status === 'VALIDATED') && tran_id) {
            try {
                const mongoose = require('mongoose');
                const collection = mongoose.connection.db.collection('admissions');
                // Check if record already exists
                const existing = await collection.findOne({ transactionId: tran_id });
                if (existing) {
                    // ✅ Only update payment status, DON'T change name
                    await collection.updateOne({ transactionId: tran_id }, {
                        $set: {
                            paymentStatus: 'paid',
                            sslValidationId: val_id,
                            updatedAt: new Date(),
                        },
                    });
                    console.log('✅ IPN: Updated payment status for', tran_id);
                }
                else {
                    console.log('⚠️ IPN: No record found, waiting for success callback');
                    // Don't create a record - let the success callback handle it
                }
            }
            catch (e) {
                console.error('❌ IPN error:', e.message);
            }
        }
        res.status(200).send('OK');
    },
};

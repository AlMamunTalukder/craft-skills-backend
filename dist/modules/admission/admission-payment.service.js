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
Object.defineProperty(exports, "__esModule", { value: true });
exports.admissionPaymentService = void 0;
// server/modules/admission/admission-payment.service.ts
const admission_model_1 = require("./admission.model");
const coupon_model_1 = require("../coupon/coupon.model");
const course_model_1 = require("../course/course.model");
const coursebatch_model_1 = require("../coursebatch/coursebatch.model");
const FRONTEND_URL = 'https://craftskillsbd.com';
exports.admissionPaymentService = {
    // Save admission data (handles duplicates)
    saveAdmission: async (data) => {
        try {
            const existing = await admission_model_1.Admission.findOne({ transactionId: data.transactionId });
            if (existing) {
                console.log('⚠️ Record exists, updating...');
                const updated = await admission_model_1.Admission.findOneAndUpdate({ transactionId: data.transactionId }, { $set: data }, { new: true });
                console.log('✅ Updated:', updated?._id);
                return updated;
            }
            const admission = await admission_model_1.Admission.create(data);
            console.log('✅ Created:', admission._id);
            return admission;
        }
        catch (error) {
            console.error('❌ Save error:', error.message);
            throw error;
        }
    },
    // Calculate price with coupon
    calculatePrice: async (courseId, couponCode) => {
        const course = await course_model_1.Course.findById(courseId);
        if (!course)
            throw new Error('Course not found');
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
                const now = new Date();
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
        return { finalAmount, discountAmount, appliedCoupon };
    },
    // Update coupon usage
    updateCouponUsage: async (couponCode) => {
        if (couponCode) {
            await coupon_model_1.Coupon.findOneAndUpdate({ code: couponCode.toUpperCase() }, { $inc: { usedCount: 1 } });
        }
    },
    // Save to Google Sheets
    saveToGoogleSheet: async (data) => {
        try {
            const { appendDataToGoogleSheet } = await Promise.resolve().then(() => __importStar(require('../../utils/googleSheets')));
            const { sanitizePhoneNumber } = await Promise.resolve().then(() => __importStar(require('../../utils/phoneSanitizer')));
            const batch = data.batchId ? await coursebatch_model_1.CourseBatch.findById(data.batchId) : null;
            const course = data.courseId ? await course_model_1.Course.findById(data.courseId) : null;
            const cleanPhone = sanitizePhoneNumber(data.phone) || data.phone;
            const cleanWhatsapp = sanitizePhoneNumber(data.whatsapp) || '';
            const registrationDate = new Date().toLocaleString('en-BD', {
                timeZone: 'Asia/Dhaka',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            });
            await appendDataToGoogleSheet(`${batch?.name || data.batchName || 'Admission'} - admission`, [
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
                data.name || '',
                cleanPhone,
                cleanWhatsapp,
                data.email || '',
                data.facebook || '',
                course?.name || data.courseName || '',
                batch?.name || data.batchName || '',
                data.couponCode || '',
                String(data.amount || 0),
                data.paymentMethod || 'sslcommerz',
                data.senderNumber || data.phone || '',
                'paid',
                data.transactionId || '',
                registrationDate,
            ]);
            console.log('✅ Google Sheet updated');
        }
        catch (error) {
            console.error('❌ Sheet error:', error.message);
        }
    },
    // Parse value_d from SSLCommerz
    parseValueD: (value_d, fallback = {}) => {
        try {
            if (value_d && value_d !== '{}') {
                return JSON.parse(value_d);
            }
        }
        catch (e) {
            console.log('⚠️ JSON parse failed, manual extraction');
            const getVal = (key) => {
                const match = value_d.match(new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`));
                return match ? match[1] : '';
            };
            return {
                courseId: getVal('courseId') || fallback.courseId,
                batchId: getVal('batchId') || fallback.batchId,
                batchName: getVal('batchName') || fallback.batchName,
                courseName: getVal('courseName') || fallback.courseName,
                originalAmount: Number(getVal('originalAmount')) || fallback.amount || 0,
                discountAmount: Number(getVal('discountAmount')) || 0,
                couponCode: getVal('couponCode'),
                whatsapp: getVal('whatsapp'),
                facebook: getVal('facebook'),
                senderNumber: getVal('senderNumber') || fallback.phone || '',
                paymentMethod: getVal('paymentMethod') || 'sslcommerz',
            };
        }
        return fallback;
    },
    // Build success redirect URL
    buildSuccessUrl: (data) => {
        const params = new URLSearchParams({
            name: data.name || '',
            amount: String(data.amount || 0),
            paid: String(data.paid || data.amount || 0),
            courseId: data.courseId || '',
            phone: data.phone || '',
            email: data.email || '',
            tran_id: data.tran_id || '',
        });
        return `${FRONTEND_URL}/admission-registration/success?${params.toString()}`;
    },
};

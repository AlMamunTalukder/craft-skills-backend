// server/modules/admission/admission-payment.service.ts
import { Admission } from './admission.model';
import { Coupon } from '../coupon/coupon.model';
import { Course } from '../course/course.model';
import { CourseBatch } from '../coursebatch/coursebatch.model';

const FRONTEND_URL = 'https://craftskillsbd.com';

export const admissionPaymentService = {
    // Save admission data (handles duplicates)
    saveAdmission: async (data: any) => {
        try {
            const existing = await Admission.findOne({ transactionId: data.transactionId });

            if (existing) {
                console.log('⚠️ Record exists, updating...');
                const updated = await Admission.findOneAndUpdate(
                    { transactionId: data.transactionId },
                    { $set: data },
                    { new: true },
                );
                console.log('✅ Updated:', updated?._id);
                return updated;
            }

            const admission = await Admission.create(data);
            console.log('✅ Created:', admission._id);
            return admission;
        } catch (error: any) {
            console.error('❌ Save error:', error.message);
            throw error;
        }
    },

    // Calculate price with coupon
    calculatePrice: async (courseId: string, couponCode?: string) => {
        const course = await Course.findById(courseId);
        if (!course) throw new Error('Course not found');

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
                const now = new Date();
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

        return { finalAmount, discountAmount, appliedCoupon };
    },

    // Update coupon usage
    updateCouponUsage: async (couponCode: string) => {
        if (couponCode) {
            await Coupon.findOneAndUpdate(
                { code: couponCode.toUpperCase() },
                { $inc: { usedCount: 1 } },
            );
        }
    },

    // Save to Google Sheets
    saveToGoogleSheet: async (data: any) => {
        try {
            const { appendDataToGoogleSheet } = await import('@/utils/googleSheets');
            const { sanitizePhoneNumber } = await import('@/utils/phoneSanitizer');

            const batch = data.batchId ? await CourseBatch.findById(data.batchId) : null;
            const course = data.courseId ? await Course.findById(data.courseId) : null;

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

            await appendDataToGoogleSheet(
                `${batch?.name || data.batchName || 'Admission'} - admission`,
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
                ],
            );
            console.log('✅ Google Sheet updated');
        } catch (error: any) {
            console.error('❌ Sheet error:', error.message);
        }
    },

    // Parse value_d from SSLCommerz
    parseValueD: (value_d: string, fallback: any = {}) => {
        try {
            if (value_d && value_d !== '{}') {
                return JSON.parse(value_d);
            }
        } catch (e: any) {
            console.log('⚠️ JSON parse failed, manual extraction');
            const getVal = (key: string): string => {
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
    buildSuccessUrl: (data: any) => {
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

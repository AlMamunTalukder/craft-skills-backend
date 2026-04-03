import { Worker } from 'bullmq';
import mongoose from 'mongoose';

import { appendDataToGoogleSheet } from '@/utils/googleSheets';
import logger from '@/shared/logger';
import { Admission } from 'src/modules/admission/admission.model';
import { Course } from 'src/modules/course/course.model';
import { CourseBatch } from 'src/modules/coursebatch/coursebatch.model';
import { redisConnection } from 'src/queues/connection';
import { sanitizePhoneNumber } from 'src/utils/phoneSanitizer';

new Worker(
    'admission-queue',
    async (job) => {
        const { admissionData } = job.data;

        // --- CLEAN NUMBERS ---
        const cleanPhone = sanitizePhoneNumber(admissionData.phone) || admissionData.phone;
        const cleanWhatsapp = sanitizePhoneNumber(admissionData.whatsapp) || admissionData.whatsapp;
        const cleanSenderNumber =
            sanitizePhoneNumber(admissionData.senderNumber) || admissionData.senderNumber;

        logger.info(`Processing admission for: ${admissionData.name}`);

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Create admission record with CLEANED data
            const [admission] = await Admission.create(
                [
                    {
                        ...admissionData,
                        phone: cleanPhone,
                        whatsapp: cleanWhatsapp,
                        senderNumber: cleanSenderNumber,
                    },
                ],
                { session },
            );

            // 2. Fetch course and batch details
            const course = await Course.findById(admissionData.courseId).session(session);
            const batch = await CourseBatch.findById(admissionData.batchId).session(session);

            if (!course) throw new Error(`Course not found`);
            if (!batch) throw new Error(`Batch not found`);

            await session.commitTransaction();
            session.endSession();

            // 3. Send to Google Sheet (English Pure Numbers)
            const registrationDate = new Date().toLocaleString('en-BD', {
                timeZone: 'Asia/Dhaka',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            });

            const sheetTitle = `${batch.name} - admission`;

            await appendDataToGoogleSheet(
                sheetTitle,
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
                    'Registered At',
                ],
                [
                    admission.name || '',
                    cleanPhone, // Pure English
                    cleanWhatsapp, // Pure English
                    admission.email || '',
                    admission.facebook || '',
                    course.name || '',
                    batch.name || '',
                    admission.couponCode || '',
                    (admission.amount || course.price).toString(),
                    admission.paymentMethod || '',
                    cleanSenderNumber, // Pure English
                    registrationDate,
                ],
            );

            return admission;
        } catch (error: any) {
            await session.abortTransaction();
            session.endSession();
            logger.error(`Error in admission worker: ${error.message}`, { error });
            throw error;
        }
    },
    {
        connection: redisConnection,
        concurrency: 5,
    },
);

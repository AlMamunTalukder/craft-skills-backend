// src/workers/admission.worker.ts
import { Worker } from 'bullmq';
import mongoose from 'mongoose';

import { appendDataToGoogleSheet } from '@/utils/googleSheets';
import logger from '@/shared/logger';
import { Admission } from 'src/modules/admission/admission.model';
import { Course } from 'src/modules/course/course.model';
import { CourseBatch } from 'src/modules/coursebatch/coursebatch.model';
import { redisConnection } from 'src/queues/connection';

new Worker(
    'admission-queue',
    async (job) => {
        const { admissionData } = job.data;
        logger.info(`Processing admission for: ${admissionData.name}`);

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Create admission record
            const [admission] = await Admission.create([admissionData], { session });

            // 2. Fetch course and batch details
            const course = await Course.findById(admissionData.courseId).session(session);
            const batch = await CourseBatch.findById(admissionData.batchId).session(session);

            if (!course) throw new Error(`Course not found`);
            if (!batch) throw new Error(`Batch not found`);

            // 3. Commit DB transaction
            await session.commitTransaction();
            session.endSession();

            logger.info(`Admission saved for ${admission.name}`);

            // 4. Send to Google Sheet
            const registrationDate = new Date().toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            });

            // Use batch name as sheet name
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
                    admission.phone || '',
                    admission.whatsapp || '',
                    admission.email || '',
                    admission.facebook || '',
                    course.name || '',
                    batch.name || '',
                    admission.couponCode || '',
                    (admission.amount || course.price).toString(),
                    admission.paymentMethod || '',
                    admission.senderNumber || '',
                    registrationDate,
                ],
            );

            logger.info(`Data sent to Google Sheet: ${sheetTitle}`);

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

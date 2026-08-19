import { Worker } from 'bullmq';
import mongoose from 'mongoose';

import { appendDataToGoogleSheet } from '@/utils/googleSheets';
import logger from '@/shared/logger';
import { Admission } from 'src/modules/admission/admission.model';
import { Course } from 'src/modules/course/course.model';
import { CourseBatch } from 'src/modules/coursebatch/coursebatch.model';
import { redisConnection } from 'src/queues/connection';
import { sanitizePhoneNumber } from 'src/utils/phoneSanitizer';

// BullMQ retries after failures; the dedup window ensures a retried job
// reuses the record it already created instead of inserting a duplicate.
const DEDUP_WINDOW_MS = 10 * 60 * 1000;

new Worker(
    'admission-queue',
    async (job) => {
        const { admissionData } = job.data;

        const cleanPhone = sanitizePhoneNumber(admissionData.phone) || admissionData.phone;
        const cleanWhatsapp = sanitizePhoneNumber(admissionData.whatsapp) || admissionData.whatsapp;
        const cleanSenderNumber =
            sanitizePhoneNumber(admissionData.senderNumber) || admissionData.senderNumber;

        logger.info(`Processing admission for: ${admissionData.name}`);

        const session = await mongoose.startSession();
        session.startTransaction();

        let admission: any;

        try {
            const existing = await Admission.findOne({
                phone: cleanPhone,
                courseId: admissionData.courseId,
                batchId: admissionData.batchId,
                registeredAt: { $gte: new Date(Date.now() - DEDUP_WINDOW_MS) },
            }).session(session);

            if (existing) {
                if (existing.sheetSynced) {
                    await session.commitTransaction();
                    session.endSession();
                    logger.info(`Admission ${existing._id} already synced, skipping`);
                    return existing;
                }
                logger.info(`Reusing admission ${existing._id} (sheet write failed before)`);
                admission = existing;
            } else {
                const [created] = await Admission.create(
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
                admission = created;
            }

            const course = await Course.findById(admissionData.courseId).session(session);
            const batch = await CourseBatch.findById(admissionData.batchId).session(session);

            if (!course) throw new Error(`Course not found`);
            if (!batch) throw new Error(`Batch not found`);

            await session.commitTransaction();
            session.endSession();

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
                    'Payment Status',
                    'Transaction ID',
                    'Registered At',
                ],
                [
                    admission.name || '',
                    cleanPhone,
                    cleanWhatsapp,
                    admission.email || '',
                    admission.facebook || '',
                    course.name || '',
                    batch.name || '',
                    admission.couponCode || '',
                    (admission.amount || course.price).toString(),
                    admission.paymentMethod || '',
                    cleanSenderNumber,
                    admission.paymentStatus || 'paid',
                    admission.transactionId || '',
                    registrationDate,
                ],
                // Dedup on Phone column: a retried job re-appends the same row instead
                // of creating a second one.
                { dedupColumn: 2, dedupValue: cleanPhone },
            );

            // Mark synced only AFTER a successful append. If the mark itself fails,
            // the job still completes — a retry would find the record and the dedup
            // check would skip the duplicate row.
            try {
                await Admission.updateOne(
                    { _id: admission._id },
                    { $set: { sheetSynced: true } },
                );
            } catch (markError: any) {
                logger.warn(`Failed to mark sheetSynced: ${markError.message}`);
            }

            return admission;
        } catch (error: any) {
            await session.abortTransaction();
            session.endSession();

            logger.error({ error }, `Error in admission worker: ${error.message}`);

            throw error;
        }
    },
    {
        connection: redisConnection,
        concurrency: 5,
    },
);

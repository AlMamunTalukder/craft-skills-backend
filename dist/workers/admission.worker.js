"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const mongoose_1 = __importDefault(require("mongoose"));
const googleSheets_1 = require("../utils/googleSheets");
const logger_1 = __importDefault(require("../shared/logger"));
const admission_model_1 = require("../modules/admission/admission.model");
const course_model_1 = require("../modules/course/course.model");
const coursebatch_model_1 = require("../modules/coursebatch/coursebatch.model");
const connection_1 = require("../queues/connection");
const phoneSanitizer_1 = require("../utils/phoneSanitizer");
// BullMQ retries after failures; the dedup window ensures a retried job
// reuses the record it already created instead of inserting a duplicate.
const DEDUP_WINDOW_MS = 10 * 60 * 1000;
new bullmq_1.Worker('admission-queue', async (job) => {
    const { admissionData } = job.data;
    const cleanPhone = (0, phoneSanitizer_1.sanitizePhoneNumber)(admissionData.phone) || admissionData.phone;
    const cleanWhatsapp = (0, phoneSanitizer_1.sanitizePhoneNumber)(admissionData.whatsapp) || admissionData.whatsapp;
    const cleanSenderNumber = (0, phoneSanitizer_1.sanitizePhoneNumber)(admissionData.senderNumber) || admissionData.senderNumber;
    logger_1.default.info(`Processing admission for: ${admissionData.name}`);
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    let admission;
    try {
        const existing = await admission_model_1.Admission.findOne({
            phone: cleanPhone,
            courseId: admissionData.courseId,
            batchId: admissionData.batchId,
            registeredAt: { $gte: new Date(Date.now() - DEDUP_WINDOW_MS) },
        }).session(session);
        if (existing) {
            if (existing.sheetSynced) {
                await session.commitTransaction();
                session.endSession();
                logger_1.default.info(`Admission ${existing._id} already synced, skipping`);
                return existing;
            }
            logger_1.default.info(`Reusing admission ${existing._id} (sheet write failed before)`);
            admission = existing;
        }
        else {
            const [created] = await admission_model_1.Admission.create([
                {
                    ...admissionData,
                    phone: cleanPhone,
                    whatsapp: cleanWhatsapp,
                    senderNumber: cleanSenderNumber,
                },
            ], { session });
            admission = created;
        }
        const course = await course_model_1.Course.findById(admissionData.courseId).session(session);
        const batch = await coursebatch_model_1.CourseBatch.findById(admissionData.batchId).session(session);
        if (!course)
            throw new Error(`Course not found`);
        if (!batch)
            throw new Error(`Batch not found`);
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
        await (0, googleSheets_1.appendDataToGoogleSheet)(sheetTitle, [
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
        { dedupColumn: 2, dedupValue: cleanPhone });
        // Mark synced only AFTER a successful append. If the mark itself fails,
        // the job still completes — a retry would find the record and the dedup
        // check would skip the duplicate row.
        try {
            await admission_model_1.Admission.updateOne({ _id: admission._id }, { $set: { sheetSynced: true } });
        }
        catch (markError) {
            logger_1.default.warn(`Failed to mark sheetSynced: ${markError.message}`);
        }
        return admission;
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        logger_1.default.error({ error }, `Error in admission worker: ${error.message}`);
        throw error;
    }
}, {
    connection: connection_1.redisConnection,
    concurrency: 5,
});

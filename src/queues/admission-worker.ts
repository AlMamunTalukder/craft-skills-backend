// import { Worker } from 'bullmq';
// import mongoose from 'mongoose';
// import { redisConnection } from '../queues/connection';
// import { Admission } from '../modules/admission/admission.model';
// import { Course } from '../modules/course/course.model';
// import { appendDataToGoogleSheet } from 'src/utils/googleSheets';
// import logger from 'src/shared/logger';

// new Worker(
//     'admission-queue',
//     async (job) => {
//         const { admissionData } = job.data;
//         logger.info(
//             `Processing admission for: ${admissionData.name} (${admissionData.email || admissionData.phone})`,
//         );

//         const session = await mongoose.startSession();
//         session.startTransaction();

//         try {
//             // 1. Create admission record
//             const [admission] = await Admission.create([admissionData], { session });

//             // 2. Fetch course and batch details for sheet title
//             const course = await Course.findById(admissionData.courseId).session(session);
//             const batch = await Batch.findById(admissionData.batchId).session(session);

//             if (!course) {
//                 throw new Error(`Course with ID ${admissionData.courseId} not found`);
//             }
//             if (!batch) {
//                 throw new Error(`Batch with ID ${admissionData.batchId} not found`);
//             }

//             // 3. Update batch participants count (optional)
//             await Batch.findByIdAndUpdate(
//                 admissionData.batchId,
//                 { $inc: { participantCount: 1 } },
//                 { session },
//             );

//             // 4. Commit DB transaction first
//             await session.commitTransaction();
//             session.endSession();

//             logger.info(`Admission ${admission._id} saved to DB for course ${course.title}`);

//             // 5. Append to Google Sheet (OUTSIDE transaction)
//             const registrationDate = new Date().toLocaleString('en-US', {
//                 year: 'numeric',
//                 month: 'long',
//                 day: 'numeric',
//                 hour: '2-digit',
//                 minute: '2-digit',
//                 hour12: true,
//             });

//             const sheetTitle = `${course.slug || course.title}-Admissions`;

//             await appendDataToGoogleSheet(
//                 sheetTitle,
//                 [
//                     'Name',
//                     'Phone',
//                     'WhatsApp',
//                     'Email',
//                     'Occupation',
//                     'Address',
//                     'Course',
//                     'Batch',
//                     'Payment Method',
//                     'Amount',
//                     'Discount',
//                     'Coupon Code',
//                     'Status',
//                     'Payment Status',
//                     'Notes',
//                     'Registered At',
//                 ],
//                 [
//                     admission.name || '',
//                     admission.phone || '',
//                     admission.whatsapp || '',
//                     admission.email || '',
//                     admission.occupation || '',
//                     admission.address || '',
//                     course.title || '',
//                     batch.name || '',
//                     admission.paymentMethod || '',
//                     admission.amount?.toString() || '0',
//                     admission.discountAmount?.toString() || '0',
//                     admission.couponCode || '',
//                     admission.status || 'pending',
//                     admission.paymentStatus || 'pending',
//                     admission.notes || '',
//                     registrationDate,
//                 ],
//             );

//             logger.info(`Admission data successfully appended to Google Sheet: ${sheetTitle}`);

//             return admission;
//         } catch (error: any) {
//             await session.abortTransaction();
//             session.endSession();
//             logger.error(`Error processing admission job ${job.id}: ${error.message}`, { error });
//             throw error;
//         }
//     },
//     {
//         connection: redisConnection,
//     },
// );

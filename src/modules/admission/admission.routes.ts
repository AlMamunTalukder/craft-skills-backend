// admission.routes.ts
import { Router } from 'express';
import { admissionController } from './admission.controller';
import { admissionPaymentController } from './admission-payment.controller';
import { createAdmissionDto, updateAdmissionDto } from './admission.dto';
import validateRequest from 'src/utils/validateRequest';
import { auth } from 'src/middleware/auth';

const router = Router();

// ========== Payment routes ==========
// Initiate payment (public)
router.post(
    '/initiate-payment',
    validateRequest(createAdmissionDto),
    admissionPaymentController.initiatePayment,
);

// Payment callbacks (from SSLCommerz)
router.post('/payment/success', admissionPaymentController.paymentSuccess);
router.post('/payment/fail', admissionPaymentController.paymentFail);
router.post('/payment/cancel', admissionPaymentController.paymentCancel);
router.post('/payment/ipn', admissionPaymentController.ipn);

// ========== Existing routes ==========
// Public route for student registration (direct, no payment)
router.post('/register', validateRequest(createAdmissionDto), admissionController.createAdmission);

// Protected routes (admin access)
router.get('/', admissionController.getAllAdmissions);
router.get('/batch/:batchId', admissionController.getAdmissionsByBatchId);

// Parameterized routes
router.get('/:id', admissionController.getAdmissionById);
router.put('/:id', validateRequest(updateAdmissionDto), admissionController.updateAdmission);
router.put('/:id/status', admissionController.updateStatus);
router.put('/:id/payment-status', admissionController.updatePaymentStatus);
router.delete('/:id', admissionController.deleteAdmission);

// Result routes
router.put('/:id/result', auth(['admin', 'teacher']), admissionController.updateAdmissionResult);

// Student routes
router.get('/student/result', auth(['student']), admissionController.getStudentAdmissionResult);
router.get(
    '/student/all-results',
    auth(['student']),
    admissionController.getStudentAllAdmissionResults,
);

// Admin direct creation
router.post('/admin/register', auth(['admin']), admissionController.createAdmissionDirect);

export const AdmissionRoutes = router;

// // admission.routes.ts
// import { Router } from 'express';
// import { admissionController } from './admission.controller';
// import { createAdmissionDto, updateAdmissionDto } from './admission.dto';
// import validateRequest from 'src/utils/validateRequest';
// import { auth } from 'src/middleware/auth';

// const router = Router();

// // Public route for student registration
// router.post('/register', validateRequest(createAdmissionDto), admissionController.createAdmission);

// // Protected routes (admin access)
// router.get('/', admissionController.getAllAdmissions);
// router.get('/batch/:batchId', admissionController.getAdmissionsByBatchId);

// // Parameterized routes
// router.get('/:id', admissionController.getAdmissionById);
// router.put('/:id', validateRequest(updateAdmissionDto), admissionController.updateAdmission);
// router.put('/:id/status', admissionController.updateStatus);
// router.put('/:id/payment-status', admissionController.updatePaymentStatus);
// router.delete('/:id', admissionController.deleteAdmission);

// // Result routes
// router.put('/:id/result', auth(['admin', 'teacher']), admissionController.updateAdmissionResult);

// // Student routes (protected by student role)
// router.get('/student/result', auth(['student']), admissionController.getStudentAdmissionResult);
// router.get(
//     '/student/all-results',
//     auth(['student']),
//     admissionController.getStudentAllAdmissionResults,
// );

// // Add this route in your admission.routes.ts
// router.post('/admin/register', auth(['admin']), admissionController.createAdmissionDirect);

// export const AdmissionRoutes = router;

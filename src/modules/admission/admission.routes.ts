// import { Router } from 'express';
// import { admissionController } from './admission.controller';
// import { createAdmissionDto, updateAdmissionDto } from './admission.dto';
// import validateRequest from 'src/utils/validateRequest';
// import { auth } from 'src/middleware/auth';

// const router = Router();

// // IMPORTANT: Define specific routes BEFORE parameterized routes
// // Public route for student registration - this must come FIRST
// router.post('/register', validateRequest(createAdmissionDto), admissionController.createAdmission);

// // Protected routes (admin access)
// router.get('/', admissionController.getAllAdmissions);
// router.get('/batch/:batchId', admissionController.getAdmissionsByBatchId);

// // Parameterized routes should come LAST
// router.get('/:id', admissionController.getAdmissionById);
// router.put('/:id', validateRequest(updateAdmissionDto), admissionController.updateAdmission);
// router.put('/:id/status', admissionController.updateStatus);
// router.put('/:id/payment-status', admissionController.updatePaymentStatus);
// router.delete('/:id', admissionController.deleteAdmission);

// router.put('/:id/result', auth(['admin', 'teacher']), admissionController.updateAdmissionResult);

// router.get('/student/result', auth(['student']), admissionController.getStudentAdmissionResult);
// export const AdmissionRoutes = router;

// admission.routes.ts
import { Router } from 'express';
import { admissionController } from './admission.controller';
import { createAdmissionDto, updateAdmissionDto } from './admission.dto';
import validateRequest from 'src/utils/validateRequest';
import { auth } from 'src/middleware/auth';

const router = Router();

// Public route for student registration
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

// Student routes (protected by student role)
router.get('/student/result', auth(['student']), admissionController.getStudentAdmissionResult);
router.get(
    '/student/all-results',
    auth(['student']),
    admissionController.getStudentAllAdmissionResults,
);

// Add this route in your admission.routes.ts
router.post('/admin/register', auth(['admin']), admissionController.createAdmissionDirect);

export const AdmissionRoutes = router;

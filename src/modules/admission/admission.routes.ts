import { Router } from 'express';
import { admissionController } from './admission.controller';
import { createAdmissionDto, updateAdmissionDto } from './admission.dto';
import validateRequest from 'src/utils/validateRequest';

const router = Router();

// IMPORTANT: Define specific routes BEFORE parameterized routes
// Public route for student registration - this must come FIRST
router.post('/register', validateRequest(createAdmissionDto), admissionController.createAdmission);

// Protected routes (admin access)
router.get('/', admissionController.getAllAdmissions);
router.get('/batch/:batchId', admissionController.getAdmissionsByBatchId);

// Parameterized routes should come LAST
router.get('/:id', admissionController.getAdmissionById);
router.put('/:id', validateRequest(updateAdmissionDto), admissionController.updateAdmission);
router.put('/:id/status', admissionController.updateStatus);
router.put('/:id/payment-status', admissionController.updatePaymentStatus);
router.delete('/:id', admissionController.deleteAdmission);

export const AdmissionRoutes = router;

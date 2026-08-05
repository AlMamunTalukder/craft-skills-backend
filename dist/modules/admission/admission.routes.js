"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdmissionRoutes = void 0;
// admission.routes.ts
const express_1 = require("express");
const admission_controller_1 = require("./admission.controller");
const admission_payment_controller_1 = require("./admission-payment.controller");
const admission_dto_1 = require("./admission.dto");
const validateRequest_1 = __importDefault(require("../../utils/validateRequest"));
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
// ========== Payment routes ==========
// Initiate payment (public)
router.post('/initiate-payment', (0, validateRequest_1.default)(admission_dto_1.createAdmissionDto), admission_payment_controller_1.admissionPaymentController.initiatePayment);
// Payment callbacks (from SSLCommerz)
router.post('/payment/success', admission_payment_controller_1.admissionPaymentController.paymentSuccess);
router.post('/payment/fail', admission_payment_controller_1.admissionPaymentController.paymentFail);
router.post('/payment/cancel', admission_payment_controller_1.admissionPaymentController.paymentCancel);
router.post('/payment/ipn', admission_payment_controller_1.admissionPaymentController.ipn);
// ========== Existing routes ==========
// Public route for student registration (direct, no payment)
router.post('/register', (0, validateRequest_1.default)(admission_dto_1.createAdmissionDto), admission_controller_1.admissionController.createAdmission);
// Protected routes (admin access)
router.get('/', admission_controller_1.admissionController.getAllAdmissions);
router.get('/batch/:batchId', admission_controller_1.admissionController.getAdmissionsByBatchId);
// Parameterized routes
router.get('/:id', admission_controller_1.admissionController.getAdmissionById);
router.put('/:id', (0, validateRequest_1.default)(admission_dto_1.updateAdmissionDto), admission_controller_1.admissionController.updateAdmission);
router.put('/:id/status', admission_controller_1.admissionController.updateStatus);
router.put('/:id/payment-status', admission_controller_1.admissionController.updatePaymentStatus);
router.delete('/:id', admission_controller_1.admissionController.deleteAdmission);
// Result routes
router.put('/:id/result', (0, auth_1.auth)(['admin', 'teacher']), admission_controller_1.admissionController.updateAdmissionResult);
// Student routes
router.get('/student/result', (0, auth_1.auth)(['student']), admission_controller_1.admissionController.getStudentAdmissionResult);
router.get('/student/all-results', (0, auth_1.auth)(['student']), admission_controller_1.admissionController.getStudentAllAdmissionResults);
// Admin direct creation
router.post('/admin/register', (0, auth_1.auth)(['admin']), admission_controller_1.admissionController.createAdmissionDirect);
exports.AdmissionRoutes = router;
// // admission.routes.ts
// import { Router } from 'express';
// import { admissionController } from './admission.controller';
// import { createAdmissionDto, updateAdmissionDto } from './admission.dto';
// import validateRequest from '../../utils/validateRequest';
// import { auth } from '../../middleware/auth';
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

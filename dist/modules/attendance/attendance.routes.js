"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attendanceRoutes = void 0;
// src/modules/attendance/attendance.routes.ts
const express_1 = require("express");
const attendance_controller_1 = require("./attendance.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
// Public route for testing
router.get('/batch-stats-public', attendance_controller_1.attendanceController.getBatchAttendanceStatsPublic); // No auth required
router.get('/test-auth', attendance_controller_1.attendanceController.testAuth); // Test authentication
// Admin routes - require authentication
router.get('/', (0, auth_1.auth)(['admin', 'teacher']), attendance_controller_1.attendanceController.getAllAttendances);
router.get('/batch-stats', (0, auth_1.auth)(['admin', 'teacher']), attendance_controller_1.attendanceController.getBatchAttendanceStats);
router.get('/batch/:batchId/details', (0, auth_1.auth)(['admin', 'teacher']), attendance_controller_1.attendanceController.getBatchAttendanceDetails);
router.get('/batch/:batchCode', (0, auth_1.auth)(['admin', 'teacher']), attendance_controller_1.attendanceController.getAttendancesByBatch);
router.get('/batch/:batchCode/statistics', (0, auth_1.auth)(['admin', 'teacher']), attendance_controller_1.attendanceController.getBatchStatistics);
exports.attendanceRoutes = router;

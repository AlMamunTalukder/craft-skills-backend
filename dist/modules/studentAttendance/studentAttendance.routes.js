"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentAttendanceRoutes = void 0;
// src/modules/studentAttendance/studentAttendance.routes.ts
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const studentAttendance_controller_1 = require("./studentAttendance.controller");
const router = (0, express_1.Router)();
// TEST ROUTE (no auth) - to verify routing works
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Student Attendance API is working!',
        timestamp: new Date().toISOString(),
    });
});
// Apply authentication to all routes below
router.use((0, auth_1.auth)(['student']));
// PROTECTED ROUTES
router.get('/dashboard', studentAttendance_controller_1.studentAttendanceController.getDashboard);
router.post('/mark', studentAttendance_controller_1.studentAttendanceController.markAttendance);
router.get('/today-sessions', studentAttendance_controller_1.studentAttendanceController.getTodaySessions);
router.get('/history', studentAttendance_controller_1.studentAttendanceController.getAttendanceHistory);
router.post('/special-class', studentAttendance_controller_1.studentAttendanceController.updateSpecialClass);
router.post('/guest-class', studentAttendance_controller_1.studentAttendanceController.updateGuestClass);
exports.studentAttendanceRoutes = router;

// src/modules/studentAttendance/studentAttendance.routes.ts
import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { studentAttendanceController } from './studentAttendance.controller';

const router = Router();

// TEST ROUTE (no auth) - to verify routing works
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Student Attendance API is working!',
        timestamp: new Date().toISOString(),
    });
});

// Apply authentication to all routes below
router.use(auth(['student']));

// PROTECTED ROUTES
router.get('/dashboard', studentAttendanceController.getDashboard);
router.post('/mark', studentAttendanceController.markAttendance);
router.get('/today-sessions', studentAttendanceController.getTodaySessions);
router.get('/history', studentAttendanceController.getAttendanceHistory);

router.post('/special-class', studentAttendanceController.updateSpecialClass);
router.post('/guest-class', studentAttendanceController.updateGuestClass);
export const studentAttendanceRoutes = router;

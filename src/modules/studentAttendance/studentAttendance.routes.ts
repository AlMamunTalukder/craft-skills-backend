import { Router } from 'express';
import { auth } from 'src/middleware/auth';
import { studentAttendanceController } from './studentAttendance.controller';

const router = Router();

// Apply authentication
router.use(auth(['student']));

// Get attendance
router.get('/', studentAttendanceController.getAttendance);

// Save main class
router.post('/main-class', studentAttendanceController.saveMainClass);

// Save special class
router.post('/special-class', studentAttendanceController.saveSpecialClass);

// Save guest class
router.post('/guest-class', studentAttendanceController.saveGuestClass);

// Get statistics
router.get('/statistics', studentAttendanceController.getStatistics);

export const studentAttendanceRoutes = router;

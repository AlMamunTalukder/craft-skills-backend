import { Router } from 'express';
import { attendanceController } from './attendance.controller';
import { auth } from 'src/middleware/auth';

const router = Router();

// Apply authentication
router.use(auth(['student']));

// Get attendance
router.get('/', attendanceController.getAttendance);

// Save attendance
router.post('/save', attendanceController.saveAttendance);

// Get summary
router.get('/summary', attendanceController.getSummary);

export const attendanceRoutes = router;

// server/routes/studentAttendance.routes.ts
import { Router } from 'express';
import { auth } from 'src/middleware/auth';
import { studentAttendanceController } from './studentAttendance.controller';

const router = Router();

// Apply authentication (student role required)
router.use(auth(['student']));

// Get student's batches
router.get('/my-batches', studentAttendanceController.getMyBatches);

// Get attendance routines for a batch
router.get('/routines', studentAttendanceController.getAttendanceRoutines);

// Get student's attendance for a batch
router.get('/my-attendance', studentAttendanceController.getMyAttendance);

// Save student attendance
router.post('/save', studentAttendanceController.saveAttendance);

// Get attendance statistics
router.get('/stats', studentAttendanceController.getAttendanceStats);

export const studentAttendanceRoutes = router;

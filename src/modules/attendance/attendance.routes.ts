// server/routes/attendance.routes.ts
import { Router } from 'express';
import { auth } from 'src/middleware/auth';
import { attendanceController } from './attendance.controller';
import { createAttendanceDto, updateAttendanceDto } from './attendance.dto';
import validateRequest from 'src/utils/validateRequest';

const router = Router();

// Apply authentication to all routes
router.use(auth(['admin', 'teacher']));

// Get all attendance routines
router.get('/', attendanceController.getAllAttendances);

// Get attendance statistics
router.get('/stats', attendanceController.getAttendanceStats);

// Get attendance by ID
router.get('/:id', attendanceController.getAttendanceById);

// Create attendance routine
router.post('/', validateRequest(createAttendanceDto), attendanceController.createAttendance);

// Update attendance routine
router.put('/:id', validateRequest(updateAttendanceDto), attendanceController.updateAttendance);

// Delete attendance routine
router.delete('/:id', attendanceController.deleteAttendance);

// Update attendance status
router.put('/:id/status', attendanceController.updateAttendanceStatus);

export const attendanceRoutes = router;

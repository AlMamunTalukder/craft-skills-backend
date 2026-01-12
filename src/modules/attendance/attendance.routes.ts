// src/modules/attendance/attendance.routes.ts
import { Router } from 'express';
import { attendanceController } from './attendance.controller';
import { auth } from 'src/middleware/auth';

const router = Router();

// Public route for testing
router.get('/batch-stats-public', attendanceController.getBatchAttendanceStatsPublic); // No auth required
router.get('/test-auth', attendanceController.testAuth); // Test authentication

// Admin routes - require authentication
router.get('/', auth(['admin', 'teacher']), attendanceController.getAllAttendances);
router.get(
    '/batch-stats',
    auth(['admin', 'teacher']),
    attendanceController.getBatchAttendanceStats,
);
router.get(
    '/batch/:batchId/details',
    auth(['admin', 'teacher']),
    attendanceController.getBatchAttendanceDetails,
);
router.get(
    '/batch/:batchCode',
    auth(['admin', 'teacher']),
    attendanceController.getAttendancesByBatch,
);
router.get(
    '/batch/:batchCode/statistics',
    auth(['admin', 'teacher']),
    attendanceController.getBatchStatistics,
);

export const attendanceRoutes = router;

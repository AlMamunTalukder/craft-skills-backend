// src/modules/attendance/attendance.routes.ts
import { Router } from 'express';
import { attendanceController } from './attendance.controller';
import { auth } from 'src/middleware/auth';

const router = Router();

// Private - admin/teacher only (was public)
router.get('/batch-stats-public', auth(['admin', 'teacher']), attendanceController.getBatchAttendanceStatsPublic);
router.get('/test-auth', auth(['admin']), attendanceController.testAuth);

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

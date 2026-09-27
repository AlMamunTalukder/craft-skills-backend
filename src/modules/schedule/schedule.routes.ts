import { Router } from 'express';
import {
    createSchedule,
    getAllSchedules,
    getScheduleById,
    updateSchedule,
    deleteSchedule,
    getSchedule,
    updateScheduleStatus, // For single document (old route)
} from './schedule.controller';
import { auth } from 'src/middleware/auth';

const Schedulerouter = Router();

// Public read: single active schedule document for homepage
Schedulerouter.get('/', getSchedule);

// Get all schedules (list view) - private admin
Schedulerouter.get('/all', auth(['admin']), getAllSchedules);

// Get single schedule by ID - private admin
Schedulerouter.get('/:id', auth(['admin']), getScheduleById);

// Create new schedule
Schedulerouter.post('/', auth(['admin']), createSchedule);

// Update schedule by ID
Schedulerouter.put('/:id', auth(['admin']), updateSchedule);

// Delete schedule
Schedulerouter.delete('/:id', auth(['admin']), deleteSchedule);

// Backward-compatible admin update shape
Schedulerouter.put('/', auth(['admin']), updateSchedule);

Schedulerouter.put('/:id/status', auth(['admin']), updateScheduleStatus);

export default Schedulerouter;

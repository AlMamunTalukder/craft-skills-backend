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

// Get all schedules (list view)
Schedulerouter.get('/all', getAllSchedules);

// Get single schedule by ID
Schedulerouter.get('/:id', getScheduleById);

// Create new schedule
Schedulerouter.post('/', auth(['admin']), createSchedule);

// Update schedule by ID
Schedulerouter.put('/:id', auth(['admin']), updateSchedule);

// Delete schedule
Schedulerouter.delete('/:id', auth(['admin']), deleteSchedule);

// Old routes (for backward compatibility)
Schedulerouter.get('/', getSchedule); // Single document
Schedulerouter.put('/', auth(['admin']), updateSchedule); // Update single document

Schedulerouter.put('/:id/status', auth(['admin']), updateScheduleStatus);

export default Schedulerouter;

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

const Schedulerouter = Router();

// Get all schedules (list view)
Schedulerouter.get('/all', getAllSchedules);

// Get single schedule by ID
Schedulerouter.get('/:id', getScheduleById);

// Create new schedule
Schedulerouter.post('/', createSchedule);

// Update schedule by ID
Schedulerouter.put('/:id', updateSchedule);

// Delete schedule
Schedulerouter.delete('/:id', deleteSchedule);

// Old routes (for backward compatibility)
Schedulerouter.get('/', getSchedule); // Single document
Schedulerouter.put('/', updateSchedule); // Update single document

Schedulerouter.put('/:id/status', updateScheduleStatus);

export default Schedulerouter;

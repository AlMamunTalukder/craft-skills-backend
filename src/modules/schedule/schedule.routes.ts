import { Router } from 'express';
import { bulkUpdateSchedules, createSchedule, getAllSchedules, updateSchedule } from './schedule.controller';

const Schedulerouter = Router();

Schedulerouter.post('/', createSchedule);
Schedulerouter.get('/', getAllSchedules);
Schedulerouter.patch('/:id', updateSchedule);
Schedulerouter.put('/', bulkUpdateSchedules);

export default Schedulerouter;

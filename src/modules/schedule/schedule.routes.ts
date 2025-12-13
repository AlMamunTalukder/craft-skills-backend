import { Router } from 'express';
import { createSchedule, getAllSchedules, updateSchedule } from './schedule.controller';

const Schedulerouter = Router();

Schedulerouter.post('/', createSchedule);
Schedulerouter.get('/', getAllSchedules);
Schedulerouter.patch('/:id', updateSchedule);

export default Schedulerouter;

import { Schedule } from './schedule.model';
import type { ScheduleDto } from './schedule.dto';

const createSchedule = async (payload: ScheduleDto) => {
    return await Schedule.create(payload);
};

const getAllSchedules = async () => {
    return await Schedule.find().sort({ createdAt: 1 });
};

const updateSchedule = async (id: string, payload: Partial<ScheduleDto>) => {
    return await Schedule.findByIdAndUpdate(id, payload, { new: true });
};

export const ScheduleService = {
    createSchedule,
    getAllSchedules,
    updateSchedule,
};

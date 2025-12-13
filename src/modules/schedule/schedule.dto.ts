import { z } from 'zod';

export const scheduleDto = z.object({
    className: z.string().min(1),
    days: z.string().min(1),
    time: z.string().min(1),
    holidays: z.string().optional(),
});

export type ScheduleDto = z.infer<typeof scheduleDto>;

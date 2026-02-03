import { z } from 'zod';

// Individual class schedule item
export const scheduleItemDto = z.object({
    className: z.string().min(1),
    days: z.string().min(1),
    time: z.string().min(1),
});

// Main schedule document
export const scheduleDto = z.object({
    weekNumber: z.number().min(1).optional(), // Optional week number
    schedules: z.array(scheduleItemDto).min(1), // Array of class schedules
    holidays: z.string().optional(), // Holiday info for the week
});

export type ScheduleItemDto = z.infer<typeof scheduleItemDto>;
export type ScheduleDto = z.infer<typeof scheduleDto>;

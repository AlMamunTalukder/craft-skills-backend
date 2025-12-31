// server/dto/attendance.dto.ts
import z from 'zod';

export const createAttendanceDto = z.object({
    batchId: z.string().min(1, 'Batch ID is required'),
    batchCode: z.string().min(1, 'Batch code is required'),
    mainClasses: z.number().min(0, 'Main classes cannot be negative').default(0),
    specialClasses: z.number().min(0, 'Special classes cannot be negative').default(0),
    guestClasses: z.number().min(0, 'Guest classes cannot be negative').default(0),
    isActive: z.boolean().optional().default(true),
});

export const updateAttendanceDto = createAttendanceDto.partial();

export type CreateAttendanceDto = z.infer<typeof createAttendanceDto>;
export type UpdateAttendanceDto = z.infer<typeof updateAttendanceDto>;

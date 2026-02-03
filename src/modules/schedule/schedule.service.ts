import { Schedule } from './schedule.model';
import type { ScheduleDto } from './schedule.dto';

// In schedule.service.ts
const createSchedule = async (payload: ScheduleDto) => {
    const existingSchedule = await Schedule.findOne();

    if (existingSchedule) {
        throw new Error('Schedule already exists. Use update instead.');
    }

    return await Schedule.create(payload);
};

// Or use upsert (create or update)
const upsertSchedule = async (payload: ScheduleDto) => {
    let scheduleDoc = await Schedule.findOne();

    if (!scheduleDoc) {
        scheduleDoc = await Schedule.create(payload);
    } else {
        // scheduleDoc.schedules = payload.schedules;
        scheduleDoc.holidays = payload.holidays;
        if (payload.weekNumber) {
            scheduleDoc.weekNumber = payload.weekNumber;
        }
        await scheduleDoc.save();
    }

    return scheduleDoc;
};

// Get or create the single schedule document
const getScheduleDocument = async () => {
    let scheduleDoc = await Schedule.findOne();

    if (!scheduleDoc) {
        // Create default schedule with your example data
        scheduleDoc = await Schedule.create({
            weekNumber: 1,
            schedules: [
                { className: 'মেইন ক্লাস', days: 'শুক্র ও সোমবার', time: 'রাত ৯টা থেকে ১১টা' },
                {
                    className: 'প্রব্লেম সলভিং',
                    days: 'শনি ও মঙ্গলবার',
                    time: 'রাত ৯টা থেকে ১০.৩০মি.',
                },
                { className: 'প্রাক্টিস', days: 'রবি ও বুধবার', time: 'রাত ৯টা থেকে ১০.৩০মি.' },
                { className: 'প্রেজেন্টেশন রিভিউ', days: 'মঙ্গলবার', time: 'মেইন ক্লাসের পর' },
            ],
            holidays: 'সাপ্তাহিক ছুটিঃ বৃহস্পতিবার',
        });
    }

    return scheduleDoc;
};

// Get complete schedule
const getCompleteSchedule = async () => {
    return await getScheduleDocument();
};

// Update complete schedule
const updateCompleteSchedule = async (payload: ScheduleDto) => {
    const scheduleDoc = await getScheduleDocument();

    //   scheduleDoc.schedules = payload.schedules;
    scheduleDoc.holidays = payload.holidays;
    if (payload.weekNumber) {
        scheduleDoc.weekNumber = payload.weekNumber;
    }

    await scheduleDoc.save();
    return scheduleDoc;
};

export const ScheduleService = {
    createSchedule,
    getCompleteSchedule,
    updateCompleteSchedule,
    upsertSchedule, // Add this
};

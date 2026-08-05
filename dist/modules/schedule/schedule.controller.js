"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSchedule = exports.deleteSchedule = exports.updateScheduleStatus = exports.updateSchedule = exports.createSchedule = exports.getScheduleById = exports.getAllSchedules = void 0;
const schedule_model_1 = require("./schedule.model");
// Get all schedules
const getAllSchedules = async (_req, res) => {
    try {
        const schedules = await schedule_model_1.Schedule.find().sort({ weekNumber: 1 });
        res.json({
            success: true,
            data: schedules,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch schedules',
        });
    }
};
exports.getAllSchedules = getAllSchedules;
// Get single schedule by ID
const getScheduleById = async (req, res) => {
    try {
        const id = req.params.id;
        const schedule = await schedule_model_1.Schedule.findById(id);
        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found',
            });
        }
        res.json({
            success: true,
            data: schedule,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch schedule',
        });
    }
};
exports.getScheduleById = getScheduleById;
// Create new schedule
const createSchedule = async (req, res) => {
    try {
        const { weekNumber, holidays, schedules } = req.body;
        // Check if schedule for this week already exists
        const existingSchedule = await schedule_model_1.Schedule.findOne({ weekNumber });
        if (existingSchedule) {
            return res.status(400).json({
                success: false,
                message: `Schedule for Week ${weekNumber} already exists`,
            });
        }
        const newSchedule = await schedule_model_1.Schedule.create({
            weekNumber,
            holidays,
            schedules,
        });
        res.status(201).json({
            success: true,
            message: 'Schedule created successfully',
            data: newSchedule,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Validation failed',
        });
    }
};
exports.createSchedule = createSchedule;
// Update schedule (with or without ID)
const updateSchedule = async (req, res) => {
    try {
        const { weekNumber, holidays, schedules } = req.body;
        const id = req.params.id; // Could be undefined if using old route
        let scheduleDoc;
        if (id) {
            // Update specific schedule by ID
            scheduleDoc = await schedule_model_1.Schedule.findByIdAndUpdate(id, { weekNumber, holidays, schedules }, { new: true });
        }
        else {
            // Update the single schedule document (old behavior)
            scheduleDoc = await schedule_model_1.Schedule.findOne();
            if (!scheduleDoc) {
                return res.status(404).json({
                    success: false,
                    message: 'Schedule not found',
                });
            }
            scheduleDoc.weekNumber = weekNumber;
            scheduleDoc.holidays = holidays;
            scheduleDoc.schedules = schedules;
            await scheduleDoc.save();
        }
        if (!scheduleDoc) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found',
            });
        }
        res.json({
            success: true,
            message: 'Schedule updated successfully',
            data: scheduleDoc,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Validation failed',
        });
    }
};
exports.updateSchedule = updateSchedule;
const updateScheduleStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const { isActive } = req.body;
        // If we are setting this one to active, turn ALL others off first
        if (isActive === true) {
            await schedule_model_1.Schedule.updateMany({}, { isActive: false });
        }
        const schedule = await schedule_model_1.Schedule.findByIdAndUpdate(id, { isActive }, { new: true });
        res.json({
            success: true,
            message: `Schedule Week ${schedule?.weekNumber} is now ${isActive ? 'active' : 'inactive'}`,
            data: schedule,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateScheduleStatus = updateScheduleStatus;
// Delete schedule
const deleteSchedule = async (req, res) => {
    try {
        const id = req.params.id;
        const schedule = await schedule_model_1.Schedule.findByIdAndDelete(id);
        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found',
            });
        }
        res.json({
            success: true,
            message: 'Schedule deleted successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete schedule',
        });
    }
};
exports.deleteSchedule = deleteSchedule;
// Updated getSchedule in schedule.controller.ts
const getSchedule = async (_req, res) => {
    try {
        // 1. Specifically look for the ACTIVE schedule
        let scheduleDoc = await schedule_model_1.Schedule.findOne({ isActive: true });
        // 2. If no schedule is marked active, fallback to the latest one
        if (!scheduleDoc) {
            scheduleDoc = await schedule_model_1.Schedule.findOne().sort({ createdAt: -1 });
        }
        // 3. Only create if the database is completely empty
        if (!scheduleDoc) {
            scheduleDoc = await schedule_model_1.Schedule.create({
                weekNumber: 1,
                schedules: [],
                holidays: '',
                isActive: true,
            });
        }
        res.json({
            success: true,
            data: scheduleDoc,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch schedule',
        });
    }
};
exports.getSchedule = getSchedule;

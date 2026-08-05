"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const schedule_controller_1 = require("./schedule.controller");
const Schedulerouter = (0, express_1.Router)();
// Get all schedules (list view)
Schedulerouter.get('/all', schedule_controller_1.getAllSchedules);
// Get single schedule by ID
Schedulerouter.get('/:id', schedule_controller_1.getScheduleById);
// Create new schedule
Schedulerouter.post('/', schedule_controller_1.createSchedule);
// Update schedule by ID
Schedulerouter.put('/:id', schedule_controller_1.updateSchedule);
// Delete schedule
Schedulerouter.delete('/:id', schedule_controller_1.deleteSchedule);
// Old routes (for backward compatibility)
Schedulerouter.get('/', schedule_controller_1.getSchedule); // Single document
Schedulerouter.put('/', schedule_controller_1.updateSchedule); // Update single document
Schedulerouter.put('/:id/status', schedule_controller_1.updateScheduleStatus);
exports.default = Schedulerouter;

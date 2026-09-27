"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const schedule_controller_1 = require("./schedule.controller");
const auth_1 = require("../../middleware/auth");
const Schedulerouter = (0, express_1.Router)();
// Public read: single active schedule document for homepage
Schedulerouter.get('/', schedule_controller_1.getSchedule);
// Get all schedules (list view) - private admin
Schedulerouter.get('/all', (0, auth_1.auth)(['admin']), schedule_controller_1.getAllSchedules);
// Get single schedule by ID - private admin
Schedulerouter.get('/:id', (0, auth_1.auth)(['admin']), schedule_controller_1.getScheduleById);
// Create new schedule
Schedulerouter.post('/', (0, auth_1.auth)(['admin']), schedule_controller_1.createSchedule);
// Update schedule by ID
Schedulerouter.put('/:id', (0, auth_1.auth)(['admin']), schedule_controller_1.updateSchedule);
// Delete schedule
Schedulerouter.delete('/:id', (0, auth_1.auth)(['admin']), schedule_controller_1.deleteSchedule);
// Backward-compatible admin update shape
Schedulerouter.put('/', (0, auth_1.auth)(['admin']), schedule_controller_1.updateSchedule);
Schedulerouter.put('/:id/status', (0, auth_1.auth)(['admin']), schedule_controller_1.updateScheduleStatus);
exports.default = Schedulerouter;

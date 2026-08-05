"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleDto = exports.scheduleItemDto = void 0;
const zod_1 = require("zod");
// Individual class schedule item
exports.scheduleItemDto = zod_1.z.object({
    className: zod_1.z.string().min(1),
    days: zod_1.z.string().min(1),
    time: zod_1.z.string().min(1),
});
// Main schedule document
exports.scheduleDto = zod_1.z.object({
    weekNumber: zod_1.z.number().min(1).optional(), // Optional week number
    schedules: zod_1.z.array(exports.scheduleItemDto).min(1), // Array of class schedules
    holidays: zod_1.z.string().optional(), // Holiday info for the week
});

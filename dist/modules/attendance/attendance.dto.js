"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAttendanceDto = exports.createAttendanceDto = void 0;
// server/dto/attendance.dto.ts
const zod_1 = __importDefault(require("zod"));
exports.createAttendanceDto = zod_1.default.object({
    batchId: zod_1.default.string().min(1, 'Batch ID is required'),
    batchCode: zod_1.default.string().min(1, 'Batch code is required'),
    mainClasses: zod_1.default.number().min(0, 'Main classes cannot be negative').default(0),
    specialClasses: zod_1.default.number().min(0, 'Special classes cannot be negative').default(0),
    guestClasses: zod_1.default.number().min(0, 'Guest classes cannot be negative').default(0),
    isActive: zod_1.default.boolean().optional().default(true),
});
exports.updateAttendanceDto = exports.createAttendanceDto.partial();

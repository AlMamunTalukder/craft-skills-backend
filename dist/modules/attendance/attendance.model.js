"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Attendance = void 0;
// src/modules/attendance/attendance.model.ts
const mongoose_1 = require("mongoose");
const attendanceSchema = new mongoose_1.Schema({
    studentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    batchId: {
        type: String,
        required: true,
        index: true,
    },
    className: {
        type: String,
        required: true,
    },
    sessionType: {
        type: String,
        enum: ['regular', 'problemSolving', 'practice', 'special', 'guest'],
        required: true,
    },
    attended: {
        type: Boolean,
        default: false,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    markedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});
// ✅ CORRECT: Include batchId in unique index
attendanceSchema.index({ studentId: 1, batchId: 1, className: 1, sessionType: 1, date: 1 }, {
    unique: true,
    name: 'unique_attendance_per_batch',
});
exports.Attendance = mongoose_1.models.Attendance || (0, mongoose_1.model)('Attendance', attendanceSchema);
exports.default = exports.Attendance;

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const StudentAttendanceSchema = new mongoose_1.Schema({
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
    attendanceRoutineId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'AttendanceRoutine',
        default: null,
    },
    // Main Classes (15 classes)
    mainClasses: {
        type: Map,
        of: new mongoose_1.Schema({
            regular: { type: Boolean, default: false },
            problemSolving: { type: Boolean, default: false },
            practice: { type: Boolean, default: false },
            lastUpdated: { type: Date, default: Date.now },
        }),
        default: () => {
            const mainClasses = new Map();
            for (let i = 1; i <= 15; i++) {
                mainClasses.set(`Class ${i}`, {
                    regular: false,
                    problemSolving: false,
                    practice: false,
                    lastUpdated: new Date(),
                });
            }
            return mainClasses;
        },
    },
    // Special Classes (5 classes)
    specialClasses: {
        type: Map,
        of: new mongoose_1.Schema({
            attended: { type: Boolean, default: false },
            lastUpdated: { type: Date, default: Date.now },
        }),
        default: () => {
            const specialClasses = new Map();
            for (let i = 1; i <= 5; i++) {
                specialClasses.set(`Special Class ${i}`, {
                    attended: false,
                    lastUpdated: new Date(),
                });
            }
            return specialClasses;
        },
    },
    // Guest Classes (5 classes)
    guestClasses: {
        type: Map,
        of: new mongoose_1.Schema({
            attended: { type: Boolean, default: false },
            guestName: { type: String, default: 'Guest Speaker' },
            lastUpdated: { type: Date, default: Date.now },
        }),
        default: () => {
            const guestClasses = new Map();
            for (let i = 1; i <= 5; i++) {
                guestClasses.set(`Guest Class ${i}`, {
                    attended: false,
                    guestName: `Guest Speaker ${i}`,
                    lastUpdated: new Date(),
                });
            }
            return guestClasses;
        },
    },
    // Statistics
    statistics: {
        type: {
            main: {
                attended: { type: Number, default: 0 },
                total: { type: Number, default: 45 },
                percentage: { type: Number, default: 0 },
            },
            special: {
                attended: { type: Number, default: 0 },
                total: { type: Number, default: 5 },
                percentage: { type: Number, default: 0 },
            },
            guest: {
                attended: { type: Number, default: 0 },
                total: { type: Number, default: 5 },
                percentage: { type: Number, default: 0 },
            },
            overall: {
                attended: { type: Number, default: 0 },
                total: { type: Number, default: 55 },
                percentage: { type: Number, default: 0 },
            },
            lastUpdated: { type: Date, default: Date.now },
        },
        default: () => ({
            main: { attended: 0, total: 45, percentage: 0 },
            special: { attended: 0, total: 5, percentage: 0 },
            guest: { attended: 0, total: 5, percentage: 0 },
            overall: { attended: 0, total: 55, percentage: 0 },
            lastUpdated: new Date(),
        }),
    },
}, {
    timestamps: true,
});
// FIX: Use studentId + batchId as unique index instead of studentId + attendanceRoutineId
StudentAttendanceSchema.index({ studentId: 1, batchId: 1 }, { unique: true });
exports.default = mongoose_1.default.models?.StudentAttendance ||
    mongoose_1.default.model('StudentAttendance', StudentAttendanceSchema);

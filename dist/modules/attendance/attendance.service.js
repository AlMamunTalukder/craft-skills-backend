"use strict";
// server/services/attendance.service.ts - Simplified version
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attendanceService = void 0;
const attendance_model_1 = __importDefault(require("./attendance.model"));
// Helper to generate classes based on counts
const generateClasses = (mainClasses, specialClasses, guestClasses) => {
    const classes = [];
    // Add your class generation logic here
    return classes;
};
// Get all attendance records
const getAllAttendances = async () => {
    try {
        const attendances = await attendance_model_1.default.find().sort({ createdAt: -1 }).lean().exec();
        return attendances;
    }
    catch (error) {
        // console.error('Error fetching attendances:', error);
        throw new Error('Failed to fetch attendance records');
    }
};
// Get attendance by ID
const getAttendanceById = async (id) => {
    try {
        const attendance = await attendance_model_1.default.findById(id).lean().exec();
        if (!attendance) {
            return null;
        }
        return attendance;
    }
    catch (error) {
        // console.error('Error fetching attendance by ID:', error);
        throw new Error('Failed to fetch attendance record');
    }
};
// Create attendance record
const createAttendance = async (data) => {
    try {
        const { mainClasses, specialClasses, guestClasses, ...rest } = data;
        // Generate classes based on counts
        const classes = generateClasses(mainClasses, specialClasses, guestClasses);
        // Calculate total classes
        const totalClasses = mainClasses + specialClasses + guestClasses;
        const attendance = new attendance_model_1.default({
            ...rest,
            classes,
            totalClasses,
            mainClasses,
            specialClasses,
            guestClasses,
        });
        const savedAttendance = await attendance.save();
        const attendanceObj = savedAttendance.toObject();
        return attendanceObj;
    }
    catch (error) {
        // console.error('Error creating attendance:', error);
        throw new Error('Failed to create attendance record');
    }
};
// Update attendance record
const updateAttendance = async (id, data) => {
    try {
        const attendance = await attendance_model_1.default.findById(id).exec();
        if (!attendance) {
            throw new Error('Attendance not found');
        }
        let updateData = { ...data };
        let mainClasses;
        let specialClasses;
        let guestClasses;
        // If class counts are being updated, regenerate classes
        if (data.mainClasses !== undefined ||
            data.specialClasses !== undefined ||
            data.guestClasses !== undefined) {
            mainClasses =
                data.mainClasses !== undefined ? data.mainClasses : attendance.mainClasses;
            specialClasses =
                data.specialClasses !== undefined ? data.specialClasses : attendance.specialClasses;
            guestClasses =
                data.guestClasses !== undefined ? data.guestClasses : attendance.guestClasses;
            updateData = {
                ...updateData,
                totalClasses: mainClasses + specialClasses + guestClasses,
                mainClasses,
                specialClasses,
                guestClasses,
            };
        }
        const updatedAttendance = await attendance_model_1.default.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        })
            .lean()
            .exec();
        if (!updatedAttendance) {
            return null;
        }
        return updatedAttendance;
    }
    catch (error) {
        // console.error('Error updating attendance:', error);
        throw new Error('Failed to update attendance record');
    }
};
// Delete attendance record
const deleteAttendance = async (id) => {
    try {
        const attendance = await attendance_model_1.default.findByIdAndDelete(id).exec();
        if (!attendance) {
            throw new Error('Attendance not found');
        }
    }
    catch (error) {
        // console.error('Error deleting attendance:', error);
        throw new Error('Failed to delete attendance record');
    }
};
// Update attendance status
const updateAttendanceStatus = async (id, isActive) => {
    try {
        const attendance = await attendance_model_1.default.findByIdAndUpdate(id, { isActive }, { new: true })
            .lean()
            .exec();
        if (!attendance) {
            return null;
        }
        return attendance;
    }
    catch (error) {
        // console.error('Error updating attendance status:', error);
        throw new Error('Failed to update attendance status');
    }
};
// Get attendance statistics
const getAttendanceStats = async () => {
    try {
        const stats = await attendance_model_1.default.aggregate([
            {
                $group: {
                    _id: null,
                    totalRecords: { $sum: 1 },
                    activeRecords: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
                    totalClasses: { $sum: '$totalClasses' },
                    totalMainClasses: { $sum: '$mainClasses' },
                    totalSpecialClasses: { $sum: '$specialClasses' },
                    totalGuestClasses: { $sum: '$guestClasses' },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalRecords: 1,
                    activeRecords: 1,
                    inactiveRecords: { $subtract: ['$totalRecords', '$activeRecords'] },
                    totalClasses: 1,
                    totalMainClasses: 1,
                    totalSpecialClasses: 1,
                    totalGuestClasses: 1,
                },
            },
        ]);
        return (stats[0] || {
            totalRecords: 0,
            activeRecords: 0,
            inactiveRecords: 0,
            totalClasses: 0,
            totalMainClasses: 0,
            totalSpecialClasses: 0,
            totalGuestClasses: 0,
        });
    }
    catch (error) {
        // console.error('Error fetching attendance stats:', error);
        throw new Error('Failed to fetch attendance statistics');
    }
};
exports.attendanceService = {
    getAllAttendances,
    getAttendanceById,
    createAttendance,
    updateAttendance,
    deleteAttendance,
    updateAttendanceStatus,
    getAttendanceStats,
};

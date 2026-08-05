"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seminarService = void 0;
const AppError_1 = __importDefault(require("../../errors/AppError"));
const seminar_model_1 = require("./seminar.model");
const getAllSeminars = async () => {
    try {
        const seminars = await seminar_model_1.Seminar.find().sort({ createdAt: -1 });
        return seminars;
    }
    catch (error) {
        throw new AppError_1.default(500, 'Database error: ' + error.message);
    }
};
// Also check your createSeminar function
const createSeminar = async (seminarData) => {
    try {
        // console.log('Creating seminar with data:', seminarData);
        const seminar = new seminar_model_1.Seminar(seminarData);
        await seminar.save();
        // console.log('Seminar created successfully with ID:', seminar._id);
        return seminar;
    }
    catch (error) {
        throw new AppError_1.default(400, 'Validation failed: ' + error.message);
    }
};
const getSeminarById = async (id) => {
    const seminar = await seminar_model_1.Seminar.findById(id).lean();
    if (!seminar) {
        throw new AppError_1.default(404, 'Seminar not found');
    }
    return seminar;
};
const updateSeminar = async (id, seminarData) => {
    const seminar = await seminar_model_1.Seminar.findByIdAndUpdate(id, seminarData, {
        new: true,
        runValidators: true,
    });
    if (!seminar) {
        throw new AppError_1.default(404, 'Seminar not found');
    }
    return seminar;
};
const deleteSeminar = async (id) => {
    const seminar = await seminar_model_1.Seminar.findByIdAndDelete(id);
    if (!seminar) {
        throw new AppError_1.default(404, 'Seminar not found');
    }
};
const changeStatus = async (id, isActive) => {
    const seminar = await seminar_model_1.Seminar.findByIdAndUpdate(id, { isActive }, { new: true });
    if (!seminar) {
        throw new AppError_1.default(404, 'Seminar not found');
    }
    return seminar;
};
const getActiveSeminar = async () => {
    try {
        const now = new Date();
        // Subtract 6 hours to align stored UTC deadline with BD time
        const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        const seminar = await seminar_model_1.Seminar.findOne({
            isActive: true,
            registrationDeadline: { $gte: sixHoursAgo },
        }).sort({ date: 1 }).lean();
        return seminar;
    }
    catch (error) {
        return null;
    }
};
const getPdfSeminar = async () => {
    try {
        const seminar = await seminar_model_1.Seminar.findOne({}).sort({ date: -1 }).lean();
        return seminar;
    }
    catch (error) {
        return null;
    }
};
exports.seminarService = {
    createSeminar,
    getAllSeminars,
    getSeminarById,
    updateSeminar,
    deleteSeminar,
    changeStatus,
    getActiveSeminar,
    getPdfSeminar,
};

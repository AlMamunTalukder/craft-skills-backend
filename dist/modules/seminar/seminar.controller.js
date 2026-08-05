"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seminarController = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const seminar_service_1 = require("./seminar.service");
exports.seminarController = {
    getAllSeminars: (0, catchAsync_1.default)(async (req, res) => {
        const seminars = await seminar_service_1.seminarService.getAllSeminars();
        res.status(200).json({
            success: true,
            message: 'Seminars retrieved successfully',
            data: seminars,
            count: seminars.length,
        });
    }),
    // Add active seminar endpoint
    getActiveSeminar: (0, catchAsync_1.default)(async (req, res) => {
        const seminar = await seminar_service_1.seminarService.getActiveSeminar();
        if (!seminar) {
            return res.status(404).json({
                success: false,
                message: 'No active seminar found',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Active seminar retrieved successfully',
            data: seminar,
        });
    }),
    getSeminarById: (0, catchAsync_1.default)(async (req, res) => {
        const id = req.params.id;
        const seminar = await seminar_service_1.seminarService.getSeminarById(id);
        res.status(200).json({
            success: true,
            message: 'Seminar retrieved successfully',
            data: seminar,
        });
    }),
    // Create seminar
    createSeminar: (0, catchAsync_1.default)(async (req, res) => {
        const seminar = await seminar_service_1.seminarService.createSeminar(req.body);
        res.status(201).json({
            success: true,
            message: 'Seminar created successfully',
            data: seminar,
        });
    }),
    updateSeminar: (0, catchAsync_1.default)(async (req, res) => {
        const id = req.params.id;
        const seminar = await seminar_service_1.seminarService.updateSeminar(id, req.body);
        res.status(200).json({
            success: true,
            message: 'Seminar updated successfully',
            data: seminar,
        });
    }),
    // Delete seminar
    deleteSeminar: (0, catchAsync_1.default)(async (req, res) => {
        const id = req.params.id;
        await seminar_service_1.seminarService.deleteSeminar(id);
        res.status(200).json({
            success: true,
            message: 'Seminar deleted successfully',
        });
    }),
    // Change status
    changeStatus: (0, catchAsync_1.default)(async (req, res) => {
        const id = req.params.id;
        const { isActive } = req.body;
        const seminar = await seminar_service_1.seminarService.changeStatus(id, isActive);
        res.status(200).json({
            success: true,
            message: 'Seminar status updated successfully',
            data: seminar,
        });
    }),
    getPdfSeminar: (0, catchAsync_1.default)(async (req, res) => {
        const seminar = await seminar_service_1.seminarService.getPdfSeminar();
        if (!seminar) {
            return res.status(404).json({
                success: false,
                message: 'No seminar found for PDF download',
            });
        }
        res.status(200).json({
            success: true,
            message: 'PDF seminar retrieved successfully',
            data: seminar,
        });
    }),
};

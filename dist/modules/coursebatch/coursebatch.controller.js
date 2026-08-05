"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseBatchController = void 0;
const coursebatch_service_1 = require("./coursebatch.service");
const coursebatch_dto_1 = require("./coursebatch.dto");
const validateRequest_1 = __importDefault(require("../../utils/validateRequest"));
exports.courseBatchController = {
    checkBatchExists: async (req, res) => {
        try {
            const batchNumber = req.params.batchNumber;
            const batchExists = await coursebatch_service_1.courseBatchService.checkBatchExists(batchNumber);
            res.json({
                success: true,
                exists: batchExists,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },
    getAllBatches: async (req, res) => {
        try {
            const batches = await coursebatch_service_1.courseBatchService.getAllBatches();
            res.json({
                success: true,
                message: 'Batches retrieved successfully',
                data: batches,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },
    getBatchById: async (req, res) => {
        try {
            const batch = await coursebatch_service_1.courseBatchService.getBatchById(String(req.params.id));
            res.json({
                success: true,
                message: 'Batch retrieved successfully',
                data: batch,
            });
        }
        catch (error) {
            res.status(404).json({
                success: false,
                message: error.message,
            });
        }
    },
    createBatch: [
        (0, validateRequest_1.default)(coursebatch_dto_1.createBatchDto),
        async (req, res) => {
            try {
                // Convert string dates to Date objects for MongoDB
                const batchData = {
                    ...req.body,
                    registrationStart: new Date(req.body.registrationStart),
                    registrationEnd: new Date(req.body.registrationEnd),
                };
                const batch = await coursebatch_service_1.courseBatchService.createBatch(batchData);
                res.status(201).json({
                    success: true,
                    message: 'Batch created successfully',
                    data: batch,
                });
            }
            catch (error) {
                res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }
        },
    ],
    updateBatch: [
        (0, validateRequest_1.default)(coursebatch_dto_1.updateBatchDto),
        async (req, res) => {
            try {
                const { registrationStart, registrationEnd, ...otherData } = req.body;
                // Prepare update data
                const updateData = { ...otherData };
                if (registrationStart) {
                    updateData.registrationStart = new Date(registrationStart);
                }
                if (registrationEnd) {
                    updateData.registrationEnd = new Date(registrationEnd);
                }
                const batch = await coursebatch_service_1.courseBatchService.updateBatch(String(req.params.id), updateData);
                res.json({
                    success: true,
                    message: 'Batch updated successfully',
                    data: batch,
                });
            }
            catch (error) {
                res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }
        },
    ],
    deleteBatch: async (req, res) => {
        try {
            await coursebatch_service_1.courseBatchService.deleteBatch(String(req.params.id));
            res.json({
                success: true,
                message: 'Batch deleted successfully',
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    },
    changeStatus: async (req, res) => {
        try {
            const { isActive } = req.body;
            const batch = await coursebatch_service_1.courseBatchService.changeStatus(String(req.params.id), isActive);
            res.json({
                success: true,
                message: 'Batch status updated successfully',
                data: batch,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    },
    getActiveBatch: async (req, res) => {
        try {
            const batch = await coursebatch_service_1.courseBatchService.getActiveBatch();
            res.json({
                success: true,
                message: 'Active batch retrieved successfully',
                data: batch,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },
};

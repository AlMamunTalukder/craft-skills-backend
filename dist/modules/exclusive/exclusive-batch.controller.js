"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exclusiveBatchController = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const exclusive_batch_service_1 = require("./exclusive-batch.service");
exports.exclusiveBatchController = {
    getAllBatches: (0, catchAsync_1.default)(async (req, res) => {
        const batches = await exclusive_batch_service_1.exclusiveBatchService.getAllBatches();
        res.status(200).json({
            success: true,
            message: 'Batches retrieved successfully',
            data: batches,
            count: batches.length,
        });
    }),
    getActiveBatch: (0, catchAsync_1.default)(async (req, res) => {
        const batch = await exclusive_batch_service_1.exclusiveBatchService.getActiveBatch();
        if (!batch) {
            return res.status(404).json({
                success: false,
                message: 'No active batch found',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Active batch retrieved successfully',
            data: batch,
        });
    }),
    getBatchById: (0, catchAsync_1.default)(async (req, res) => {
        const id = req.params.id;
        const batch = await exclusive_batch_service_1.exclusiveBatchService.getBatchById(id);
        res.status(200).json({
            success: true,
            message: 'Batch retrieved successfully',
            data: batch,
        });
    }),
    createBatch: (0, catchAsync_1.default)(async (req, res) => {
        const batch = await exclusive_batch_service_1.exclusiveBatchService.createBatch(req.body);
        res.status(201).json({
            success: true,
            message: 'Batch created successfully',
            data: batch,
        });
    }),
    updateBatch: (0, catchAsync_1.default)(async (req, res) => {
        const id = req.params.id;
        const batch = await exclusive_batch_service_1.exclusiveBatchService.updateBatch(id, req.body);
        res.status(200).json({
            success: true,
            message: 'Batch updated successfully',
            data: batch,
        });
    }),
    deleteBatch: (0, catchAsync_1.default)(async (req, res) => {
        const id = req.params.id;
        await exclusive_batch_service_1.exclusiveBatchService.deleteBatch(id);
        res.status(200).json({
            success: true,
            message: 'Batch deleted successfully',
        });
    }),
    changeStatus: (0, catchAsync_1.default)(async (req, res) => {
        const id = req.params.id;
        const { isActive } = req.body;
        const batch = await exclusive_batch_service_1.exclusiveBatchService.changeStatus(id, isActive);
        res.status(200).json({
            success: true,
            message: 'Batch status updated successfully',
            data: batch,
        });
    }),
};

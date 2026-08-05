"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExclusiveBatchRoutes = void 0;
const express_1 = require("express");
const exclusive_batch_controller_1 = require("./exclusive-batch.controller");
const validateRequest_1 = __importDefault(require("../../utils/validateRequest"));
const auth_1 = require("../../middleware/auth");
const exclusive_batch_dto_1 = require("./exclusive-batch.dto");
const router = (0, express_1.Router)();
// Public routes
router.get('/', exclusive_batch_controller_1.exclusiveBatchController.getAllBatches);
router.get('/active', exclusive_batch_controller_1.exclusiveBatchController.getActiveBatch);
// 🔐 Admin routes (Protected)
router.post('/', (0, auth_1.auth)(['admin']), (0, validateRequest_1.default)(exclusive_batch_dto_1.createExclusiveBatchDto), exclusive_batch_controller_1.exclusiveBatchController.createBatch);
router.get('/:id', (0, auth_1.auth)(['admin']), exclusive_batch_controller_1.exclusiveBatchController.getBatchById);
router.put('/:id', (0, auth_1.auth)(['admin']), (0, validateRequest_1.default)(exclusive_batch_dto_1.updateExclusiveBatchDto), exclusive_batch_controller_1.exclusiveBatchController.updateBatch);
router.put('/:id/status', (0, auth_1.auth)(['admin']), exclusive_batch_controller_1.exclusiveBatchController.changeStatus);
router.delete('/:id', (0, auth_1.auth)(['admin']), exclusive_batch_controller_1.exclusiveBatchController.deleteBatch);
exports.ExclusiveBatchRoutes = router;

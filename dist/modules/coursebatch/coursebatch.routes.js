"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseBatchRoutes = void 0;
const express_1 = require("express");
const coursebatch_controller_1 = require("./coursebatch.controller");
const validateRequest_1 = __importDefault(require("../../utils/validateRequest"));
const coursebatch_dto_1 = require("./coursebatch.dto");
const router = (0, express_1.Router)();
// Add this route before parameterized routes
router.get('/check/:batchNumber', coursebatch_controller_1.courseBatchController.checkBatchExists);
// Public routes
router.get('/', coursebatch_controller_1.courseBatchController.getAllBatches);
router.get('/active', coursebatch_controller_1.courseBatchController.getActiveBatch);
router.get('/:id', coursebatch_controller_1.courseBatchController.getBatchById);
// Protected routes with validation
router.post('/', (0, validateRequest_1.default)(coursebatch_dto_1.createBatchDto), coursebatch_controller_1.courseBatchController.createBatch);
router.put('/:id', (0, validateRequest_1.default)(coursebatch_dto_1.updateBatchDto), coursebatch_controller_1.courseBatchController.updateBatch);
router.put('/:id/status', coursebatch_controller_1.courseBatchController.changeStatus);
router.delete('/:id', coursebatch_controller_1.courseBatchController.deleteBatch);
exports.courseBatchRoutes = router;

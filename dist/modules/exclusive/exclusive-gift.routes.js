"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExclusiveGiftRoutes = void 0;
const express_1 = require("express");
const validateRequest_1 = __importDefault(require("../../utils/validateRequest"));
const exclusive_gift_dto_1 = require("./exclusive-gift.dto");
const exclusive_gift_controller_1 = require("./exclusive-gift.controller");
const router = (0, express_1.Router)();
router.post('/confirm', (0, validateRequest_1.default)(exclusive_gift_dto_1.exclusiveGiftDto), exclusive_gift_controller_1.exclusiveGiftController.confirmGift);
router.get('/confirm', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Exclusive gift confirmation endpoint is active. Use POST method to submit data.',
        endpoint: 'POST /api/v1/exclusive-gift/confirm',
        required_fields: ['name', 'phone', 'whatsapp', 'email', 'batchId'],
    });
});
exports.ExclusiveGiftRoutes = router;

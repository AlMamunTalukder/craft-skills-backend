"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exclusiveGiftController = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const exclusive_gift_service_1 = require("./exclusive-gift.service");
exports.exclusiveGiftController = {
    confirmGift: (0, catchAsync_1.default)(async (req, res) => {
        const result = await exclusive_gift_service_1.exclusiveGiftService.confirmGift(req.body);
        res.status(201).json({
            success: true,
            message: result.message,
            data: result.confirmation,
        });
    }),
};

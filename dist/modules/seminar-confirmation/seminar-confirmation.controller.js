"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seminarConfirmationController = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const seminar_confirmation_service_1 = require("./seminar-confirmation.service");
exports.seminarConfirmationController = {
    confirmParticipation: (0, catchAsync_1.default)(async (req, res) => {
        const result = await seminar_confirmation_service_1.seminarConfirmationService.confirmParticipation(req.body);
        res.status(201).json({
            success: true,
            message: result.message,
            data: result.confirmation,
        });
    }),
};

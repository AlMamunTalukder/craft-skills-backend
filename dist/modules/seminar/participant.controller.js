"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.participantController = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const participant_service_1 = require("./participant.service");
exports.participantController = {
    register: (0, catchAsync_1.default)(async (req, res) => {
        const result = await participant_service_1.participantService.registerParticipant(req.body);
        res.status(201).json({
            success: true,
            message: result.message,
            data: result.participant,
        });
    }),
};

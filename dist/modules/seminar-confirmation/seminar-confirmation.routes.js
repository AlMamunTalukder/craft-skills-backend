"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeminarConfirmationRoutes = void 0;
// src/modules/seminar-confirmation/seminar-confirmation.routes.ts
const express_1 = require("express");
const validateRequest_1 = __importDefault(require("../../utils/validateRequest"));
const seminar_confirmation_dto_1 = require("./seminar-confirmation.dto");
const seminar_confirmation_controller_1 = require("./seminar-confirmation.controller");
const router = (0, express_1.Router)();
router.post('/confirm', (0, validateRequest_1.default)(seminar_confirmation_dto_1.seminarConfirmationDto), seminar_confirmation_controller_1.seminarConfirmationController.confirmParticipation);
router.get('/confirm', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Seminar confirmation endpoint is active. Use POST method to submit data.',
        endpoint: 'POST /api/v1/seminar-confirmations/confirm',
        required_fields: ['name', 'phone', 'whatsapp', 'email', 'seminarId'],
    });
});
exports.SeminarConfirmationRoutes = router;

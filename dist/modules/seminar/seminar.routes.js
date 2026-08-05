"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeminarRoutes = void 0;
// server/routes/seminar.routes.ts
const express_1 = require("express");
const seminar_dto_1 = require("./seminar.dto");
const seminar_controller_1 = require("./seminar.controller");
const validateRequest_1 = __importDefault(require("../../utils/validateRequest"));
const participant_controller_1 = require("./participant.controller");
const seminar_confirmation_dto_1 = require("../seminar-confirmation/seminar-confirmation.dto");
const seminar_confirmation_controller_1 = require("../seminar-confirmation/seminar-confirmation.controller");
const router = (0, express_1.Router)();
// Public routes (no auth)
router.post('/register', (0, validateRequest_1.default)(seminar_dto_1.registerParticipantDto), participant_controller_1.participantController.register);
router.post('/confirm', (0, validateRequest_1.default)(seminar_confirmation_dto_1.seminarConfirmationDto), seminar_confirmation_controller_1.seminarConfirmationController.confirmParticipation);
// GET routes – specific ones BEFORE dynamic
router.get('/', seminar_controller_1.seminarController.getAllSeminars);
router.get('/active', seminar_controller_1.seminarController.getActiveSeminar);
router.get('/pdf-seminar', seminar_controller_1.seminarController.getPdfSeminar);
// Dynamic routes (must be LAST)
router.get('/:id', seminar_controller_1.seminarController.getSeminarById);
// Admin routes (with auth if needed)
router.post('/', (0, validateRequest_1.default)(seminar_dto_1.createSeminarDto), seminar_controller_1.seminarController.createSeminar);
router.put('/:id', (0, validateRequest_1.default)(seminar_dto_1.updateSeminarDto), seminar_controller_1.seminarController.updateSeminar);
router.put('/:id/status', seminar_controller_1.seminarController.changeStatus);
router.delete('/:id', seminar_controller_1.seminarController.deleteSeminar);
exports.SeminarRoutes = router;

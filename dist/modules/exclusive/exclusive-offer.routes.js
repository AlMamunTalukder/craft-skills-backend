"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExclusiveOfferRoutes = void 0;
const express_1 = require("express");
const validateRequest_1 = __importDefault(require("../../utils/validateRequest"));
const auth_1 = require("../../middleware/auth");
const rateLimiter_1 = require("../../utils/rateLimiter");
const exclusive_offer_controller_1 = require("./exclusive-offer.controller");
const exclusive_offer_dto_1 = require("./exclusive-offer.dto");
const router = (0, express_1.Router)();
// Rate limits (fail-open via Redis) — protect the expensive public endpoints
// from floods that spawn DB writes + external SSLCommerz calls.
const registerLimiter = (0, rateLimiter_1.rateLimiter)({
    windowMs: 60 * 1000,
    max: 10,
    keyPrefix: 'exclusive:register',
});
const paymentLimiter = (0, rateLimiter_1.rateLimiter)({
    windowMs: 60 * 1000,
    max: 60,
    keyPrefix: 'exclusive:payment',
});
const ipnLimiter = (0, rateLimiter_1.rateLimiter)({
    windowMs: 60 * 1000,
    max: 300,
    keyPrefix: 'exclusive:ipn',
});
// Public routes
router.post('/register', registerLimiter, (0, validateRequest_1.default)(exclusive_offer_dto_1.registerExclusiveOfferDto), exclusive_offer_controller_1.exclusiveOfferController.register);
router.post('/payment-success', paymentLimiter, exclusive_offer_controller_1.exclusiveOfferController.paymentSuccess);
router.post('/payment-fail', paymentLimiter, exclusive_offer_controller_1.exclusiveOfferController.paymentFail);
router.post('/payment-cancel', paymentLimiter, exclusive_offer_controller_1.exclusiveOfferController.paymentCancel);
router.post('/ipn', ipnLimiter, exclusive_offer_controller_1.exclusiveOfferController.ipn);
router.get('/verify-payment', paymentLimiter, exclusive_offer_controller_1.exclusiveOfferController.verifyPayment);
// 🔐 Admin routes - Participants CRUD (Protected)
// Note: These are mounted at /api/v1/exclusive-offer/participants
router.get('/participants', (0, auth_1.auth)(['admin']), exclusive_offer_controller_1.exclusiveOfferController.getParticipants);
router.get('/participants/:id', (0, auth_1.auth)(['admin']), exclusive_offer_controller_1.exclusiveOfferController.getParticipantById);
router.post('/participants', (0, auth_1.auth)(['admin']), (0, validateRequest_1.default)(exclusive_offer_dto_1.createParticipantAdminDto), exclusive_offer_controller_1.exclusiveOfferController.createParticipant);
router.put('/participants/:id', (0, auth_1.auth)(['admin']), (0, validateRequest_1.default)(exclusive_offer_dto_1.updateParticipantAdminDto), exclusive_offer_controller_1.exclusiveOfferController.updateParticipant);
router.delete('/participants/:id', (0, auth_1.auth)(['admin']), exclusive_offer_controller_1.exclusiveOfferController.deleteParticipant);
exports.ExclusiveOfferRoutes = router;

import { Router } from 'express';
import validateRequest from 'src/utils/validateRequest';
import { auth } from 'src/middleware/auth';
import { rateLimiter } from 'src/utils/rateLimiter';
import { exclusiveOfferController } from './exclusive-offer.controller';
import {
    registerExclusiveOfferDto,
    createParticipantAdminDto,
    updateParticipantAdminDto,
} from './exclusive-offer.dto';

const router = Router();

// Rate limits (fail-open via Redis) — protect the expensive public endpoints
// from floods that spawn DB writes + external SSLCommerz calls.
const registerLimiter = rateLimiter({
    windowMs: 60 * 1000,
    max: 10,
    keyPrefix: 'exclusive:register',
});
const paymentLimiter = rateLimiter({
    windowMs: 60 * 1000,
    max: 60,
    keyPrefix: 'exclusive:payment',
});
const ipnLimiter = rateLimiter({
    windowMs: 60 * 1000,
    max: 300,
    keyPrefix: 'exclusive:ipn',
});

// Public routes
router.post(
    '/register',
    registerLimiter,
    validateRequest(registerExclusiveOfferDto),
    exclusiveOfferController.register,
);

router.post('/payment-success', paymentLimiter, exclusiveOfferController.paymentSuccess);
router.post('/payment-fail', paymentLimiter, exclusiveOfferController.paymentFail);
router.post('/payment-cancel', paymentLimiter, exclusiveOfferController.paymentCancel);
router.post('/ipn', ipnLimiter, exclusiveOfferController.ipn);
router.get('/verify-payment', paymentLimiter, exclusiveOfferController.verifyPayment);

// 🔐 Admin routes - Participants CRUD (Protected)
// Note: These are mounted at /api/v1/exclusive-offer/participants
router.get('/participants', auth(['admin']), exclusiveOfferController.getParticipants);
router.get('/participants/:id', auth(['admin']), exclusiveOfferController.getParticipantById);
router.post(
    '/participants',
    auth(['admin']),
    validateRequest(createParticipantAdminDto),
    exclusiveOfferController.createParticipant,
);
router.put(
    '/participants/:id',
    auth(['admin']),
    validateRequest(updateParticipantAdminDto),
    exclusiveOfferController.updateParticipant,
);
router.delete('/participants/:id', auth(['admin']), exclusiveOfferController.deleteParticipant);

export const ExclusiveOfferRoutes = router;

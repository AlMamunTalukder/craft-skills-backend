import { Router } from 'express';
import validateRequest from 'src/utils/validateRequest';
import { exclusiveOfferController } from './exclusive-offer.controller';
import { registerExclusiveOfferDto } from './exclusive-offer.dto';

const router = Router();

// Public routes
router.post(
    '/register',
    validateRequest(registerExclusiveOfferDto),
    exclusiveOfferController.register,
);

router.post('/payment-success', exclusiveOfferController.paymentSuccess);
router.post('/payment-fail', exclusiveOfferController.paymentFail);
router.post('/payment-cancel', exclusiveOfferController.paymentCancel);
router.post('/ipn', exclusiveOfferController.ipn);
router.get('/verify-payment', exclusiveOfferController.verifyPayment);

// ✅ Admin routes - Participants CRUD
// Note: These are mounted at /api/v1/exclusive-offer/participants
router.get('/participants', exclusiveOfferController.getParticipants);
router.get('/participants/:id', exclusiveOfferController.getParticipantById);
router.post('/participants', exclusiveOfferController.createParticipant);
router.put('/participants/:id', exclusiveOfferController.updateParticipant);
router.delete('/participants/:id', exclusiveOfferController.deleteParticipant);

// ✅ Price settings routes
router.get('/price', exclusiveOfferController.getPrice);
router.put('/price', exclusiveOfferController.updatePrice);

export const ExclusiveOfferRoutes = router;

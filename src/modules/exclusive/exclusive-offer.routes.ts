// ============================================
// server/modules/exclusive-offer/exclusive-offer.routes.ts
// ============================================

import { Router } from 'express';

import validateRequest from 'src/utils/validateRequest';

import { exclusiveOfferController } from './exclusive-offer.controller';

import { registerExclusiveOfferDto } from './exclusive-offer.dto';

const router = Router();

router.post(
    '/register',
    validateRequest(registerExclusiveOfferDto),
    exclusiveOfferController.register,
);

export const ExclusiveOfferRoutes = router;

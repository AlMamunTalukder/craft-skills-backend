import { Router } from 'express';
// import { exclusiveOfferSettingsController } from './exclusive-offer-settings.controller';
// import { isAuthenticated, isAdmin } from 'src/middlewares/auth';

const router = Router();

// Public route – anyone can read settings
// router.get('/exclusive-offer/settings', exclusiveOfferSettingsController.getSettings);

// Admin only – update settings
// router.put(
//     '/admin/exclusive-offer/settings',
//     isAuthenticated,
//     isAdmin,
//     exclusiveOfferSettingsController.updateSettings,
// );

export const ExclusiveOfferSettingsRoutes = router;

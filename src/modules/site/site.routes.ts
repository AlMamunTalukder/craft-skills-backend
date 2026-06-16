import { Router } from 'express';
import { siteController } from './site.controller';
import validateRequest from 'src/utils/validateRequest';
import { siteDto } from './site.dto';
import { auth } from 'src/middleware/auth';
import { menuSettingsDto } from './menu-settings.dto';

const siteRoutes = Router();

siteRoutes.get('/', siteController.getSiteData);
siteRoutes.put('/', auth(['admin']), validateRequest(siteDto), siteController.updateSiteData);

// ✅ Make sure this route exists and is correctly defined
siteRoutes.put(
    '/menu-settings',
    auth(['admin']),
    validateRequest(menuSettingsDto),
    siteController.updateMenuSettings,
);

export default siteRoutes;

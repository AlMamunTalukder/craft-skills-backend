import { Router } from 'express';
import { siteController } from './site.controller';
import validateRequest from 'src/utils/validateRequest';
import { siteDto } from './site.dto';
import { auth } from 'src/middleware/auth';
import { menuSettingsDto } from './menu-settings.dto';
import siteService from './site.service';

const siteRoutes = Router();

siteRoutes.get('/', siteController.getSiteData);
siteRoutes.put('/', auth(['admin']), validateRequest(siteDto), siteController.updateSiteData);
siteRoutes.put(
    '/menu-settings',
    auth(['admin']),
    validateRequest(menuSettingsDto),
    siteController.updateMenuSettings,
);

// ✅ Add route to clear cache (admin only)
siteRoutes.post('/clear-cache', auth(['admin']), async (req, res) => {
    await siteService.clearCache();
    res.json({ success: true, message: 'Cache cleared successfully' });
});

export default siteRoutes;

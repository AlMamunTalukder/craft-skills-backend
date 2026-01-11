import { Router } from 'express';
import { siteController } from './site.controller';
import validateRequest from 'src/utils/validateRequest';
import { siteDto } from './site.dto';
import { auth } from 'src/middleware/auth';
import { pdfSettingsDto } from './pdf-settings.dto';


const siteRoutes = Router();

siteRoutes.get('/', siteController.getSiteData);
siteRoutes.put('/', auth(['admin']), validateRequest(siteDto), siteController.updateSiteData);
siteRoutes.put(
    '/pdf-settings',
    auth(['admin']),
    validateRequest(pdfSettingsDto),
    siteController.updatePdfSettings
);
export default siteRoutes;

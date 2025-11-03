import { Router } from 'express';
import { siteController } from './site.controller';
import validateRequest from 'src/utils/validateRequest';
import { siteDto } from './site.dto';
import { auth } from 'src/middleware/auth';

const siteRoutes = Router();

siteRoutes.get('/', siteController.getSiteData);
siteRoutes.put('/', auth(['admin']), validateRequest(siteDto), siteController.updateSiteData);

export default siteRoutes;

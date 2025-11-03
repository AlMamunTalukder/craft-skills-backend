import { Router } from 'express';
import authRoutes from 'src/modules/auth/auth.routes';
import galleryRoutes from 'src/modules/gallery/gallery.routes';
import siteRoutes from 'src/modules/site/site.routes';
import userRoutes from 'src/modules/user/user.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/site', siteRoutes);
router.use('/gallery', galleryRoutes);

export default router;

import { Router } from 'express';
import AuthRoutes from '../modules/auth/auth.routes';
import GalleryRoutes from '../modules/gallery/gallery.routes';
import { SeminarRoutes } from '../modules/seminar/seminar.routes';
import SiteRoutes from '../modules/site/site.routes';
import UserRoutes from '../modules/user/user.routes';

const router = Router();

const moduleRoutes = [
    {
        path: '/auth',
        route: AuthRoutes,
    },
    {
        path: '/users',
        route: UserRoutes,
    },
    {
        path: '/site',
        route: SiteRoutes,
    },
    {
        path: '/gallery',
        route: GalleryRoutes,
    },
    {
        path: '/seminars',
        route: SeminarRoutes,
    },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;

import { Router } from 'express';
import AuthRoutes from '../modules/auth/auth.routes';
import GalleryRoutes from '../modules/gallery/gallery.routes';
import { SeminarRoutes } from '../modules/seminar/seminar.routes';
import SiteRoutes from '../modules/site/site.routes';
import UserRoutes from '../modules/user/user.routes';
import uploadRoutes from '../modules/upload/upload.routes';
import Schedulerouter from 'src/modules/schedule/schedule.routes';
import { courseBatchRoutes } from 'src/modules/coursebatch/coursebatch.routes';

const router = Router();

// Debug route to see all registered routes
router.get('/debug-routes', (req, res) => {
    const allRoutes = [
        { path: '/auth', methods: ['POST'] },
        { path: '/users', methods: ['GET', 'POST'] },
        { path: '/site', methods: ['GET', 'PUT'] },
        { path: '/class-schedule', methods: ['GET', 'PUT'] },
        { path: '/gallery', methods: ['GET', 'POST'] },
        { path: '/seminars', methods: ['GET', 'POST'] },
        { path: '/upload', methods: ['POST'] },
    ];

    res.json({
        message: 'Registered routes',
        routes: allRoutes.map((route) => ({
            fullPath: `/api/v1${route.path}`,
            methods: route.methods,
        })),
    });
});

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
        path: '/class-schedule',
        route: Schedulerouter,
    },
    {
        path: '/gallery',
        route: GalleryRoutes,
    },
    {
        path: '/seminars',
        route: SeminarRoutes,
    },
    {
        path: '/course-batches',
        route: courseBatchRoutes,
    },
    {
        path: '/upload',
        route: uploadRoutes,
    },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;

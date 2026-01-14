// import type { Application, Request, Response } from 'express';
// import express from 'express';
// import routes from '@/routes/index';
// import logger from '@/shared/logger';
// import requestLogger from '@/shared/requestLogger';
// import errorHandler from '@/shared/errorHandler';
// import setupGlobalErrorHandlers from '@/shared/globalErrorHandlers';
// import connectDB from '@/shared/db';
// import config from '@/config/index';
// import morgan from 'morgan';
// import cors from 'cors';
// import session from 'express-session';
// import passport from 'passport';
// import notFound from '@/routes/notFound';
// import MongoStore from 'connect-mongo';
// import { connectRedis } from '@/config/redis';
// import '@/workers/participant.worker';
// import '@/workers/admission.worker';
// import '@/workers/seminar-confirmation.worker';

// setupGlobalErrorHandlers();

// const app: Application = express();

// app.use(morgan('dev'));
// app.use(
//     cors({
//         origin: [
//             'http://localhost:3000',
//             'http://localhost:5173',
//             'https://client.craftskillsbd.com',
//             'https://craftskillsbd.com',
//             'https://admin.craftskillsbd.com',
//         ],
//         methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//         credentials: true,
//     }),
// );
// app.use(requestLogger);
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.use(
//     session({
//         secret: config.sessionSecret,
//         resave: false,
//         saveUninitialized: false,
//         store: MongoStore.create({ mongoUrl: config.databaseUrl }),
//         cookie: {
//             httpOnly: true,
//             secure: config.env === 'production',
//             sameSite: 'lax', // 🔥 REQUIRED
//             maxAge: 24 * 60 * 60 * 1000,
//         },
//     }),
// );

// app.use(passport.initialize());
// app.use(passport.session());

// app.use('/api/v1', routes);

// app.get('/', (req: Request, res: Response) => {
//     res.send('Hello, world!');
// });

// app.use('/health', (req: Request, res: Response) => {
//     res.status(200).send('OK');
// });

// app.use(notFound);

// app.use(errorHandler);

// async function bootstrap(): Promise<void> {
//     await connectDB();
//     await connectRedis();
//     app.listen(config.port, () => {
//         logger.info(`Server is running on port ${config.port}`);
//     });
// }

// bootstrap();
import type { Application, Request, Response } from 'express';
import express from 'express';
import routes from '@/routes/index';
import logger from '@/shared/logger';
import requestLogger from '@/shared/requestLogger';
import errorHandler from '@/shared/errorHandler';
import setupGlobalErrorHandlers from '@/shared/globalErrorHandlers';
import connectDB from '@/shared/db';
import config from '@/config/index';
import morgan from 'morgan';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import notFound from '@/routes/notFound';
import MongoStore from 'connect-mongo';
import { connectRedis } from '@/config/redis';
import '@/workers/participant.worker';
import '@/workers/admission.worker';
import '@/workers/seminar-confirmation.worker';

setupGlobalErrorHandlers();

const app: Application = express();

app.use(morgan('dev'));

// Enhanced CORS configuration
app.use(
    cors({
        origin: [
            'http://localhost:3000',
            'http://localhost:5173',
            'https://client.craftskillsbd.com',
            'https://craftskillsbd.com',
            'https://www.craftskillsbd.com',
            'https://admin.craftskillsbd.com',
        ],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
        exposedHeaders: ['set-cookie'],
    }),
);

app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enhanced session configuration
app.use(
    session({
        secret: config.sessionSecret,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ mongoUrl: config.databaseUrl, ttl: 24 * 60 * 60 }),
        name: 'craftskills.session',
        cookie: {
            httpOnly: true,
            secure: config.env === 'production',
            sameSite: config.env === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000,
            domain: config.env === 'production' ? '.craftskillsbd.com' : undefined,
            path: '/',
        },
        proxy: config.env === 'production', // trust X-Forwarded-For headers
    }),
);

// Trust proxy in production
if (config.env === 'production') {
    app.set('trust proxy', 1);
}

app.use(passport.initialize());
app.use(passport.session());

// Add middleware to log session info (for debugging)
// app.use((req, res, next) => {
//     if (req.path.includes('/api/v1') && !req.path.includes('health')) {
//         logger.info('Session Debug:', {
//             path: req.path,
//             sessionId: req.sessionID,
//             authenticated: req.isAuthenticated ? req.isAuthenticated() : false,
//             user: req.user ? { id: req.user._id, role: req.user.role } : null,
//             cookie: req.headers.cookie ? 'present' : 'missing'
//         });
//     }
//     next();
// });

app.use('/api/v1', routes);

// Add debug endpoint
app.get('/api/v1/debug/session', (req, res) => {
    res.json({
        sessionId: req.sessionID,
        authenticated: req.isAuthenticated ? req.isAuthenticated() : false,
        user: req.user || null,
        cookie: req.headers.cookie,
        env: config.env,
        timestamp: new Date().toISOString(),
    });
});

app.get('/', (req: Request, res: Response) => {
    res.send('Hello, world!');
});

app.use('/health', (req: Request, res: Response) => {
    res.status(200).send('OK');
});

app.use(notFound);

app.use(errorHandler);

async function bootstrap(): Promise<void> {
    await connectDB();
    await connectRedis();
    app.listen(config.port, () => {
        logger.info(`Server is running on port ${config.port} in ${config.env} mode`);
    });
}

bootstrap();

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

setupGlobalErrorHandlers();

const app: Application = express();

app.use(morgan('dev'));
app.use(
    cors({
        origin: ['http://localhost:3000', 'http://localhost:5173'],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    }),
);
app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: config.sessionSecret,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ mongoUrl: config.databaseUrl }),
        cookie: {
            httpOnly: true,
            secure: config.env === 'production',
            sameSite: 'lax', // 🔥 REQUIRED
            maxAge: 24 * 60 * 60 * 1000,
        },
    }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use('/api/v1', routes);

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
        logger.info(`Server is running on port ${config.port}`);
    });
}

bootstrap();

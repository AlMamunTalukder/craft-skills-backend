import type { Application, Request, Response } from 'express';
import express from 'express';
import routes from '@/routes/index';
import logger from '@/shared/logger';
import requestLogger from '@/shared/requestLogger';
import errorHandler from '@/shared/errorHandler';
import setupGlobalErrorHandlers from '@/shared/globalErrorHandlers';
import connectDB from '@/shared/db';
import config from '@/config/index';

setupGlobalErrorHandlers();

const app: Application = express();

async function bootstrap(): Promise<void> {
    await connectDB();
    app.listen(config.port, () => {
        logger.info(`Server is running on port ${config.port}`);
    });
}

bootstrap();

app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1', routes);

app.get('/', (req: Request, res: Response) => {
    res.send('Hello, world!');
});

app.use(errorHandler);

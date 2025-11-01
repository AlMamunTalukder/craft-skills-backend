import type { Request, Response, NextFunction } from 'express';
import logger from './logger';

interface AppError extends Error {
    statusCode?: number;
}

const errorHandler = (
    err: AppError,
    req: Request,
    res: Response,
    // eslint-disable-next-line no-unused-vars
    next: NextFunction,
): void => {
    logger.error(err.stack);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Something went wrong';

    res.status(statusCode).json({
        success: false,
        message,
    });
};

export default errorHandler;

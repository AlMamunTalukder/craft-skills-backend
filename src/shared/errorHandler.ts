import config from '@/config/index';
import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import httpStatus from 'http-status';
import handleZodError from 'src/errors/handleZodError';
import { ZodError } from 'zod';

const errorHandler: ErrorRequestHandler = (
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction,
) => {
    const statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    const success = false;
    let message = err.message || 'Something went wrong!';
    let errors = err as any;

    if (err instanceof ZodError) {
        message = 'Please provide valid data!';
        errors = handleZodError(err);
    } else if (err.code === 11000) {
        message = 'Duplicate field value entered';
        errors = {
            [Object.keys(err.keyValue)[0]]: `${Object.keys(err.keyValue)[0]} already exists`,
        };
    } else if (err?.name === 'ValidationError') {
        message = 'Please provide valid data!';
        errors = err.errors;
    } else if (err?.name === 'CastError') {
        message = `Resource not found with id of ${err.value}`;
        errors = {};
    }

    return res.status(statusCode).json({
        success,
        message,
        errors,
        stack: config.env === 'development' ? err?.stack : null,
    });
};

export default errorHandler;

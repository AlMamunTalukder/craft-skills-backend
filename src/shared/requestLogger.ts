import type { Request, Response, NextFunction } from 'express';
import logger from './logger';

const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    logger.info(`${req.method} ${req.url}`);
    next();
};

export default requestLogger;

import type { Request, Response, NextFunction } from 'express';
import redisClient from 'src/config/redis';

interface RateLimitOptions {
    windowMs: number;
    max: number;
    keyPrefix?: string;
}

const isRedisReady = (): boolean => {
    try {
        return redisClient !== undefined && redisClient.isReady === true;
    } catch {
        return false;
    }
};

/**
 * Redis-backed fixed-window rate limiter.
 * - Keys auto-expire after the window, so memory stays bounded under high traffic.
 * - Fail-open: if Redis is unavailable, requests are allowed so the live site never breaks.
 */
export const rateLimiter = (options: RateLimitOptions) => {
    const windowSec = Math.max(1, Math.floor(options.windowMs / 1000));
    const prefix = options.keyPrefix || 'rl';

    return async (req: Request, res: Response, next: NextFunction) => {
        if (!isRedisReady()) {
            return next();
        }

        const forwarded = req.headers['x-forwarded-for'] as string | undefined;
        const ip =
            forwarded?.split(',')[0]?.trim() ||
            req.ip ||
            req.socket.remoteAddress ||
            'unknown';
        const key = `${prefix}:${ip}`;

        try {
            const count = await redisClient.incr(key);
            if (count === 1) {
                await redisClient.expire(key, windowSec);
            }

            if (count > options.max) {
                res.setHeader('Retry-After', String(windowSec));
                return res.status(429).json({
                    success: false,
                    message: 'Too many requests. Please try again later.',
                });
            }

            return next();
        } catch {
            return next();
        }
    };
};

export const visitorStatusLimiter = rateLimiter({
    windowMs: 60 * 1000,
    max: 60,
    keyPrefix: 'exclusive:visitor-status',
});

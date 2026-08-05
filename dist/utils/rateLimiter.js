"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.visitorStatusLimiter = exports.rateLimiter = void 0;
const redis_1 = __importDefault(require("../config/redis"));
const isRedisReady = () => {
    try {
        return redis_1.default !== undefined && redis_1.default.isReady === true;
    }
    catch {
        return false;
    }
};
/**
 * Redis-backed fixed-window rate limiter.
 * - Keys auto-expire after the window, so memory stays bounded under high traffic.
 * - Fail-open: if Redis is unavailable, requests are allowed so the live site never breaks.
 */
const rateLimiter = (options) => {
    const windowSec = Math.max(1, Math.floor(options.windowMs / 1000));
    const prefix = options.keyPrefix || 'rl';
    return async (req, res, next) => {
        if (!isRedisReady()) {
            return next();
        }
        const forwarded = req.headers['x-forwarded-for'];
        const ip = forwarded?.split(',')[0]?.trim() ||
            req.ip ||
            req.socket.remoteAddress ||
            'unknown';
        const key = `${prefix}:${ip}`;
        try {
            const count = await redis_1.default.incr(key);
            if (count === 1) {
                await redis_1.default.expire(key, windowSec);
            }
            if (count > options.max) {
                res.setHeader('Retry-After', String(windowSec));
                return res.status(429).json({
                    success: false,
                    message: 'Too many requests. Please try again later.',
                });
            }
            return next();
        }
        catch {
            return next();
        }
    };
};
exports.rateLimiter = rateLimiter;
exports.visitorStatusLimiter = (0, exports.rateLimiter)({
    windowMs: 60 * 1000,
    max: 60,
    keyPrefix: 'exclusive:visitor-status',
});

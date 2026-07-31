import type { Request, Response, NextFunction } from 'express';
import config from 'src/config';

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const allowedOrigins = new Set([...config.corsOrigins, 'https://server.craftskillsbd.com']);

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
    if (!unsafeMethods.has(req.method) || !req.cookies?.['craftskills.session']) {
        return next();
    }

    const origin = req.get('origin');
    if (origin && !allowedOrigins.has(origin)) {
        return res.status(403).json({ message: 'Invalid request origin' });
    }

    return next();
}

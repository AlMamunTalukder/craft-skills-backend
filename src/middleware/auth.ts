import type { Request, Response, NextFunction } from 'express';
import type { IUser } from 'src/modules/user/user.interface';

export function auth(roles: string[] = []) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.isAuthenticated || !req.isAuthenticated()) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (roles.length === 0) {
            return next();
        }

        const userRole = (req.user as IUser)?.role;

        if (!roles.includes(userRole)) {
            return res.status(403).json({ message: 'Access denied: insufficient role' });
        }

        next();
    };
}

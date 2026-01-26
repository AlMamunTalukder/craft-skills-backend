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

        const user = req.user as IUser;
        if (!roles.includes(user.role)) {
            return res.status(403).json({
                message: 'Access denied: insufficient role',
                userRole: user.role,
                requiredRoles: roles,
            });
        }

        next();
    };
}

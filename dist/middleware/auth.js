"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = auth;
function auth(roles = []) {
    return (req, res, next) => {
        if (!req.isAuthenticated || !req.isAuthenticated()) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (roles.length === 0) {
            return next();
        }
        const user = req.user;
        if (!user || user.status !== 'active') {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (!roles.includes(user.role)) {
            return res.status(403).json({
                message: 'Access denied: insufficient role',
            });
        }
        next();
    };
}

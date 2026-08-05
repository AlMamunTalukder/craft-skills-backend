"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.csrfProtection = csrfProtection;
const config_1 = __importDefault(require("../config"));
const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const allowedOrigins = new Set([...config_1.default.corsOrigins, 'https://server.craftskillsbd.com']);
function csrfProtection(req, res, next) {
    if (!unsafeMethods.has(req.method) || !req.cookies?.['craftskills.session']) {
        return next();
    }
    const origin = req.get('origin');
    if (origin && !allowedOrigins.has(origin)) {
        return res.status(403).json({ message: 'Invalid request origin' });
    }
    return next();
}

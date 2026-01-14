"use strict";
// import type { Application, Request, Response } from 'express';
// import express from 'express';
// import routes from './routes/index';
// import logger from './shared/logger';
// import requestLogger from './shared/requestLogger';
// import errorHandler from './shared/errorHandler';
// import setupGlobalErrorHandlers from './shared/globalErrorHandlers';
// import connectDB from './shared/db';
// import config from './config/index';
// import morgan from 'morgan';
// import cors from 'cors';
// import session from 'express-session';
// import passport from 'passport';
// import notFound from './routes/notFound';
// import MongoStore from 'connect-mongo';
// import { connectRedis } from './config/redis';
// import './workers/participant.worker';
// import './workers/admission.worker';
// import './workers/seminar-confirmation.worker';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const index_1 = __importDefault(require("./routes/index"));
const logger_1 = __importDefault(require("./shared/logger"));
const requestLogger_1 = __importDefault(require("./shared/requestLogger"));
const errorHandler_1 = __importDefault(require("./shared/errorHandler"));
const globalErrorHandlers_1 = __importDefault(require("./shared/globalErrorHandlers"));
const db_1 = __importDefault(require("./shared/db"));
const index_2 = __importDefault(require("./config/index"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
const notFound_1 = __importDefault(require("./routes/notFound"));
const connect_mongo_1 = __importDefault(require("connect-mongo"));
const redis_1 = require("./config/redis");
require("./workers/participant.worker");
require("./workers/admission.worker");
require("./workers/seminar-confirmation.worker");
(0, globalErrorHandlers_1.default)();
const app = (0, express_1.default)();
app.use((0, morgan_1.default)('dev'));
// Enhanced CORS configuration
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://client.craftskillsbd.com',
        'https://craftskillsbd.com',
        'https://www.craftskillsbd.com',
        'https://admin.craftskillsbd.com',
    ],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
    exposedHeaders: ['set-cookie'],
}));
app.use(requestLogger_1.default);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Enhanced session configuration
app.use((0, express_session_1.default)({
    secret: index_2.default.sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: connect_mongo_1.default.create({
        mongoUrl: index_2.default.databaseUrl,
        ttl: 24 * 60 * 60, // 24 hours
    }),
    name: 'craftskills.session', // Custom session cookie name
    cookie: {
        httpOnly: true,
        secure: index_2.default.env === 'production',
        sameSite: index_2.default.env === 'production' ? 'none' : 'lax', // 🔥 REQUIRED
        maxAge: 24 * 60 * 60 * 1000,
        domain: index_2.default.env === 'production' ? '.craftskillsbd.com' : undefined, // Important for subdomains
        path: '/',
    },
    proxy: index_2.default.env === 'production', // Trust proxy in production
}));
// Trust proxy in production
if (index_2.default.env === 'production') {
    app.set('trust proxy', 1);
}
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// Add middleware to log session info (for debugging)
// app.use((req, res, next) => {
//     if (req.path.includes('/api/v1') && !req.path.includes('health')) {
//         logger.info('Session Debug:', {
//             path: req.path,
//             sessionId: req.sessionID,
//             authenticated: req.isAuthenticated ? req.isAuthenticated() : false,
//             user: req.user ? { id: req.user._id, role: req.user.role } : null,
//             cookie: req.headers.cookie ? 'present' : 'missing'
//         });
//     }
//     next();
// });
app.use('/api/v1', index_1.default);
// Add debug endpoint
app.get('/api/v1/debug/session', (req, res) => {
    res.json({
        sessionId: req.sessionID,
        authenticated: req.isAuthenticated ? req.isAuthenticated() : false,
        user: req.user || null,
        cookie: req.headers.cookie,
        env: index_2.default.env,
        timestamp: new Date().toISOString(),
    });
});
app.get('/', (req, res) => {
    res.send('Hello, world!');
});
app.use('/health', (req, res) => {
    res.status(200).send('OK');
});
app.use(notFound_1.default);
app.use(errorHandler_1.default);
async function bootstrap() {
    await (0, db_1.default)();
    await (0, redis_1.connectRedis)();
    app.listen(index_2.default.port, () => {
        logger_1.default.info(`Server is running on port ${index_2.default.port} in ${index_2.default.env} mode`);
    });
}
bootstrap();

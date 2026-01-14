"use strict";
// import * as dotenv from 'dotenv';
// import path from 'path';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// dotenv.config({ path: path.join(process.cwd(), '.env') });
// export default {
//     port: process.env.PORT || 5000,
//     databaseUrl: process.env.DATABASE_URL || 'mongodb://localhost:27017/craft-skills',
//     sessionSecret: process.env.SESSION_SECRET || 'default-secret',
//     env: process.env.NODE_ENV || 'development',
//     redisHost: process.env.REDIS_HOST || 'redis://localhost:6379',
//     // Use the SAME names as your .env file
//     CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
//     CLOUDINARY_CLOUD_KEY: process.env.CLOUDINARY_CLOUD_KEY || '',
//     CLOUDINARY_CLOUD_SECRET: process.env.CLOUDINARY_CLOUD_SECRET || '',
//     GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
//     GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY
//         ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
//         : '',
//     GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID || '',
// };
// src/config/index.ts - UPDATED VERSION
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv.config({ path: path_1.default.join(process.cwd(), '.env') });
const isProduction = process.env.NODE_ENV === 'production';
exports.default = {
    port: process.env.PORT || 5000,
    databaseUrl: process.env.DATABASE_URL || 'mongodb://localhost:27017/craft-skills',
    sessionSecret: process.env.SESSION_SECRET || 'default-secret',
    env: process.env.NODE_ENV || 'development',
    redisHost: process.env.REDIS_HOST || 'redis://localhost:6379',
    // Cloudinary
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
    CLOUDINARY_CLOUD_KEY: process.env.CLOUDINARY_CLOUD_KEY || '',
    CLOUDINARY_CLOUD_SECRET: process.env.CLOUDINARY_CLOUD_SECRET || '',
    // Google Sheets
    GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY
        ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : '',
    GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID || '',
    // ========== NEW CONFIGURATIONS ==========
    // CORS Origins
    corsOrigins: isProduction
        ? [
            'https://client.craftskillsbd.com',
            'https://craftskillsbd.com',
            'https://www.craftskillsbd.com',
            'https://admin.craftskillsbd.com',
            'http://client.craftskillsbd.com', // Fallback HTTP
            'http://craftskillsbd.com', // Fallback HTTP
        ]
        : [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:5000',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5173',
        ],
    // Cookie Settings
    cookieSettings: {
        httpOnly: true,
        secure: isProduction, // true in production, false in development
        sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-domain in production
        domain: isProduction ? '.craftskillsbd.com' : undefined, // Allow all subdomains
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/',
    },
    // Frontend URL for redirects
    frontendUrl: isProduction ? 'https://client.craftskillsbd.com' : 'http://localhost:3000',
    // API URL
    apiUrl: isProduction
        ? 'https://server.craftskillsbd.com/api/v1'
        : 'http://localhost:5000/api/v1',
    // Trust proxy (important for production behind load balancer)
    trustProxy: isProduction,
};

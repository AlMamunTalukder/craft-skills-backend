import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const isProduction = process.env.NODE_ENV === 'production';

export default {
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

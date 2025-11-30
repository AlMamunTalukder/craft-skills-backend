// import * as dotenv from 'dotenv';
// import path from 'path';

// dotenv.config({ path: path.join(process.cwd(), '.env') });

// export default {
//     port: process.env.PORT || 5000,
//     databaseUrl: process.env.DATABASE_URL || 'mongodb://localhost:27017/craft-skills',
//     sessionSecret: process.env.SESSION_SECRET || 'default-secret',
//     env: process.env.NODE_ENV || 'development',
//     redisHost: process.env.REDIS_HOST || 'redis://localhost:6379',
//     CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
//     CLOUDINARY_CLOUD_KEY: process.env.CLOUDINARY_CLOUD_KEY || '',
//     CLOUDINARY_CLOUD_SECRET: process.env.CLOUDINARY_CLOUD_SECRET || '',
// };

import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
    port: process.env.PORT || 5000,
    databaseUrl: process.env.DATABASE_URL || 'mongodb://localhost:27017/craft-skills',
    sessionSecret: process.env.SESSION_SECRET || 'default-secret',
    env: process.env.NODE_ENV || 'development',
    redisHost: process.env.REDIS_HOST || 'redis://localhost:6379',

    // Use the SAME names as your .env file
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
    CLOUDINARY_CLOUD_KEY: process.env.CLOUDINARY_CLOUD_KEY || '',
    CLOUDINARY_CLOUD_SECRET: process.env.CLOUDINARY_CLOUD_SECRET || '',
};

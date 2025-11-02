import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
    port: process.env.PORT || 5000,
    databaseUrl: process.env.DATABASE_URL || 'mongodb://localhost:27017/craft-skills',
    sessionSecret: process.env.SESSION_SECRET || 'default-secret',
    env: process.env.NODE_ENV || 'development',
};

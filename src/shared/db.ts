import mongoose from 'mongoose';
import config from '@/config';
import logger from './logger';

const connectDB = async (): Promise<void> => {
    try {
        await mongoose.connect(config.databaseUrl, {
            maxPoolSize: 100,
            minPoolSize: 10,
            socketTimeoutMS: 45000,
            serverSelectionTimeoutMS: 5000,
        });

        logger.info('MongoDB connected successfully with connection pool (max 100)');
    } catch (error) {
        logger.error('Failed to connect MongoDB', error);
        process.exit(1);
    }
};

export default connectDB;

// import mongoose from 'mongoose';
// import config from '@/config/index';
// import logger from './logger';

// const connectDB = async (): Promise<void> => {
//     try {
//         await mongoose.connect(config.databaseUrl as string);
//         logger.info('MongoDB connected successfully');
//     } catch (error) {
//         logger.error('Failed to connect to MongoDB', error);
//         process.exit(1);
//     }
// };

// export default connectDB;

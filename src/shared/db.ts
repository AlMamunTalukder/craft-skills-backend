import mongoose from 'mongoose';
import config from '@/config/index';
import logger from './logger';

const connectDB = async (): Promise<void> => {
    try {
        await mongoose.connect(config.databaseUrl as string);
        logger.info('MongoDB connected successfully');
    } catch (error) {
        logger.error('Failed to connect to MongoDB', error);
        process.exit(1);
    }
};

export default connectDB;

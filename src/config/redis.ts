import { createClient } from 'redis';
import config from './index';
import logger from '../shared/logger';

const redisClient = createClient({
    url: config.redisHost,
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));

export const connectRedis = async (): Promise<void> => {
    await redisClient.connect();
    logger.info('Redis connected successfully');
};

export default redisClient;

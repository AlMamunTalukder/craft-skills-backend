import type { RedisOptions } from 'bullmq';
import config from '../config';

const redisUrl = new URL(config.redisHost);

export const redisConnection: RedisOptions = {
    host: redisUrl.hostname,
    port: parseInt(redisUrl.port) || 6379,
    password: redisUrl.password || undefined,
    username: redisUrl.username || undefined,
};

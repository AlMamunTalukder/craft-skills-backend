import { Queue } from 'bullmq';
import { redisConnection } from './connection';

export const exclusiveGiftQueue = new Queue('exclusive-gift-queue', {
    connection: redisConnection,
});

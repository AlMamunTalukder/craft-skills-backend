import { Queue } from 'bullmq';
import { redisConnection } from './connection';

export const exclusiveOfferQueue = new Queue('exclusive-offer-queue', {
    connection: redisConnection,
});

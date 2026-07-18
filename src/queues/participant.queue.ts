import { Queue } from 'bullmq';
import { redisConnection } from './connection';

export const participantQueue = new Queue('participant-queue', {
    connection: redisConnection,
});
